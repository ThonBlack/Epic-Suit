const CampaignService = require('./service');
const CampaignRoutes = require('./routes');
const LogService = require('../logs/service'); // Cross-module import

class CampaignModule {
    constructor(context) {
        this.app = context.app;
        this.io = context.io;
        this.prisma = context.prisma;
        this.waService = context.waService;

        // Instantiate LogService
        this.logService = new LogService(this.prisma);

        // Inject into Service
        this.service = new CampaignService({
            ...context,
            logService: this.logService
        });

        this.routes = new CampaignRoutes(this.service);
    }

    async init() {
        console.log('📦 Módulo de Campanhas: Inicializando...');

        // Registrar rotas
        this.app.use('/api/campaigns', this.routes.getRouter());

        // Iniciar processador de fila
        this.service.startQueueProcessor();

        console.log('📦 Módulo de Campanhas: Carregado');
    }
}

module.exports = CampaignModule;
