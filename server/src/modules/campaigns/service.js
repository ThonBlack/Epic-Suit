const fs = require('fs');
const path = require('path');
const csv = require('csv-parse');
const XLSX = require('xlsx');

class CampaignService {
    constructor({ prisma, waService, io, logService }) {
        this.prisma = prisma;
        this.waService = waService;
        this.io = io;
        this.logService = logService;
        this.isProcessing = false;
        this.processingInterval = 5000; // Check every 5s
    }

    startQueueProcessor() {
        console.log('🔄 Iniciando processador de fila de campanhas...');
        // Usa setTimeout recursivo ao invés de setInterval
        // para evitar sobreposição de execuções (race condition)
        this.scheduleNextProcess();
    }

    scheduleNextProcess() {
        setTimeout(async () => {
            await this.processQueue();
            this.scheduleNextProcess();
        }, this.processingInterval);
    }

    async createCampaign(data, files) {
        const { name, messageTemplate, accountId, minInterval, maxInterval } = data;
        let mediaPath = null;
        let csvPath = null;

        if (files?.media?.[0]) {
            mediaPath = files.media[0].filename;
        }
        if (files?.csv?.[0]) {
            csvPath = files.csv[0].path;
        }

        if (!csvPath) throw new Error('Arquivo de contatos é obrigatório');

        // Parse file (CSV or XLSX)
        const contacts = await this.parseContactsFile(csvPath);

        if (contacts.length === 0) {
            throw new Error('Nenhum contato válido encontrado no arquivo. Verifique se há colunas de telefone e nome.');
        }

        // Create Campaign
        const campaign = await this.prisma.campaign.create({
            data: {
                name,
                messageTemplate,
                mediaPath,
                minInterval: parseInt(minInterval) || 15,
                maxInterval: parseInt(maxInterval) || 60,
                accountId,
                status: 'pending',
                items: {
                    create: contacts.map(c => ({
                        phone: c.phone,
                        name: c.name || ''
                    }))
                }
            },
            include: { items: true }
        });

        // Cleanup uploaded file
        try { fs.unlinkSync(csvPath); } catch (e) { }

        console.log(`✅ Campanha criada: ${contacts.length} contatos importados`);
        return campaign;
    }

    /**
     * Parser inteligente que suporta CSV e XLSX
     * Detecta automaticamente as colunas de nome e telefone
     */
    async parseContactsFile(filePath) {
        const ext = path.extname(filePath).toLowerCase();

        let rows = [];

        // Ler arquivo baseado na extensão
        if (ext === '.xlsx' || ext === '.xls') {
            rows = this.parseExcel(filePath);
        } else {
            rows = await this.parseCSV(filePath);
        }

        if (rows.length === 0) return [];

        // Detectar colunas automaticamente
        const headers = Object.keys(rows[0]).map(h => h.toLowerCase().trim());

        // Padrões para detectar coluna de telefone
        const phonePatterns = ['phone', 'telefone', 'celular', 'whatsapp', 'numero', 'número', 'fone', 'tel', 'mobile', 'contato'];
        // Padrões para detectar coluna de nome
        const namePatterns = ['name', 'nome', 'cliente', 'contato', 'pessoa', 'destinatario', 'destinatário'];

        let phoneCol = null;
        let nameCol = null;

        // Encontrar colunas
        for (const header of headers) {
            if (!phoneCol && phonePatterns.some(p => header.includes(p))) {
                phoneCol = Object.keys(rows[0]).find(k => k.toLowerCase().trim() === header);
            }
            if (!nameCol && namePatterns.some(p => header.includes(p))) {
                nameCol = Object.keys(rows[0]).find(k => k.toLowerCase().trim() === header);
            }
        }

        // Se não encontrou por nome, tenta detectar por conteúdo
        if (!phoneCol || !nameCol) {
            const firstRow = rows[0];
            for (const [key, value] of Object.entries(firstRow)) {
                const strValue = String(value || '').trim();

                // Detectar telefone: apenas números, 8-15 dígitos
                if (!phoneCol && /^[\d\s\-\(\)\+]+$/.test(strValue)) {
                    const digits = strValue.replace(/\D/g, '');
                    if (digits.length >= 8 && digits.length <= 15) {
                        phoneCol = key;
                    }
                }

                // Detectar nome: texto sem muitos números, não é telefone
                if (!nameCol && strValue.length > 0 && !/^\d+$/.test(strValue) && key !== phoneCol) {
                    nameCol = key;
                }
            }
        }

        console.log(`📊 Colunas detectadas - Telefone: "${phoneCol || 'não encontrado'}", Nome: "${nameCol || 'não encontrado'}"`);

        // Processar contatos
        const contacts = [];
        for (const row of rows) {
            let phone = phoneCol ? String(row[phoneCol] || '').trim() : '';
            let fullName = nameCol ? String(row[nameCol] || '').trim() : '';

            // Limpar telefone (apenas dígitos)
            phone = phone.replace(/\D/g, '');

            // Validar telefone (mínimo 8 dígitos)
            if (phone.length < 8) continue;

            // Adicionar 55 se for número brasileiro sem DDI
            if (phone.length <= 11 && !phone.startsWith('55')) {
                phone = '55' + phone;
            }

            // Extrair primeiro nome
            const firstName = fullName.split(/\s+/)[0] || '';

            contacts.push({
                phone,
                name: fullName,
                firstName
            });
        }

        return contacts;
    }

    parseExcel(filePath) {
        try {
            const workbook = XLSX.readFile(filePath);
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            const data = XLSX.utils.sheet_to_json(sheet, { defval: '' });
            return data;
        } catch (error) {
            console.error('Erro ao ler Excel:', error.message);
            throw new Error(`Erro ao ler arquivo Excel: ${error.message}`);
        }
    }

    async parseCSV(filePath) {
        const content = fs.readFileSync(filePath, 'utf-8');
        return new Promise((resolve, reject) => {
            csv.parse(content, {
                columns: true,
                trim: true,
                skip_empty_lines: true,
                relax_quotes: true,
                relax_column_count: true
            }, (err, records) => {
                if (err) return reject(new Error(`Erro ao ler CSV: ${err.message}`));
                resolve(records);
            });
        });
    }

    async processQueue() {
        if (this.isProcessing) return;
        this.isProcessing = true;

        try {
            // 1. Check for scheduled campaigns that should start
            const scheduledCampaigns = await this.prisma.campaign.findMany({
                where: {
                    status: 'scheduled',
                    scheduledAt: { lte: new Date() }
                }
            });

            for (const campaign of scheduledCampaigns) {
                console.log(`⏰ Iniciando campanha agendada: ${campaign.name}`);
                await this.prisma.campaign.update({
                    where: { id: campaign.id },
                    data: { status: 'running' } // Or 'pending' if you want user to manually start, but request said "Auto start"
                });
            }

            // 2. Process running campaigns (Only 'running', pending waits for user trigger)
            const runningCampaigns = await this.prisma.campaign.findMany({
                where: { status: 'running' },
                include: { account: true }
            });

            for (const campaign of runningCampaigns) {
                // Check if account is globally paused (Auto-Pause)
                if (this.pausedAccounts?.has(campaign.accountId)) continue;
                // Check if account is connected
                if (campaign.account.status !== 'connected') {
                    console.log(`⚠️ Campanha ${campaign.name} pausada: Conta desconectada.`);
                    continue;
                }

                // --- PROTEÇÃO ANTI-BAN (Auto-Pause) ---
                const account = campaign.account;
                if (account.autoPause && account.pauseAfter > 0) {
                    // Verifica se atingiu o lote para pausa
                    // Lógica simplificada: usaremos contador local ou baseado no total enviado hoje
                    // Idealmente, precisaria de um contador de sessão. Vamos usar o dailyCount para estimar ou adicionar contador na campanha.
                    // Para simplificar agora: Pausa baseada no sucesso contínuo de itens desta campanha

                    // Melhor abordagem para agora: Verificar delay aleatório entre mensagens (Min/Max do Account se maior que da Campanha)
                    const minDelay = Math.max(campaign.minInterval, account.minDelay);
                    const maxDelay = Math.max(campaign.maxInterval, account.maxDelay);

                    // Override campaign intervals with account safety settings if stricter
                    campaign.minInterval = minDelay;
                    // maxInterval não é usado na query, mas útil saber
                }
                // ----------------------------------------

                // Check "cooldown" (simple version: verify if last item sent was recently)
                const lastItem = await this.prisma.campaignItem.findFirst({
                    where: { campaignId: campaign.id, status: { in: ['sent', 'failed'] } },
                    orderBy: { updatedAt: 'desc' }
                });

                if (lastItem) {
                    const now = new Date();
                    const diffSeconds = (now - lastItem.updatedAt) / 1000;

                    // Random Delay Calculation
                    // Se não tiver maxInterval, usa minInterval + 50%
                    const effectiveMax = Math.max(campaign.maxInterval, campaign.minInterval * 1.5);
                    const randomDelay = Math.floor(Math.random() * (effectiveMax - campaign.minInterval + 1) + campaign.minInterval);

                    if (diffSeconds < randomDelay) continue;
                }

                // Get next pending item
                const nextItem = await this.prisma.campaignItem.findFirst({
                    where: { campaignId: campaign.id, status: 'pending' },
                    orderBy: { createdAt: 'asc' } // First in, first out
                });

                if (!nextItem) {
                    // Campaign finished?
                    const pendingCount = await this.prisma.campaignItem.count({
                        where: { campaignId: campaign.id, status: 'pending' }
                    });
                    if (pendingCount === 0) {
                        await this.prisma.campaign.update({
                            where: { id: campaign.id },
                            data: { status: 'completed' }
                        });
                    }
                    continue;
                }

                // Send Message
                await this.sendItem(campaign, nextItem);

                // Auto-Pause Logic (Sleep)
                if (account.autoPause && account.pauseDuration > 0) {
                    // Se o contador diário for múltiplo de "pauseAfter", pausa a campanha
                    // Nota: Isso é aproximado se múltiplas campanhas rodam.
                    if (account.dailyCount > 0 && account.dailyCount % account.pauseAfter === 0) {
                        console.log(`🛑 Auto-Pause para conta ${account.name}: Atingiu ${account.pauseAfter} msgs. Pausando ${account.pauseDuration} min.`);

                        // Pausar campanha ou apenas sleeping? 
                        // Sleeping trava o processador de fila para TUDO. 
                        // Melhor: Atualizar status da campanha para 'paused' e agendar retorno ou usar um campo 'pausedUntil'.
                        // Solução simples V1: Apenas logar e pular processamento desta conta por X tempo (via cache em memória)
                        this.pausedAccounts = this.pausedAccounts || new Set();
                        this.pausedAccounts.add(account.id);
                        setTimeout(() => this.pausedAccounts.delete(account.id), account.pauseDuration * 60 * 1000);
                    }
                }
            }

        } catch (error) {
            console.error('Erro processando fila:', error);
        } finally {
            this.isProcessing = false;
        }
    }

    async sendItem(campaign, item) {
        try {
            // Extrair primeiro nome do nome completo
            const firstName = (item.name || '').split(/\s+/)[0] || '';

            // Replace variables
            let message = campaign.messageTemplate
                .replace(/{nome}/gi, item.name || '')
                .replace(/{primeiro_nome}/gi, firstName)
                .replace(/{telefone}/gi, item.phone)
                .replace(/{data}/gi, new Date().toLocaleDateString('pt-BR'));

            message = this.processSpintax(message);

            const options = {};
            // Determine media absolute path
            if (campaign.mediaPath) {
                const userDataPath = process.env.USER_DATA_PATH;
                options.mediaPath = userDataPath
                    ? path.join(userDataPath, 'uploads', campaign.mediaPath)
                    : path.join(__dirname, '..', '..', '..', 'uploads', campaign.mediaPath);
            }

            // Send via WhatsAppService
            await this.waService.sendMessage(campaign.accountId, item.phone, message, options);

            // Update Status: Sent
            await this.prisma.campaignItem.update({
                where: { id: item.id },
                data: { status: 'sent', sentAt: new Date(), errorLog: null }
            });

            // Emit progress update
            this.io.emit('campaign:progress', { campaignId: campaign.id, itemId: item.id, status: 'sent' });

        } catch (error) {
            console.error(`Erro enviando item ${item.id}:`, error.message);
            // Update Status: Failed
            await this.prisma.campaignItem.update({
                where: { id: item.id },
                data: { status: 'failed', errorLog: error.message } // Keep sentAt null
            });
            this.io.emit('campaign:progress', { campaignId: campaign.id, itemId: item.id, status: 'failed' });
        }
    }

    processSpintax(text) {
        // Simple spintax: {Hola|Olá|Oi}
        return text.replace(/\{([^{}]+)\}/g, (match, content) => {
            const choices = content.split('|');
            return choices[Math.floor(Math.random() * choices.length)];
        });
    }

    async getCampaigns() {
        return this.prisma.campaign.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                _count: {
                    select: { items: true }
                }
            }
        });
    }

    async getCampaignDetails(id) {
        const campaign = await this.prisma.campaign.findUnique({
            where: { id },
            include: {
                account: { select: { name: true, phoneNumber: true } },
                items: {
                    orderBy: { createdAt: 'asc' },
                    take: 100 // Cap for performance, maybe paginate later
                }
            }
        });

        if (!campaign) return null;

        // Otimizado: Usa groupBy para fazer 1 query ao invés de 4
        const statusCounts = await this.prisma.campaignItem.groupBy({
            by: ['status'],
            where: { campaignId: id },
            _count: { id: true }
        });

        const stats = {
            total: statusCounts.reduce((acc, s) => acc + s._count.id, 0),
            pending: statusCounts.find(s => s.status === 'pending')?._count.id || 0,
            sent: statusCounts.find(s => s.status === 'sent')?._count.id || 0,
            failed: statusCounts.find(s => s.status === 'failed')?._count.id || 0,
        };

        return { ...campaign, stats };
    }

    async toggleCampaign(id) {
        const campaign = await this.prisma.campaign.findUnique({ where: { id } });
        if (!campaign) throw new Error('Campanha não encontrada');

        const newStatus = campaign.status === 'running' ? 'paused' : 'running';

        // If completed and asked to toggle, maybe restart? For now, only toggle pending/paused/running
        if (campaign.status === 'completed') throw new Error('Campanha finalizada');

        return this.prisma.campaign.update({
            where: { id },
            data: { status: newStatus }
        });
    }
}

module.exports = CampaignService;
