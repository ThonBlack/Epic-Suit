const LogService = require('./service');
const LogRoutes = require('./routes');

class LogModule {
    constructor(context) {
        this.app = context.app;
        this.prisma = context.prisma;
        this.service = new LogService(this.prisma);
        this.routes = LogRoutes(this.service);
    }

    async init() {
        console.log('📦 Módulo de Logs: Inicializando...');
        this.app.use('/api/logs', this.routes);
        console.log('📦 Módulo de Logs: Carregado');
    }
}

module.exports = LogModule;
