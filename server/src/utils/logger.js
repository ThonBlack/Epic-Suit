const fs = require('fs');
const path = require('path');
const util = require('util');

// Caminho de logs dinâmico
const userDataPath = process.env.USER_DATA_PATH;
const logsDir = userDataPath
    ? path.join(userDataPath, 'logs')
    : path.join(__dirname, '..', '..', 'logs');

if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

const logFile = fs.createWriteStream(path.join(logsDir, 'system.log'), { flags: 'a' });

// Função auxiliar para formatar data (Local Time)
const getTimestamp = () => {
    const now = new Date();
    // Ajusta para o fuso horário local (respeita a ENV TZ do Docker)
    return now.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }) + ' ' + now.getMilliseconds() + 'ms';
};

// Intercepta e persiste logs
function setupLogger() {
    const originalStdout = process.stdout.write;
    const originalStderr = process.stderr.write;

    // Sobrescreve stdout
    process.stdout.write = function (chunk, encoding, callback) {
        const timestamp = getTimestamp();
        let logMessage = chunk.toString();

        // Adiciona timestamp se não tiver (alguns logs já vêm formatados)
        if (!logMessage.startsWith('[')) {
            logMessage = `[${timestamp}] INFO: ${logMessage}`;
        }

        logFile.write(logMessage);
        originalStdout.apply(process.stdout, arguments);
    };

    // Sobrescreve stderr
    process.stderr.write = function (chunk, encoding, callback) {
        const timestamp = getTimestamp();
        let logMessage = chunk.toString();

        if (!logMessage.startsWith('[')) {
            logMessage = `[${timestamp}] ERROR: ${logMessage}`;
        }

        logFile.write(logMessage);
        originalStderr.apply(process.stderr, arguments);
    };

    console.log('📝 Logger do sistema inicializado. Gravando em logs/system.log');
}

function getLogs(lines = 100) {
    try {
        const filePath = path.join(logsDir, 'system.log');
        if (!fs.existsSync(filePath)) return 'Nenhum log encontrado.';

        const content = fs.readFileSync(filePath, 'utf8');
        const allLines = content.split('\n');
        return allLines.slice(-lines).join('\n');
    } catch (error) {
        return `Erro ao ler logs: ${error.message}`;
    }
}

module.exports = { setupLogger, getLogs };
