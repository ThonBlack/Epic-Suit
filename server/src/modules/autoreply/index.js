const Routes = require('./routes');
const AutoReplyService = require('./service');

class AutoReplyModule {
    constructor(context) {
        this.app = context.app;
        this.io = context.io;
        this.prisma = context.prisma;
        this.waService = context.waService;

        this.service = new AutoReplyService(this.prisma, this.waService);
    }

    async init() {
        // Inicializa rotas
        const router = Routes(this.prisma, this.service);
        this.app.use('/api/autoreply', router);

        // Escuta mensagens recebidas (se quiser responder a outros)
        this.waService.on('message', (data) => {
            this.service.handleMessage(data);
        });

        // Opcional: Escuta mensagens enviadas por mim (para testes ou logs)
        // this.waService.on('message_create', (data) => ...);

        console.log('✅ Módulo AutoReply inicializado');
    }
}

module.exports = AutoReplyModule;
