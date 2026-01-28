const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');

module.exports = (prisma, upload, uploadsDir) => {
    // Listar todos os jobs
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

    // Criar novo job (agendamento)
    router.post('/', upload.single('media'), async (req, res) => {
        try {
            console.log('📝 Recebendo novo agendamento:', req.body);
            console.log('📁 Arquivo recebido:', req.file ? req.file.filename : 'Nenhum');

            const { accountId, caption, scheduledAt, repeatType, repeatDays } = req.body;

            let finalScheduledAt = new Date(scheduledAt);

            // Lógica de escalonamento: verifica se já existe job neste minuto
            // Se existir, adiciona 1 minuto até achar um horário livre
            while (true) {
                const conflict = await prisma.job.findFirst({
                    where: {
                        scheduledAt: {
                            gte: finalScheduledAt,
                            lt: new Date(finalScheduledAt.getTime() + 60000) // Dentro do mesmo minuto
                        }
                    }
                });

                if (!conflict) {
                    break; // Horário livre!
                }

                console.log(`⚠️ Conflito de horário em ${finalScheduledAt.toISOString()}. Adicionando 1 minuto...`);
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

            console.log('✅ Agendamento criado com sucesso:', job.id);
            res.json(job);
        } catch (error) {
            console.error('❌ Erro ao criar agendamento:', error);
            res.status(500).json({ error: error.message });
        }
    });

    // Deletar job
    router.delete('/:id', async (req, res) => {
        try {
            const { id } = req.params;
            const job = await prisma.job.delete({ where: { id } });

            // Remove o arquivo de mídia se existir
            if (job.mediaPath) {
                const filePath = path.join(uploadsDir, job.mediaPath);
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            }

            res.json({ message: 'Job removido' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    return router;
};
