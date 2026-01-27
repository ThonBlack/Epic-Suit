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

// ==================== ROTAS DE CONTAS ====================

// Listar todas as contas
app.get('/api/accounts', async (req, res) => {
    try {
        const accounts = await waManager.getStatus();
        res.json(accounts);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Criar nova conta
app.post('/api/accounts', async (req, res) => {
    try {
        const { name } = req.body;
        const account = await prisma.account.create({
            data: { name }
        });
        res.json(account);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Conectar conta (inicia cliente WhatsApp)
app.post('/api/accounts/:id/connect', async (req, res) => {
    try {
        const { id } = req.params;
        await waManager.initClient(id);
        res.json({ message: 'Conectando...' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Desconectar conta
app.post('/api/accounts/:id/disconnect', async (req, res) => {
    try {
        const { id } = req.params;
        await waManager.disconnectClient(id);
        res.json({ message: 'Desconectado' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Deletar conta
app.delete('/api/accounts/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await waManager.disconnectClient(id);
        await prisma.account.delete({ where: { id } });
        res.json({ message: 'Conta removida' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==================== ROTAS DE JOBS ====================

// Listar todos os jobs
app.get('/api/jobs', async (req, res) => {
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
app.post('/api/jobs', upload.single('media'), async (req, res) => {
    try {
        console.log('📝 Recebendo novo agendamento:', req.body);
        console.log('📁 Arquivo recebido:', req.file ? req.file.filename : 'Nenhum');

        const { accountId, caption, scheduledAt, repeatType, repeatDays } = req.body;

        const job = await prisma.job.create({
            data: {
                accountId,
                mediaPath: req.file ? req.file.filename : null,
                caption,
                scheduledAt: new Date(scheduledAt),
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
app.delete('/api/jobs/:id', async (req, res) => {
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

// ==================== ROTAS DE UPLOAD ====================

// Upload de mídia
app.post('/api/upload', upload.single('media'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Nenhum arquivo enviado' });
        }

        const media = await prisma.media.create({
            data: {
                filename: req.file.filename,
                mimetype: req.file.mimetype,
                path: req.file.path,
                size: req.file.size
            }
        });

        res.json(media);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==================== ROTAS DE DASHBOARD ====================

// Stats do dashboard
app.get('/api/stats', async (req, res) => {
    try {
        const totalAccounts = await prisma.account.count();
        const connectedAccounts = await prisma.account.count({
            where: { status: 'connected' }
        });
        const pendingJobs = await prisma.job.count({
            where: { status: 'pending' }
        });
        const completedJobs = await prisma.job.count({
            where: { status: 'sent' }
        });

        res.json({
            totalAccounts,
            connectedAccounts,
            pendingJobs,
            completedJobs
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
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
