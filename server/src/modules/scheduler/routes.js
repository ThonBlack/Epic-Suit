const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');

module.exports = (prisma, service) => {

    // Config Multer localmente para este módulo (ou poderia receber do module manager)
    // Para simplificar, vou duplicar a config de upload aqui por enquanto ou buscar do global.
    // Melhor: definir o multer aqui mesmo.

    const userDataPath = process.env.USER_DATA_PATH;
    const uploadsDir = userDataPath
        ? path.join(userDataPath, 'uploads')
        : path.join(__dirname, '..', '..', '..', 'uploads');

    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

    const storage = multer.diskStorage({
        destination: (req, file, cb) => cb(null, uploadsDir),
        filename: (req, file, cb) => cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname))
    });
    const upload = multer({ storage });

    // Listar jobs
    router.get('/', async (req, res) => {
        try {
            const jobs = await prisma.job.findMany({
                include: { account: true },
                orderBy: { scheduledAt: 'desc' }
            });
            res.json(jobs);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // Criar job
    router.post('/', upload.single('media'), async (req, res) => {
        try {
            console.log('📝 Novo agendamento (via Módulo):', req.body);
            const { accountId, caption, scheduledAt, repeatType, repeatDays } = req.body;
            let finalScheduledAt = new Date(scheduledAt);

            // Evitar conflitos de horário exato (mesmo lógica anterior)
            while (true) {
                const conflict = await prisma.job.findFirst({
                    where: {
                        scheduledAt: {
                            gte: finalScheduledAt,
                            lt: new Date(finalScheduledAt.getTime() + 60000)
                        }
                    }
                });
                if (!conflict) break;
                finalScheduledAt = new Date(finalScheduledAt.getTime() + 60000);
            }

            const job = await prisma.job.create({
                data: {
                    accountId,
                    mediaPath: req.file ? req.file.filename : null,
                    caption,
                    scheduledAt: finalScheduledAt,
                    repeatType: repeatType || null,
                    repeatDays: repeatDays || null
                }
            });

            console.log('✅ Job criado:', job.id);
            res.json(job);
        } catch (error) {
            console.error('❌ Erro criar job:', error);
            res.status(500).json({ error: error.message });
        }
    });

    // Deletar job
    router.delete('/:id', async (req, res) => {
        try {
            const { id } = req.params;
            const job = await prisma.job.delete({ where: { id } });
            if (job.mediaPath) {
                const filePath = path.join(uploadsDir, job.mediaPath);
                if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            }
            res.json({ message: 'Job removido' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    return router;
};
