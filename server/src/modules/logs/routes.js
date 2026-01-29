const express = require('express');
const router = express.Router();

module.exports = (logService) => {
    // Get Logs
    router.get('/', async (req, res) => {
        try {
            const { accountId, campaignId, limit, offset } = req.query;
            const result = await logService.getLogs({ accountId, campaignId, limit, offset });
            res.json(result);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // Export Logs
    router.get('/export', async (req, res) => {
        try {
            const { accountId, campaignId } = req.query;
            const csv = await logService.exportLogs({ accountId, campaignId });

            res.header('Content-Type', 'text/csv');
            res.attachment('logs.csv');
            return res.send(csv);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: error.message });
        }
    });

    return router;
};
