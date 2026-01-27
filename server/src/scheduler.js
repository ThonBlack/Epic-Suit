const cron = require('node-cron');
const path = require('path');
const fs = require('fs');

class Scheduler {
    constructor(prisma, waManager, io) {
        this.prisma = prisma;
        this.waManager = waManager;
        this.io = io;
        this.cronJob = null;
        this.processingJobs = new Set(); // Evita reprocessar jobs em andamento
    }

    start() {
        // Verifica a cada minuto por jobs pendentes
        this.cronJob = cron.schedule('* * * * *', () => {
            this.checkPendingJobs();
        });

        console.log('Agendador iniciado - verificando a cada minuto');
    }

    stop() {
        if (this.cronJob) {
            this.cronJob.stop();
            console.log('Agendador parado');
        }
    }

    async checkPendingJobs() {
        const now = new Date();

        try {
            const pendingJobs = await this.prisma.job.findMany({
                where: {
                    status: 'pending',
                    scheduledAt: {
                        lte: now
                    }
                },
                include: {
                    account: true
                }
            });

            // Filtra jobs que já estão sendo processados
            const jobsToProcess = pendingJobs.filter(job => !this.processingJobs.has(job.id));

            if (jobsToProcess.length > 0) {
                console.log(`\n⏰ ${jobsToProcess.length} job(s) novo(s) para executar...`);
            }

            for (const job of jobsToProcess) {
                // Adiciona ao Set de processamento SEM await para permitir paralelismo (opcional, mas aqui queremos evitar bloquear o loop)
                // Mas como executeJob é async, vamos apenas marcar e esperar
                this.processingJobs.add(job.id);
                this.executeJob(job).finally(() => {
                    this.processingJobs.delete(job.id);
                });
            }
        } catch (error) {
            console.error('Erro ao verificar jobs pendentes:', error);
        }
    }

    async executeJob(job) {
        console.log(`\n📋 Executando job ${job.id.substring(0, 8)}... para conta "${job.account.name}"`);

        try {
            // Verifica se o cliente existe e está conectado
            const client = this.waManager.getClient(job.accountId);
            const isConnected = this.waManager.isConnected(job.accountId);

            console.log(`   → Cliente existe: ${!!client}`);
            console.log(`   → Cliente conectado: ${isConnected}`);

            if (!isConnected) {
                // Verifica o status no banco
                const accountDb = await this.prisma.account.findUnique({
                    where: { id: job.accountId }
                });

                console.log(`   → Status no banco: ${accountDb?.status}`);

                // Se o banco diz que está conectado mas o cliente não está, tenta reconectar
                if (accountDb?.status === 'connected') {
                    console.log(`   ⚠️ Inconsistência detectada! Banco diz connected mas cliente não está.`);
                    console.log(`   🔄 Tentando inicializar cliente...`);

                    try {
                        await this.waManager.initClient(job.accountId, true);

                        // Aguarda um pouco para o cliente ficar pronto
                        await new Promise(resolve => setTimeout(resolve, 5000));

                        // Verifica novamente
                        if (this.waManager.isConnected(job.accountId)) {
                            console.log(`   ✅ Cliente reconectado com sucesso!`);
                        } else {
                            throw new Error('Cliente não ficou pronto após reconexão');
                        }
                    } catch (reconnectError) {
                        console.log(`   ❌ Falha ao reconectar: ${reconnectError.message}`);

                        // Atualiza o banco para refletir a realidade
                        await this.prisma.account.update({
                            where: { id: job.accountId },
                            data: { status: 'disconnected' }
                        });

                        // Não marca como falho ainda, deixa pendente para próxima tentativa
                        console.log(`   ⏸️ Job mantido como pendente. Conecte a conta manualmente.`);

                        // Notifica o usuário
                        if (this.io) {
                            this.io.emit('notification', {
                                type: 'warning',
                                title: 'Agendamento Pendente',
                                message: `O job para "${job.account.name}" não pôde ser executado. A conta precisa ser conectada.`,
                                accountId: job.accountId
                            });
                        }
                        return; // Não marca como falho, mantém pendente
                    }
                } else {
                    console.log(`   ❌ Conta "${job.account.name}" não está conectada!`);
                    console.log(`   → Conecte a conta via QR Code para que os jobs sejam executados.`);

                    // Não marca como falho imediatamente, mantém pendente
                    console.log(`   ⏸️ Job mantido como pendente.`);

                    // Notifica o usuário
                    if (this.io) {
                        this.io.emit('notification', {
                            type: 'warning',
                            title: 'Conta Desconectada',
                            message: `Conecte a conta "${job.account.name}" para enviar o status agendado.`,
                            accountId: job.accountId
                        });
                    }
                    return; // Mantém pendente
                }
            }

            // Verifica se há mídia
            if (!job.mediaPath) {
                console.log(`   ❌ Job sem mídia definida!`);
                await this.prisma.job.update({
                    where: { id: job.id },
                    data: { status: 'failed' }
                });
                return;
            }

            // Verifica se o arquivo existe
            const mediaFullPath = path.join(__dirname, '..', 'uploads', job.mediaPath);
            if (!fs.existsSync(mediaFullPath)) {
                console.log(`   ❌ Arquivo de mídia não encontrado: ${mediaFullPath}`);
                await this.prisma.job.update({
                    where: { id: job.id },
                    data: { status: 'failed' }
                });
                return;
            }

            console.log(`   📤 Postando status...`);

            // Posta o status
            await this.waManager.postStatus(job.accountId, mediaFullPath, job.caption || '');

            // Atualiza o job como enviado
            await this.prisma.job.update({
                where: { id: job.id },
                data: {
                    status: 'sent',
                    executedAt: new Date()
                }
            });

            // Se for repetitivo, cria o próximo job
            if (job.repeatType) {
                await this.scheduleNextRepetition(job);
            }

            console.log(`   ✅ Job executado com sucesso!`);

        } catch (error) {
            console.error(`   ❌ Erro ao executar job: ${error.message}`);

            // Marca como falho apenas em erros graves
            await this.prisma.job.update({
                where: { id: job.id },
                data: { status: 'failed' }
            });

            // Notifica o usuário
            if (this.io) {
                this.io.emit('notification', {
                    type: 'error',
                    title: 'Erro no Agendamento',
                    message: `Falha ao enviar status pela conta "${job.account.name}": ${error.message}`,
                    accountId: job.accountId
                });
            }
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

            console.log(`   🔄 Próxima execução agendada para ${nextDate.toLocaleString('pt-BR')}`);
        }
    }

    calculateNextRun(job) {
        const currentDate = new Date(job.scheduledAt);

        switch (job.repeatType) {
            case 'daily':
                currentDate.setDate(currentDate.getDate() + 1);
                return currentDate;

            case 'weekly':
                currentDate.setDate(currentDate.getDate() + 7);
                return currentDate;

            case 'custom':
                if (job.repeatDays) {
                    const days = JSON.parse(job.repeatDays);
                    const currentDay = currentDate.getDay();

                    // Encontra o próximo dia na lista
                    let nextDay = days.find(d => d > currentDay);

                    if (nextDay === undefined) {
                        // Se não encontrou, pega o primeiro dia da próxima semana
                        nextDay = days[0];
                        currentDate.setDate(currentDate.getDate() + (7 - currentDay + nextDay));
                    } else {
                        currentDate.setDate(currentDate.getDate() + (nextDay - currentDay));
                    }

                    return currentDate;
                }
                return null;

            default:
                return null;
        }
    }
}

module.exports = Scheduler;
