const { MessageMedia } = require('whatsapp-web.js');
const path = require('path');
const fs = require('fs');

class AutoReplyService {
    constructor(prisma, waService) {
        this.prisma = prisma;
        this.waService = waService;
    }

    async handleMessage({ accountId, message }) {
        // Ignora status
        if (message.from === 'status@broadcast') return;

        try {
            const body = message.body || '';
            if (!body) return;

            // Busca regras ativas para esta conta, ordenadas por prioridade
            const rules = await this.prisma.autoReply.findMany({
                where: {
                    accountId: accountId,
                    isActive: true
                },
                orderBy: { priority: 'desc' }
            });

            const isGroup = message.from.includes('@g.us');
            const now = new Date();
            const currentTime = now.getHours() * 60 + now.getMinutes(); // Minutos desde 00:00

            for (const rule of rules) {
                // 1. Filtros de Ambiente (Grupo vs Privado)
                if (rule.isGroup && !isGroup) continue; // Regra só para grupo, mas é privado
                if (rule.isPrivate && isGroup) continue; // Regra só para privado, mas é grupo

                // 2. Filtro de Horário
                if (rule.startTime && rule.endTime) {
                    const [startH, startM] = rule.startTime.split(':').map(Number);
                    const [endH, endM] = rule.endTime.split(':').map(Number);
                    const startTotal = startH * 60 + startM;
                    const endTotal = endH * 60 + endM;

                    if (currentTime < startTotal || currentTime > endTotal) continue;
                }

                // 3. Casamento de Texto (Matching)
                let match = false;
                if (rule.matchType === 'exact') {
                    match = body.toLowerCase() === rule.trigger.toLowerCase();
                } else if (rule.matchType === 'contains') {
                    match = body.toLowerCase().includes(rule.trigger.toLowerCase());
                } else if (rule.matchType === 'regex') {
                    try {
                        const regex = new RegExp(rule.trigger, 'i');
                        match = regex.test(body);
                    } catch (e) {
                        console.error(`Regex inválido na regra ${rule.id}: ${rule.trigger}`);
                    }
                }

                if (match) {
                    console.log(`🤖 AutoReply disparado para ${message.from}: "${rule.trigger}"`);

                    // Delay Artificial
                    if (rule.delay > 0) {
                        await new Promise(r => setTimeout(r, rule.delay * 1000));
                    }

                    // Preparar Resposta
                    let responseContent = rule.response;
                    const options = {};

                    // Mídia
                    if (rule.mediaPath) {
                        const userDataPath = process.env.USER_DATA_PATH;
                        const mediaFullPath = userDataPath
                            ? path.join(userDataPath, 'uploads', rule.mediaPath)
                            : path.join(__dirname, '..', '..', '..', 'uploads', rule.mediaPath);

                        try {
                            if (fs.existsSync(mediaFullPath)) {
                                const media = MessageMedia.fromFilePath(mediaFullPath);
                                // Se tem texto junto com mídia, envia como caption ou msg separada?
                                // whatsapp-web.js sendMedia suporta caption
                                responseContent = media;
                                if (rule.response) options.caption = rule.response;
                            }
                        } catch (err) {
                            console.error('Erro ao carregar mídia autoreply:', err);
                        }
                    }

                    // Envia resposta
                    await message.reply(responseContent, undefined, options);

                    // Para na primeira regra de maior prioridade encontrada
                    return;
                }
            }

        } catch (error) {
            console.error('Erro no AutoReply:', error);
        }
    }
}

module.exports = AutoReplyService;
