const cron = require('node-cron');
const path = require('path');
const fs = require('fs');

class SchedulerService {
    constructor(prisma, waService, io) {
        this.prisma = prisma;
        this.waService = waService;
        this.io = io;
        this.cronJob = null;
        this.processingJobs = new Set();
    }

    start() {
        this.cronJob = cron.schedule('* * * * *', () => {
            this.checkPendingJobs();
        });
        console.log('⏰ SchedulerService: Monitorando jobs...');
    }

    stop() {
        if (this.cronJob) this.cronJob.stop();
    }

    async checkPendingJobs() {
        const now = new Date();
        try {
            const pendingJobs = await this.prisma.job.findMany({
                where: {
                    status: 'pending',
                    scheduledAt: { lte: now }
                },
                include: { account: true }
            });

            const jobsToProcess = pendingJobs.filter(job => !this.processingJobs.has(job.id));

            for (const job of jobsToProcess) {
                // Marca como em processamento
                this.processingJobs.add(job.id);

                // Usa Promise.resolve para garantir que finally sempre execute
                Promise.resolve()
                    .then(() => this.executeJob(job))
                    .catch(error => {
                        console.error(`❌ Erro ao processar job ${job.id}:`, error.message);
                    })
                    .finally(() => {
                        this.processingJobs.delete(job.id);
                    });
            }
        } catch (error) {
            console.error('Erro no Scheduler:', error);
        }
    }

    async executeJob(job) {
        console.log(`\n📋 Executando job ${job.id.substring(0, 8)}... para ${job.account.name}`);

        try {
            const isConnected = this.waService.isConnected(job.accountId);

            if (!isConnected) {
                console.log(`⚠️ Conta desconectada. Tentando reconectar...`);
                try {
                    await this.waService.initClient(job.accountId, true);
                    // Aguarda breve conexao
                    await new Promise(r => setTimeout(r, 5000));

                    if (!this.waService.isConnected(job.accountId)) {
                        throw new Error('Falha ao reconectar para o job');
                    }
                } catch (err) {
                    console.error(`❌ Falha reconexão job: ${err.message}`);
                    this.io.emit('notification', {
                        type: 'warning',
                        title: 'Job Pendente',
                        message: `Conta ${job.account.name} desconectada. Job mantido na fila.`,
                        accountId: job.accountId
                    });
                    return; // Mantém pendente
                }
            }

            // Path correction logic: we are in src/modules/scheduler
            // Uploads are in project_root/uploads (controlled by env or relative)
            const userDataPath = process.env.USER_DATA_PATH;
            const uploadsDir = userDataPath
                ? path.join(userDataPath, 'uploads')
                : path.join(__dirname, '..', '..', '..', 'uploads');

            if (!job.mediaPath) throw new Error('Job sem mídia');

            const mediaFullPath = path.join(uploadsDir, job.mediaPath);
            if (!fs.existsSync(mediaFullPath)) {
                await this.prisma.job.update({ where: { id: job.id }, data: { status: 'failed' } });
                throw new Error('Arquivo de mídia não encontrado');
            }

            await this.waService.postStatus(job.accountId, mediaFullPath, job.caption);

            await this.prisma.job.update({
                where: { id: job.id },
                data: { status: 'sent', executedAt: new Date() }
            });

            if (job.repeatType) {
                await this.scheduleNextRepetition(job);
            }

            console.log(`✅ Job executado com sucesso!`);

        } catch (error) {
            console.error(`❌ Erro job: ${error.message}`);
            // Só falha se for erro crítico de mídia ou envio, erro de conexão mantem pendente acima
            if (error.message.includes('mídia') || error.message.includes('postar')) {
                await this.prisma.job.update({ where: { id: job.id }, data: { status: 'failed' } });
            }
            this.io.emit('notification', {
                type: 'error',
                title: 'Erro Job',
                message: `Falha job ${job.account.name}: ${error.message}`,
                accountId: job.accountId
            });
        }
    }

    async scheduleNextRepetition(job) {
        const nextDate = this.calculateNextRun(job);
        if (nextDate) {
            await this.prisma.job.create({
                data: {
                    accountId: job.accountId,
                    mediaPath: job.mediaPath,
                    caption: job.caption,
                    scheduledAt: nextDate,
                    repeatType: job.repeatType,
                    repeatDays: job.repeatDays
                }
            });
            console.log(`🔄 Repetição agendada: ${nextDate.toLocaleString()}`);
        }
    }

    calculateNextRun(job) {
        const currentDate = new Date(job.scheduledAt);
        switch (job.repeatType) {
            case 'daily': currentDate.setDate(currentDate.getDate() + 1); return currentDate;
            case 'weekly': currentDate.setDate(currentDate.getDate() + 7); return currentDate;
            case 'custom':
                if (job.repeatDays) {
                    try {
                        const days = JSON.parse(job.repeatDays);
                        const currentDay = currentDate.getDay();
                        let nextDay = days.find(d => d > currentDay);
                        if (nextDay === undefined) {
                            nextDay = days[0];
                            currentDate.setDate(currentDate.getDate() + (7 - currentDay + nextDay));
                        } else {
                            currentDate.setDate(currentDate.getDate() + (nextDay - currentDay));
                        }
                        return currentDate;
                    } catch (e) { return null; }
                }
                return null;
            default: return null;
        }
    }
}

module.exports = SchedulerService;
