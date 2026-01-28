const express = require('express');
const router = express.Router();

module.exports = (prisma, upload) => {
    // Upload de mídia
    router.post('/', upload.single('media'), async (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({ error: 'Nenhum arquivo enviado' });
            }

            const media = await prisma.media.create({
                data: {
                    filename: req.file.filename,
                    mimetype: req.file.mimetype,
                    path: req.file.path,
                    size: req.file.size
                }
            });

            res.json(media);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    return router;
};
