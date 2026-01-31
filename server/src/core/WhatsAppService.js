const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const path = require('path');
const fs = require('fs');
const EventEmitter = require('events');

class WhatsAppService extends EventEmitter {
    constructor(io, prisma) {
        super(); // Permite emitir eventos
        this.clients = new Map();
        this.io = io;
        this.prisma = prisma;

        // Caminho de sessões dinâmico
        const userDataPath = process.env.USER_DATA_PATH;
        this.sessionsPath = userDataPath
            ? path.join(userDataPath, 'sessions')
            : path.join(__dirname, '..', '..', 'sessions'); // Ajustado para voltar duas pastas de src/core

        this.reconnectAttempts = new Map();
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 10000;

        if (!fs.existsSync(this.sessionsPath)) {
            fs.mkdirSync(this.sessionsPath, { recursive: true });
        }
    }

    async initClient(accountId, isReconnect = false) {
        if (this.clients.has(accountId)) {
            const existingClient = this.clients.get(accountId);
            if (existingClient?.info?.wid) {
                console.log(`Cliente ${accountId} já existe e está conectado`);
                return existingClient;
            }
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

        const getWindowsChromePath = () => {
            const paths = [
                'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
                'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
                'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
                'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
            ];
            return paths.find(p => fs.existsSync(p));
        };

        const isWindows = process.platform === 'win32';
        const chromePath = isWindows ? getWindowsChromePath() : undefined;

        const client = new Client({
            authStrategy: new LocalAuth({
                clientId: accountId,
                dataPath: this.sessionsPath
            }),
            puppeteer: {
                executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || chromePath || undefined,
                headless: true,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--no-first-run',
                    '--no-zygote',
                    '--disable-gpu',
                    '--disable-software-rasterizer',
                    '--disable-extensions'
                ]
            },
            webVersionCache: {
                type: 'remote',
                remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html',
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

            if (info?.wid?.user) {
                await this.prisma.account.update({
                    where: { id: accountId },
                    data: { phoneNumber: info.wid.user }
                });
            }

            this.reconnectAttempts.delete(accountId);
            this.emit('ready', { accountId, client }); // Emite evento interno
        });

        client.on('authenticated', async () => {
            console.log(`🔐 Cliente ${account.name} autenticado`);

            try {
                const updated = await this.prisma.account.update({
                    where: { id: accountId },
                    data: { status: 'connected' }
                });
                console.log(`✅ DB Atualizado: ${updated.status}`);
            } catch (dbError) {
                console.error(`❌ Erro DB authenticated: ${dbError.message}`);
            }

            this.io.emit(`status:${accountId}`, 'connected');
            this.io.emit('notification', {
                type: 'success',
                title: 'WhatsApp Conectado',
                message: `A conta "${account.name}" foi autenticada!`,
                accountId
            });
        });

        client.on('auth_failure', async (message) => {
            console.log(`❌ Falha na autenticação: ${message}`);

            await this.prisma.account.update({
                where: { id: accountId },
                data: { status: 'disconnected' }
            });

            this.clients.delete(accountId);
            this.io.emit(`status:${accountId}`, 'disconnected');
            this.io.emit('notification', {
                type: 'error',
                title: 'Falha na Autenticação',
                message: `Falha ao autenticar "${account.name}".`,
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

            this.io.emit('notification', {
                type: 'warning',
                title: 'WhatsApp Desconectado',
                message: `A conta "${account.name}" foi desconectada. Reconectando...`,
                accountId
            });

            await this.scheduleReconnect(accountId, account.name);
        });

        // Encaminha eventos de mensagem para o sistema de módulos
        client.on('message', async (message) => {
            this.emit('message', { accountId, message, client });
        });

        // Para mensagens enviadas por mim (útil para logs ou triggers)
        client.on('message_create', async (message) => {
            this.emit('message_create', { accountId, message, client });
        });

        this.clients.set(accountId, client);

        try {
            await client.initialize();
        } catch (error) {
            console.error(`❌ Erro init ${account.name}:`, error.message);
            this.clients.delete(accountId);
            await this.scheduleReconnect(accountId, account.name);
            throw error;
        }

        return client;
    }

    async scheduleReconnect(accountId, accountName) {
        const attempts = this.reconnectAttempts.get(accountId) || 0;

        // Backoff exponencial com jitter
        const baseDelay = 30000; // 30 segundos base
        const maxDelay = 300000; // 5 minutos máximo
        const jitter = Math.random() * 5000; // 0-5s de variação aleatória
        const delay = Math.min(baseDelay * Math.pow(1.5, attempts), maxDelay) + jitter;

        this.reconnectAttempts.set(accountId, attempts + 1);

        console.log(`⏱️ Reconectando ${accountName} em ${Math.round(delay / 1000)}s (Tentativa ${attempts + 1})...`);

        // Notifica a cada 5 tentativas para não spammar
        if ((attempts + 1) % 5 === 0) {
            this.io.emit('notification', {
                type: 'info',
                title: 'Reconectando...',
                message: `Ainda tentando reconectar "${accountName}" (Tentativa ${attempts + 1})...`,
                accountId
            });
        }

        setTimeout(async () => {
            try {
                if (this.isConnected(accountId) || !this.reconnectAttempts.has(accountId)) {
                    console.log(`✅ ${accountName} já conectado ou reconexão cancelada.`);
                    this.reconnectAttempts.delete(accountId);
                    return;
                }

                const account = await this.prisma.account.findUnique({
                    where: { id: accountId }
                });

                if (!account) {
                    console.log(`Conta removida, cancelando reconexão.`);
                    this.reconnectAttempts.delete(accountId);
                    return;
                }

                if (this.clients.has(accountId)) {
                    try {
                        const oldClient = this.clients.get(accountId);
                        oldClient.removeAllListeners(); // Limpa listeners para evitar vazamento
                        await oldClient.destroy();
                    } catch (e) { }
                    this.clients.delete(accountId);
                }

                await this.initClient(accountId, true);

            } catch (error) {
                console.error(`Erro reconexão ${accountName}:`, error.message);
                await this.scheduleReconnect(accountId, accountName);
            }
        }, delay);
    }

    async initAllSavedClients() {
        console.log('🔄 Iniciando clientes salvos...');
        const accounts = await this.prisma.account.findMany({
            where: {
                status: { in: ['connected', 'qr_pending'] }
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
    }

    async postStatus(accountId, mediaPath, caption) {
        const client = this.clients.get(accountId);
        if (!client || !client.info?.wid) {
            throw new Error(`Cliente ${accountId} indisponível`);
        }

        const media = MessageMedia.fromFilePath(mediaPath);
        await client.sendMessage('status@broadcast', media, { caption: caption || '' });

        // Emitir evento de sucesso opcionalmente
        return true;
    }

    async sendMessage(accountId, to, content, options = {}) {
        const client = this.clients.get(accountId);
        if (!client || !client.info?.wid) {
            throw new Error(`Cliente ${accountId} indisponível`);
        }

        // --- PROTEÇÃO ANTI-BAN ---
        const account = await this.prisma.account.findUnique({
            where: { id: accountId }
        });

        // 1. Reset diário se necessário
        const now = new Date();
        const lastReset = new Date(account.lastReset);
        if (now.getDate() !== lastReset.getDate()) {
            await this.prisma.account.update({
                where: { id: accountId },
                data: { dailyCount: 0, lastReset: now }
            });
            account.dailyCount = 0;
        }

        // 2. Verificar Limite Diário
        if (account.dailyLimit > 0 && account.dailyCount >= account.dailyLimit) {
            throw new Error(`Limite diário de envio atingido (${account.dailyLimit})`);
        }

        // 3. Simular Digitação (Typing)
        const chatId = to.includes('@') ? to : `${to}@c.us`;

        if (options.useTyping !== false && account.useTyping) {
            // Default true, unless explicitly disabled in options or account settings
            try {
                const chat = await client.getChatById(chatId);

                // Tempo variável baseado no tamanho da mensagem (aprox 50ms por char, min 2s)
                const typingDuration = Math.max(2000, Math.min(10000, content ? content.length * 50 : 2000));

                await chat.sendStateTyping();
                await new Promise(r => setTimeout(r, typingDuration));
                await chat.clearState();
            } catch (e) {
                console.error('Erro simulando digitação:', e);
            }
        }
        // -------------------------

        let messageContent = content;
        let messageOptions = {};

        // Handle Media
        if (options.mediaPath) {
            try {
                messageContent = MessageMedia.fromFilePath(options.mediaPath);
                if (content) messageOptions.caption = content; // If text is provided with media, it's a caption
            } catch (err) {
                console.error(`Erro ao carregar mídia: ${options.mediaPath}`, err);
                throw new Error('Falha ao carregar arquivo de mídia');
            }
        }

        try {
            const result = await client.sendMessage(chatId, messageContent, messageOptions);

            // 4. Incrementar Contador
            await this.prisma.account.update({
                where: { id: accountId },
                data: { dailyCount: { increment: 1 } }
            });

            return result;
        } catch (error) {
            console.error(`Erro ao enviar mensagem para ${to}:`, error);
            throw error;
        }
    }

    async disconnectClient(accountId) {
        const client = this.clients.get(accountId);
        this.reconnectAttempts.delete(accountId);

        if (client) {
            try { await client.destroy(); } catch (e) { }
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
}

module.exports = WhatsAppService;
