/**
 * Middleware de tratamento de erros centralizado
 */

const errorHandler = (err, req, res, next) => {
    // Log do erro
    console.error('❌ Erro:', {
        message: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
        path: req.path,
        method: req.method
    });

    // Erros do Prisma
    if (err.code) {
        switch (err.code) {
            case 'P2002':
                return res.status(409).json({
                    error: 'Registro duplicado',
                    field: err.meta?.target?.[0] || 'unknown'
                });
            case 'P2025':
                return res.status(404).json({
                    error: 'Registro não encontrado'
                });
            case 'P2003':
                return res.status(400).json({
                    error: 'Erro de relacionamento',
                    message: 'Não foi possível realizar a operação devido a referências inválidas'
                });
        }
    }

    // Erros de validação
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            error: 'Dados inválidos',
            message: err.message
        });
    }

    // Erros de multer (upload)
    if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({
            error: 'Arquivo muito grande',
            message: 'O arquivo excede o tamanho máximo permitido'
        });
    }

    // Erro genérico
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
        error: statusCode === 500 ? 'Erro interno do servidor' : err.message,
        ...(process.env.NODE_ENV === 'development' && { details: err.message, stack: err.stack })
    });
};

module.exports = errorHandler;
