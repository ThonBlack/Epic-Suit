const { app, BrowserWindow, dialog } = require('electron');
const { autoUpdater } = require('electron-updater');
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

// ==================== AUTO-UPDATE ====================
function setupAutoUpdater() {
    if (isDev) {
        console.log('🔧 Modo desenvolvimento - Auto-updater desabilitado');
        return;
    }

    // Configura logs do auto-updater
    autoUpdater.logger = require('electron-log');
    autoUpdater.logger.transports.file.level = 'info';

    // Verifica atualizações ao iniciar
    autoUpdater.checkForUpdatesAndNotify();

    // Eventos do auto-updater
    autoUpdater.on('checking-for-update', () => {
        console.log('🔍 Verificando atualizações...');
    });

    autoUpdater.on('update-available', (info) => {
        console.log('📦 Nova versão disponível:', info.version);
        dialog.showMessageBox(mainWindow, {
            type: 'info',
            title: 'Atualização Disponível',
            message: `Uma nova versão (${info.version}) está disponível!`,
            detail: 'A atualização será baixada em segundo plano.',
            buttons: ['OK']
        });
    });

    autoUpdater.on('update-not-available', () => {
        console.log('✅ Você está usando a versão mais recente.');
    });

    autoUpdater.on('download-progress', (progress) => {
        const msg = `Download: ${Math.round(progress.percent)}%`;
        console.log(msg);
        if (mainWindow) {
            mainWindow.setProgressBar(progress.percent / 100);
        }
    });

    autoUpdater.on('update-downloaded', (info) => {
        console.log('✅ Atualização baixada:', info.version);
        mainWindow.setProgressBar(-1); // Remove barra de progresso

        dialog.showMessageBox(mainWindow, {
            type: 'question',
            title: 'Atualização Pronta',
            message: 'A atualização foi baixada com sucesso!',
            detail: 'Deseja reiniciar o aplicativo agora para aplicar a atualização?',
            buttons: ['Reiniciar Agora', 'Depois']
        }).then((result) => {
            if (result.response === 0) {
                autoUpdater.quitAndInstall();
            }
        });
    });

    autoUpdater.on('error', (err) => {
        console.error('❌ Erro no auto-updater:', err.message);
    });
}

// ==================== SERVER ====================
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
        USER_DATA_PATH: userDataPath,
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

// ==================== WINDOW ====================
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
        mainWindow.loadFile(path.join(__dirname, '../client/dist-build/index.html'));
    }
}

// ==================== APP LIFECYCLE ====================
app.whenReady().then(() => {
    startServer();
    createWindow();
    setupAutoUpdater(); // Inicia verificação de atualizações

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
