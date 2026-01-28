const express = require('express');
const router = express.Router();

module.exports = (prisma) => {
    // Stats do dashboard
    router.get('/', async (req, res) => {
        try {
            const totalAccounts = await prisma.account.count();
            const connectedAccounts = await prisma.account.count({
                where: { status: 'connected' }
            });
            const pendingJobs = await prisma.job.count({
                where: { status: 'pending' }
            });
            const completedJobs = await prisma.job.count({
                where: { status: 'sent' }
            });

            res.json({
                totalAccounts,
                connectedAccounts,
                pendingJobs,
                completedJobs
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    return router;
};
