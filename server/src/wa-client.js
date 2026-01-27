const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const path = require('path');
const fs = require('fs');

class WAClientManager {
  constructor(io, prisma) {
    this.clients = new Map();
    this.io = io;
    this.prisma = prisma;
    this.sessionsPath = path.join(__dirname, '..', 'sessions');
    this.reconnectAttempts = new Map(); // Controla tentativas de reconexão
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 10000; // 10 segundos entre tentativas

    if (!fs.existsSync(this.sessionsPath)) {
      fs.mkdirSync(this.sessionsPath, { recursive: true });
    }
  }

  async initClient(accountId, isReconnect = false) {
    // Se já existe um cliente ativo, retorna ele
    if (this.clients.has(accountId)) {
      const existingClient = this.clients.get(accountId);
      if (existingClient?.info?.wid) {
        console.log(`Cliente ${accountId} já existe e está conectado`);
        return existingClient;
      }
      // Se existe mas não está conectado, remove para recriar
      try {
        await existingClient.destroy();
      } catch (e) {
        // Ignora erro ao destruir
      }
      this.clients.delete(accountId);
    }

    const account = await this.prisma.account.findUnique({
      where: { id: accountId }
    });

    if (!account) {
      throw new Error(`Conta ${accountId} não encontrada`);
    }

    console.log(`${isReconnect ? '🔄 Reconectando' : '🚀 Iniciando'} cliente para ${account.name}...`);

    const client = new Client({
      authStrategy: new LocalAuth({
        clientId: accountId,
        dataPath: this.sessionsPath
      }),
      puppeteer: {
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu'
        ]
      }
    });

    client.on('qr', async (qr) => {
      console.log(`📱 QR Code gerado para conta ${account.name}`);
      const qrDataUrl = await qrcode.toDataURL(qr);

      await this.prisma.account.update({
        where: { id: accountId },
        data: { status: 'qr_pending' }
      });

      this.io.emit(`qr:${accountId}`, qrDataUrl);
      // Notifica globalmente que precisa escanear QR
      this.io.emit('notification', {
        type: 'warning',
        title: 'QR Code Necessário',
        message: `A conta "${account.name}" precisa escanear o QR Code para conectar.`,
        accountId
      });
    });

    client.on('ready', async () => {
      console.log(`✅ Cliente ${account.name} está pronto!`);
      const info = client.info;

      // Reseta tentativas de reconexão ao conectar com sucesso
      this.reconnectAttempts.delete(accountId);

      await this.prisma.account.update({
        where: { id: accountId },
        data: {
          status: 'connected',
          phoneNumber: info?.wid?.user || null
        }
      });

      this.io.emit(`status:${accountId}`, 'connected');
      this.io.emit('notification', {
        type: 'success',
        title: 'WhatsApp Conectado',
        message: `A conta "${account.name}" está conectada e pronta para enviar status!`,
        accountId
      });
    });

    client.on('authenticated', () => {
      console.log(`🔐 Cliente ${account.name} autenticado`);
    });

    client.on('auth_failure', async (message) => {
      console.log(`❌ Falha na autenticação do cliente ${account.name}: ${message}`);

      await this.prisma.account.update({
        where: { id: accountId },
        data: { status: 'disconnected' }
      });

      this.clients.delete(accountId);
      this.io.emit(`status:${accountId}`, 'disconnected');
      this.io.emit('notification', {
        type: 'error',
        title: 'Falha na Autenticação',
        message: `A conta "${account.name}" falhou ao autenticar. Tente conectar novamente.`,
        accountId
      });
    });

    client.on('disconnected', async (reason) => {
      console.log(`⚠️ Cliente ${account.name} desconectado: ${reason}`);

      await this.prisma.account.update({
        where: { id: accountId },
        data: { status: 'disconnected' }
      });

      this.clients.delete(accountId);
      this.io.emit(`status:${accountId}`, 'disconnected');

      // Notifica desconexão
      this.io.emit('notification', {
        type: 'warning',
        title: 'WhatsApp Desconectado',
        message: `A conta "${account.name}" foi desconectada. Tentando reconectar...`,
        accountId
      });

      // Tenta reconectar automaticamente
      await this.scheduleReconnect(accountId, account.name);
    });

    // Evento para monitorar mudanças de estado
    client.on('change_state', (state) => {
      console.log(`📊 Estado do cliente ${account.name}: ${state}`);
    });

    this.clients.set(accountId, client);

    try {
      await client.initialize();
    } catch (error) {
      console.error(`❌ Erro ao inicializar cliente ${account.name}:`, error.message);
      this.clients.delete(accountId);

      // Se falhou ao inicializar, tenta reconectar
      if (!isReconnect) {
        await this.scheduleReconnect(accountId, account.name);
      }
      throw error;
    }

    return client;
  }

  async scheduleReconnect(accountId, accountName) {
    const attempts = this.reconnectAttempts.get(accountId) || 0;

    if (attempts >= this.maxReconnectAttempts) {
      console.log(`❌ Máximo de tentativas de reconexão atingido para ${accountName}`);
      this.reconnectAttempts.delete(accountId);

      this.io.emit('notification', {
        type: 'error',
        title: 'Reconexão Falhou',
        message: `Não foi possível reconectar a conta "${accountName}" após ${this.maxReconnectAttempts} tentativas. Conecte manualmente.`,
        accountId
      });
      return;
    }

    this.reconnectAttempts.set(accountId, attempts + 1);
    const delay = this.reconnectDelay * (attempts + 1); // Delay progressivo

    console.log(`⏱️ Tentando reconectar ${accountName} em ${delay / 1000}s (tentativa ${attempts + 1}/${this.maxReconnectAttempts})`);

    this.io.emit('notification', {
      type: 'info',
      title: 'Reconectando...',
      message: `Tentativa ${attempts + 1}/${this.maxReconnectAttempts} de reconectar "${accountName}" em ${delay / 1000}s`,
      accountId
    });

    setTimeout(async () => {
      try {
        // Verifica se a conta ainda existe
        const account = await this.prisma.account.findUnique({
          where: { id: accountId }
        });

        if (account) {
          await this.initClient(accountId, true);
        }
      } catch (error) {
        console.error(`Erro na reconexão de ${accountName}:`, error.message);
        // Continua tentando
        await this.scheduleReconnect(accountId, accountName);
      }
    }, delay);
  }

  // Inicia todos os clientes salvos no banco
  async initAllSavedClients() {
    console.log('🔄 Iniciando clientes salvos...');

    const accounts = await this.prisma.account.findMany({
      where: {
        status: {
          in: ['connected', 'qr_pending']
        }
      }
    });

    for (const account of accounts) {
      try {
        console.log(`  → Iniciando ${account.name}...`);
        await this.initClient(account.id, true);
      } catch (error) {
        console.error(`  → Erro ao iniciar ${account.name}:`, error.message);
      }
    }

    console.log(`✅ ${accounts.length} conta(s) processada(s)`);
  }

  async postStatus(accountId, mediaPath, caption) {
    const client = this.clients.get(accountId);

    if (!client) {
      throw new Error(`Cliente ${accountId} não encontrado`);
    }

    if (!client.info?.wid) {
      throw new Error(`Cliente ${accountId} não está pronto`);
    }

    try {
      const media = MessageMedia.fromFilePath(mediaPath);

      console.log(`📤 Enviando status para conta ${accountId}...`);
      console.log(`   Mídia: ${media.mimetype}, ${(media.data.length / 1024).toFixed(0)} KB`);

      // Tenta enviar usando sendMessage (método padrão da lib)
      try {
        await client.sendMessage('status@broadcast', media, { caption: caption || '' });
        console.log(`   ✅ Enviado via sendMessage`);
      } catch (err1) {
        console.error(`   ❌ sendMessage falhou:`, err1);
        throw new Error(`Falha no envio padrão: ${err1.message}`);
      }

      console.log(`📤 Status postado para conta ${accountId}`);

      // Notifica sucesso
      const account = await this.prisma.account.findUnique({
        where: { id: accountId }
      });

      this.io.emit('notification', {
        type: 'success',
        title: 'Status Enviado',
        message: `Status enviado com sucesso pela conta "${account?.name || 'Desconhecida'}"!`,
        accountId
      });

      return true;
    } catch (error) {
      console.error(`❌ Erro crítico ao postar status para ${accountId}:`, error);
      throw error;
    }
  }

  async disconnectClient(accountId) {
    const client = this.clients.get(accountId);

    // Cancela reconexões pendentes
    this.reconnectAttempts.delete(accountId);

    if (client) {
      try {
        await client.destroy();
      } catch (e) {
        console.log('Erro ao destruir cliente:', e.message);
      }
      this.clients.delete(accountId);
    }

    await this.prisma.account.update({
      where: { id: accountId },
      data: { status: 'disconnected' }
    });
  }

  getClient(accountId) {
    return this.clients.get(accountId);
  }

  isConnected(accountId) {
    const client = this.clients.get(accountId);
    return client?.info?.wid ? true : false;
  }

  // Retorna status detalhado de todas as contas
  async getStatus() {
    const accounts = await this.prisma.account.findMany();
    return accounts.map(account => ({
      ...account,
      isReallyConnected: this.isConnected(account.id)
    }));
  }
}

module.exports = WAClientManager;
