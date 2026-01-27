const { PrismaClient } = require('@prisma/client');
const path = require('path');
const fs = require('fs');

async function main() {
    const prisma = new PrismaClient();

    try {
        // Busca o último job que falhou
        const job = await prisma.job.findFirst({
            where: { status: 'failed' },
            orderBy: { createdAt: 'desc' },
            include: { account: true }
        });

        if (!job) {
            console.log('Nenhum job com falha encontrado');
            return;
        }

        console.log('\n=== JOB COM FALHA ===\n');
        console.log(`ID: ${job.id}`);
        console.log(`Conta ID: ${job.accountId}`);
        console.log(`Conta Nome: ${job.account?.name}`);
        console.log(`Conta Status: ${job.account?.status}`);
        console.log(`Mídia: ${job.mediaPath}`);
        console.log(`Caption: ${job.caption}`);
        console.log(`Agendado: ${job.scheduledAt}`);

        // Verifica se o arquivo existe
        if (job.mediaPath) {
            const mediaFullPath = path.join(__dirname, 'uploads', job.mediaPath);
            console.log(`\nCaminho completo: ${mediaFullPath}`);
            console.log(`Arquivo existe: ${fs.existsSync(mediaFullPath)}`);

            if (fs.existsSync(mediaFullPath)) {
                const stats = fs.statSync(mediaFullPath);
                console.log(`Tamanho: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
            }
        }

        // Lista todas as contas
        console.log('\n=== TODAS AS CONTAS ===\n');
        const accounts = await prisma.account.findMany();
        for (const acc of accounts) {
            console.log(`ID: ${acc.id}`);
            console.log(`Nome: ${acc.name}`);
            console.log(`Status: ${acc.status}`);
            console.log(`Telefone: ${acc.phoneNumber || '(sem número)'}`);
            console.log('---');
        }

    } finally {
        await prisma.$disconnect();
    }
}

main().catch(console.error);
