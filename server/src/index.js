const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { PrismaClient } = require('@prisma/client');

// Import Core
const WhatsAppService = require('./core/WhatsAppService');
const ModuleManager = require('./core/ModuleManager');

// Importar Logger (mantido anterior)
const { setupLogger, getLogs } = require('./utils/logger');

// Importar Middlewares
const rateLimiter = require('./middleware/rateLimiter');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const server = http.createServer(app);

// Configuração de CORS para Socket.IO
// Em produção: restringe origin; Em desenvolvimento: permite localhost
const getAllowedOrigins = () => {
    if (process.env.NODE_ENV === 'production') {
        // Em Electron, o origin será file:// ou o app:// scheme
        return ['file://', 'app://'];
    }
    // Em desenvolvimento, permite localhost nas portas comuns
    return ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'];
};

const io = new Server(server, {
    cors: {
        origin: (origin, callback) => {
            // Permite requests sem origin (como Electron) ou origins permitidos
            if (!origin || getAllowedOrigins().some(allowed => origin.startsWith(allowed))) {
                callback(null, true);
            } else if (process.env.NODE_ENV !== 'production') {
                // Em dev, permite qualquer origin para facilitar testes
                callback(null, true);
            } else {
                callback(new Error('Not allowed by CORS'));
            }
        },
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
    }
});

const prisma = new PrismaClient();

// Middleware
app.use(cors());
app.use(express.json());
app.use(rateLimiter); // Rate limiting em todas as rotas

// Setup Uploads
const userDataPath = process.env.USER_DATA_PATH;
const uploadsDir = userDataPath ? path.join(userDataPath, 'uploads') : path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
app.use('/uploads', express.static(uploadsDir));

// Logger
setupLogger();

// ==================== CORE SERVICES ====================
const waService = new WhatsAppService(io, prisma);
const moduleManager = new ModuleManager(app, io, prisma, waService);

// ==================== LEGACY ROUTES (MANTIDAS SE NECESSÁRIO) ====================
// Accounts router ainda é "core" o suficiente para ficar aqui, ou poderia virar módulo.
// Por simplicidade, mantere ele aqui mas ajustado para usar waService
const accountsRouter = require('./routes/accounts')(prisma, waService);
app.use('/api/accounts', accountsRouter);

const dashboardRouter = require('./routes/dashboard')(prisma);
app.use('/api/stats', dashboardRouter);

// Upload router (genérico)
// Precisamos recriar o multer aqui para o upload genérico se o routes/upload.js precisar
// Mas o routes/upload.js original recebe (prisma, upload).
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadsDir),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname))
});
const upload = multer({ storage });
const uploadRouter = require('./routes/upload')(prisma, upload);
app.use('/api/upload', uploadRouter);

// Logs
app.get('/api/logs', (req, res) => {
    res.send(getLogs(req.query.lines ? parseInt(req.query.lines) : 100));
});

// ==================== LOAD MODULES ====================
(async () => {
    await moduleManager.loadModules();
})();

// ==================== ERROR HANDLING ====================
app.use(errorHandler);

// ==================== SOCKET.IO ====================
io.on('connection', (socket) => {
    console.log('Cliente conectado via Socket.IO');
});

// ==================== START ====================
const PORT = process.env.PORT || 3001;

server.listen(PORT, async () => {
    console.log(`🚀 Servidor Modular rodando na porta ${PORT}`);

    // Inicia clientes salvos
    setTimeout(async () => {
        await waService.initAllSavedClients();
    }, 2000);
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('Encerrando servidor...');
    await prisma.$disconnect();
    process.exit(0);
});
