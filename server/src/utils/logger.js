const fs = require('fs');
const path = require('path');

// Caminho de logs dinâmico
const userDataPath = process.env.USER_DATA_PATH;
const logsDir = userDataPath
    ? path.join(userDataPath, 'logs')
    : path.join(__dirname, '..', '..', 'logs');

if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

// Configuração de rotação
const MAX_LOG_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_LOG_FILES = 5; // Mantém 5 arquivos de backup

let logFile = null;
let currentLogPath = path.join(logsDir, 'system.log');

// Função para verificar e rotacionar logs
function rotateLogsIfNeeded() {
    try {
        if (!fs.existsSync(currentLogPath)) return;

        const stats = fs.statSync(currentLogPath);
        if (stats.size < MAX_LOG_SIZE) return;

        // Fecha o stream atual
        if (logFile) {
            logFile.end();
        }

        // Rotaciona os arquivos existentes (system.log.4 -> system.log.5, etc)
        for (let i = MAX_LOG_FILES - 1; i >= 1; i--) {
            const oldPath = path.join(logsDir, `system.log.${i}`);
            const newPath = path.join(logsDir, `system.log.${i + 1}`);
            if (fs.existsSync(oldPath)) {
                if (i === MAX_LOG_FILES - 1) {
                    fs.unlinkSync(oldPath); // Remove o mais antigo
                } else {
                    fs.renameSync(oldPath, newPath);
                }
            }
        }

        // Move o log atual para .1
        fs.renameSync(currentLogPath, path.join(logsDir, 'system.log.1'));

        // Cria novo arquivo de log
        logFile = fs.createWriteStream(currentLogPath, { flags: 'a' });
        console.log('📝 Log rotacionado com sucesso');
    } catch (error) {
        console.error('Erro ao rotacionar log:', error.message);
    }
}

// Inicializa o arquivo de log
logFile = fs.createWriteStream(currentLogPath, { flags: 'a' });

// Verifica rotação a cada 5 minutos
setInterval(rotateLogsIfNeeded, 5 * 60 * 1000);

// Função auxiliar para formatar data (Local Time)
const getTimestamp = () => {
    const now = new Date();
    return now.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }) + ' ' + now.getMilliseconds() + 'ms';
};

// Intercepta e persiste logs
function setupLogger() {
    const originalStdout = process.stdout.write.bind(process.stdout);
    const originalStderr = process.stderr.write.bind(process.stderr);

    // Sobrescreve stdout
    process.stdout.write = function (chunk, encoding, callback) {
        const timestamp = getTimestamp();
        let logMessage = chunk.toString();

        // Adiciona timestamp se não tiver
        if (!logMessage.startsWith('[') && logMessage.trim()) {
            logMessage = `[${timestamp}] INFO: ${logMessage}`;
        }

        if (logFile && logMessage.trim()) {
            logFile.write(logMessage);
        }
        return originalStdout(chunk, encoding, callback);
    };

    // Sobrescreve stderr
    process.stderr.write = function (chunk, encoding, callback) {
        const timestamp = getTimestamp();
        let logMessage = chunk.toString();

        if (!logMessage.startsWith('[') && logMessage.trim()) {
            logMessage = `[${timestamp}] ERROR: ${logMessage}`;
        }

        if (logFile && logMessage.trim()) {
            logFile.write(logMessage);
        }
        return originalStderr(chunk, encoding, callback);
    };

    // Verifica rotação na inicialização
    rotateLogsIfNeeded();

    console.log('📝 Logger do sistema inicializado com rotação automática (max 5MB x 5 arquivos)');
}

function getLogs(lines = 100) {
    try {
        if (!fs.existsSync(currentLogPath)) return 'Nenhum log encontrado.';

        const content = fs.readFileSync(currentLogPath, 'utf8');
        const allLines = content.split('\n');
        return allLines.slice(-lines).join('\n');
    } catch (error) {
        return `Erro ao ler logs: ${error.message}`;
    }
}

// Limpa recursos ao encerrar
function cleanup() {
    if (logFile) {
        logFile.end();
    }
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

module.exports = { setupLogger, getLogs };
