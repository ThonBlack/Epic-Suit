const express = require('express');
const multer = require('multer');
const path = require('path');
const router = express.Router();

// Upload config
const userDataPath = process.env.USER_DATA_PATH;
const uploadDir = userDataPath ? path.join(userDataPath, 'uploads') : path.join(__dirname, '..', '..', '..', 'uploads');

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage });

module.exports = (prisma) => {

    // Listar regras
    router.get('/:accountId', async (req, res) => {
        try {
            const { accountId } = req.params;
            const rules = await prisma.autoReply.findMany({
                where: { accountId },
                orderBy: { priority: 'desc' } // Ordenar por prioridade
            });
            res.json(rules);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // Criar regra
    router.post('/', upload.single('media'), async (req, res) => {
        try {
            const { accountId, trigger, response, matchType, name, priority, delay, isGroup, isPrivate, startTime, endTime } = req.body;

            let mediaPath = null;
            if (req.file) {
                mediaPath = req.file.filename;
            }

            const rule = await prisma.autoReply.create({
                data: {
                    accountId,
                    trigger,
                    response,
                    matchType: matchType || 'contains',
                    name,
                    priority: parseInt(priority) || 0,
                    delay: parseInt(delay) || 0,
                    isGroup: isGroup === 'true',
                    isPrivate: isPrivate === 'true',
                    mediaPath,
                    startTime,
                    endTime
                }
            });

            res.json(rule);
        } catch (error) {
            console.error('Erro criar regra:', error);
            res.status(500).json({ error: error.message });
        }
    });

    // Deletar regra
    router.delete('/:id', async (req, res) => {
        try {
            const { id } = req.params;
            await prisma.autoReply.delete({ where: { id } });
            res.json({ message: 'Regra removida' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // Alternar status
    router.patch('/:id/toggle', async (req, res) => {
        try {
            const { id } = req.params;
            const { isActive } = req.body;

            const rule = await prisma.autoReply.update({
                where: { id },
                data: { isActive }
            });
            res.json(rule);

        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    return router;
};
