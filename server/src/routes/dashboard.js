const express = require('express');
const router = express.Router();

module.exports = (prisma) => {
    // Stats completos do dashboard
    router.get('/', async (req, res) => {
        try {
            // === CONTAS ===
            const totalAccounts = await prisma.account.count();
            const connectedAccounts = await prisma.account.count({
                where: { status: 'connected' }
            });

            // === JOBS (Status) ===
            const pendingJobs = await prisma.job.count({
                where: { status: 'pending' }
            });
            const completedJobs = await prisma.job.count({
                where: { status: 'sent' }
            });
            const failedJobs = await prisma.job.count({
                where: { status: 'failed' }
            });

            // === CAMPANHAS ===
            const runningCampaigns = await prisma.campaign.count({
                where: { status: 'running' }
            });
            const totalCampaigns = await prisma.campaign.count();

            // Mensagens enviadas hoje (campanhas)
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const messagesToday = await prisma.campaignItem.count({
                where: {
                    status: 'sent',
                    sentAt: { gte: today }
                }
            });

            // === AUTO REPLIES ===
            const activeAutoReplies = await prisma.autoReply.count({
                where: { isActive: true }
            });

            // === ERROS NAS ÚLTIMAS 24H ===
            const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
            const errorsLast24h = await prisma.activityLog.count({
                where: {
                    type: 'error',
                    createdAt: { gte: yesterday }
                }
            });

            // === PRÓXIMOS AGENDAMENTOS ===
            const upcomingJobs = await prisma.job.findMany({
                where: {
                    status: 'pending',
                    scheduledAt: { gt: new Date() }
                },
                orderBy: { scheduledAt: 'asc' },
                take: 5,
                include: {
                    account: { select: { name: true } }
                }
            });

            // === CAMPANHAS EM ANDAMENTO (com progresso) ===
            const activeCampaigns = await prisma.campaign.findMany({
                where: { status: 'running' },
                include: {
                    account: { select: { name: true } },
                    _count: {
                        select: { items: true }
                    }
                }
            });

            // Para cada campanha ativa, pegar progresso
            const campaignsWithProgress = await Promise.all(
                activeCampaigns.map(async (campaign) => {
                    const sentCount = await prisma.campaignItem.count({
                        where: { campaignId: campaign.id, status: 'sent' }
                    });
                    return {
                        id: campaign.id,
                        name: campaign.name,
                        account: campaign.account.name,
                        total: campaign._count.items,
                        sent: sentCount,
                        progress: campaign._count.items > 0
                            ? Math.round((sentCount / campaign._count.items) * 100)
                            : 0
                    };
                })
            );

            // === ATIVIDADE RECENTE ===
            const recentActivity = await prisma.activityLog.findMany({
                orderBy: { createdAt: 'desc' },
                take: 10,
                include: {
                    account: { select: { name: true } },
                    campaign: { select: { name: true } }
                }
            });

            res.json({
                // Overview
                totalAccounts,
                connectedAccounts,
                messagesToday,
                errorsLast24h,

                // Jobs (Status)
                pendingJobs,
                completedJobs,
                failedJobs,

                // Campanhas
                runningCampaigns,
                totalCampaigns,

                // Auto Replies
                activeAutoReplies,

                // Detalhes
                upcomingJobs,
                activeCampaigns: campaignsWithProgress,
                recentActivity
            });
        } catch (error) {
            console.error('Erro ao buscar stats:', error);
            res.status(500).json({ error: error.message });
        }
    });

    return router;
};

