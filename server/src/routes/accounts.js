const express = require('express');
const router = express.Router();

module.exports = (prisma, waManager) => {
    // Listar todas as contas com status real de conexão
    router.get('/', async (req, res) => {
        try {
            const accounts = await prisma.account.findMany({
                orderBy: { createdAt: 'desc' }
            });

            // Adiciona status real de conexão do WhatsApp
            const accountsWithStatus = accounts.map(account => ({
                ...account,
                status: waManager.isConnected(account.id) ? 'connected' : account.status
            }));

            res.json(accountsWithStatus);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // Criar nova conta
    router.post('/', async (req, res) => {
        try {
            const { name } = req.body;
            const account = await prisma.account.create({
                data: { name }
            });
            res.json(account);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // Update Account (Settings)
    router.patch('/:id', async (req, res) => {
        try {
            const { id } = req.params;
            const { dailyLimit, minDelay, maxDelay, autoPause, pauseAfter, pauseDuration, useTyping } = req.body;

            const updated = await prisma.account.update({
                where: { id },
                data: {
                    dailyLimit,
                    minDelay,
                    maxDelay,
                    autoPause,
                    pauseAfter,
                    pauseDuration,
                    useTyping
                }
            });
            res.json(updated);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // Conectar conta (inicia cliente WhatsApp)
    router.post('/:id/connect', async (req, res) => {
        try {
            const { id } = req.params;
            await waManager.initClient(id);
            res.json({ message: 'Conectando...' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // Desconectar conta
    router.post('/:id/disconnect', async (req, res) => {
        try {
            const { id } = req.params;
            await waManager.disconnectClient(id);
            res.json({ message: 'Desconectado' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // Deletar conta
    router.delete('/:id', async (req, res) => {
        try {
            const { id } = req.params;
            await waManager.disconnectClient(id);
            await prisma.account.delete({ where: { id } });
            res.json({ message: 'Conta removida' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    return router;
};
