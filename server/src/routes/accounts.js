const express = require('express');
const router = express.Router();

module.exports = (prisma, waManager) => {
    // Listar todas as contas
    router.get('/', async (req, res) => {
        try {
            const accounts = await waManager.getStatus();
            res.json(accounts);
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
