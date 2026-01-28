const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { PrismaClient } = require('@prisma/client');

const WAClientManager = require('./wa-client');
const Scheduler = require('./scheduler');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST', 'PUT', 'DELETE']
    }
});

const prisma = new PrismaClient();

// Middleware
app.use(cors());
app.use(express.json());

// Diretório de uploads
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// Configuração do Multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

// Inicializa gerenciadores
const waManager = new WAClientManager(io, prisma);
const scheduler = new Scheduler(prisma, waManager, io);

// ==================== ROTAS ====================
const { setupLogger, getLogs } = require('./utils/logger');

// Inicializa logger
setupLogger();

// ==================== ROTAS ====================
const accountsRouter = require('./routes/accounts')(prisma, waManager);
const jobsRouter = require('./routes/jobs')(prisma, upload, uploadsDir);
const uploadRouter = require('./routes/upload')(prisma, upload);
const dashboardRouter = require('./routes/dashboard')(prisma);

app.use('/api/accounts', accountsRouter);
app.use('/api/jobs', jobsRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/stats', dashboardRouter);

// Rota de logs do sistema
app.get('/api/logs', (req, res) => {
    const lines = req.query.lines ? parseInt(req.query.lines) : 100;
    const logs = getLogs(lines);
    res.send(logs);
});

// ==================== ERROR HANDLING ====================

app.use((err, req, res, next) => {
    console.error('❌ Erro não tratado (Middleware):', err);
    if (err instanceof multer.MulterError) {
        return res.status(400).json({ error: `Erro no upload: ${err.message}` });
    }
    res.status(500).json({ error: 'Erro interno do servidor', details: err.message });
});

// ==================== SOCKET.IO ====================

io.on('connection', (socket) => {
    console.log('Cliente conectado via Socket.IO');

    socket.on('disconnect', () => {
        console.log('Cliente desconectado');
    });
});

// ==================== INICIALIZAÇÃO ====================

const PORT = process.env.PORT || 3001;

server.listen(PORT, async () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
    scheduler.start();

    // Inicia automaticamente os clientes WhatsApp salvos
    setTimeout(async () => {
        await waManager.initAllSavedClients();
    }, 2000);
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('Encerrando servidor...');
    scheduler.stop();
    await prisma.$disconnect();
    process.exit(0);
});
