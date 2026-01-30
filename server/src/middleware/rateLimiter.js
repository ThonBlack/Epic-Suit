/**
 * Middleware de Rate Limiting para proteger a API contra sobrecarga
 */

// Rate limiting simples usando Map (sem dependência externa)
const requestCounts = new Map();
const WINDOW_MS = 60 * 1000; // 1 minuto
const MAX_REQUESTS = 100; // 100 requests por minuto por IP

// Limpa contadores antigos a cada minuto
setInterval(() => {
    const now = Date.now();
    for (const [key, data] of requestCounts.entries()) {
        if (now - data.startTime > WINDOW_MS) {
            requestCounts.delete(key);
        }
    }
}, WINDOW_MS);

const rateLimiter = (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const now = Date.now();

    if (!requestCounts.has(ip)) {
        requestCounts.set(ip, { count: 1, startTime: now });
        return next();
    }

    const data = requestCounts.get(ip);

    // Reseta janela se passou o tempo
    if (now - data.startTime > WINDOW_MS) {
        requestCounts.set(ip, { count: 1, startTime: now });
        return next();
    }

    // Incrementa contador
    data.count++;

    if (data.count > MAX_REQUESTS) {
        return res.status(429).json({
            error: 'Muitas requisições',
            message: 'Por favor aguarde um momento antes de tentar novamente.',
            retryAfter: Math.ceil((WINDOW_MS - (now - data.startTime)) / 1000)
        });
    }

    next();
};

module.exports = rateLimiter;
