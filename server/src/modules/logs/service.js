const { parse } = require('json2csv');

class LogService {
    constructor(prisma) {
        this.prisma = prisma;
    }

    async log({ accountId, campaignId, type, action, details, metadata }) {
        try {
            await this.prisma.activityLog.create({
                data: {
                    accountId,
                    campaignId,
                    type, // info, warning, error
                    action,
                    details,
                    metadata: metadata ? JSON.stringify(metadata) : null
                }
            });
        } catch (error) {
            console.error('Falha ao salvar log:', error);
        }
    }

    async getLogs({ accountId, campaignId, limit = 100, offset = 0 }) {
        const where = {};
        if (accountId) where.accountId = accountId;
        if (campaignId) where.campaignId = campaignId;

        const [logs, total] = await Promise.all([
            this.prisma.activityLog.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                take: Number(limit),
                skip: Number(offset),
                include: {
                    account: { select: { name: true } },
                    campaign: { select: { name: true } }
                }
            }),
            this.prisma.activityLog.count({ where })
        ]);

        return { logs, total };
    }

    async exportLogs({ accountId, campaignId }) {
        const where = {};
        if (accountId) where.accountId = accountId;
        if (campaignId) where.campaignId = campaignId;

        const logs = await this.prisma.activityLog.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: {
                account: { select: { name: true } },
                campaign: { select: { name: true } }
            }
        });

        const fields = ['createdAt', 'type', 'action', 'details', 'account.name', 'campaign.name'];
        const opts = { fields };

        try {
            const csv = parse(logs, opts);
            return csv;
        } catch (err) {
            console.error(err);
            throw new Error('Erro ao gerar CSV');
        }
    }
}

module.exports = LogService;
