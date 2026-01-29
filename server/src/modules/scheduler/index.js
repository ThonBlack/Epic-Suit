const Routes = require('./routes');
const SchedulerService = require('./service');

class SchedulerModule {
    constructor(context) {
        this.app = context.app;
        this.io = context.io;
        this.prisma = context.prisma;
        this.waService = context.waService;

        this.service = new SchedulerService(this.prisma, this.waService, this.io);
    }

    async init() {
        // Inicializa rotas
        const router = Routes(this.prisma, this.service);
        this.app.use('/api/jobs', router);

        // Inicia serviço
        this.service.start();
        console.log('✅ Módulo Scheduler inicializado');
    }
}

module.exports = SchedulerModule;
