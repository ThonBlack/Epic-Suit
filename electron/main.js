const { app, BrowserWindow } = require('electron');
const path = require('path');
const { fork } = require('child_process');
const fs = require('fs');

let mainWindow;
let serverProcess;

const isDev = !app.isPackaged;
const SERVER_PORT = 3001;

// Define caminhos persistentes
const userDataPath = app.getPath('userData');
const dbPath = path.join(userDataPath, 'database');
const sessionsPath = path.join(userDataPath, 'sessions');
const uploadsPath = path.join(userDataPath, 'uploads');
const logsPath = path.join(userDataPath, 'logs');

// Garante que as pastas existam
[dbPath, sessionsPath, uploadsPath, logsPath].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

function startServer() {
    const serverDir = isDev
        ? path.join(__dirname, '../server')
        : path.join(process.resourcesPath, 'server');

    const serverPath = path.join(serverDir, 'src/index.js');

    // LÓGICA DE INICIALIZAÇÃO DO BANCO
    const targetDbFile = path.join(dbPath, 'dev.db');

    if (!fs.existsSync(targetDbFile)) {
        console.log('✨ Primeira execução detectada! Inicializando banco de dados...');
        const templateDb = path.join(serverDir, 'prisma/template.db');

        if (fs.existsSync(templateDb)) {
            fs.copyFileSync(templateDb, targetDbFile);
            console.log('✅ Banco de dados template copiado com sucesso.');
        } else {
            console.error('❌ ERRO: Template de banco de dados não encontrado em:', templateDb);
        }
    }

    console.log('Starting server from:', serverPath);
    console.log('User Data Path:', userDataPath);
    console.log('Database URL:', `file:${targetDbFile}`);

    const env = {
        ...process.env,
        PORT: SERVER_PORT,
        USER_DATA_PATH: userDataPath, // Passa o caminho pro servidor
        DATABASE_URL: `file:${targetDbFile}`,
        NODE_ENV: isDev ? 'development' : 'production'
    };

    serverProcess = fork(serverPath, [], {
        env,
        stdio: ['pipe', 'pipe', 'pipe', 'ipc']
    });

    serverProcess.stdout.on('data', (data) => console.log(`[SERVER]: ${data}`));
    serverProcess.stderr.on('data', (data) => console.error(`[SERVER ERR]: ${data}`));
}

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        icon: path.join(__dirname, '../client/public/favicon.ico'),
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
        },
        autoHideMenuBar: true
    });

    if (isDev) {
        mainWindow.loadURL('http://localhost:5173');
        mainWindow.webContents.openDevTools();
    } else {
        // Em produção, carrega o index.html compilado
        mainWindow.loadFile(path.join(__dirname, '../client/dist-build/index.html'));
        // mainWindow.webContents.openDevTools();
    }
}

app.whenReady().then(() => {
    startServer();
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('before-quit', () => {
    if (serverProcess) {
        console.log('Killing server process...');
        serverProcess.kill();
    }
});
