// Teste simples para verificar erro exato
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const { PrismaClient } = require('@prisma/client');
const path = require('path');
const fs = require('fs');

const prisma = new PrismaClient();
const sessionsPath = path.join(__dirname, 'sessions');

async function test() {
    const account = await prisma.account.findFirst({ where: { status: 'connected' } });
    console.log('Conta:', account.name);

    const client = new Client({
        authStrategy: new LocalAuth({ clientId: account.id, dataPath: sessionsPath }),
        puppeteer: { headless: true, args: ['--no-sandbox'] }
    });

    client.on('ready', async () => {
        console.log('Cliente pronto, WID:', client.info?.wid?.user);

        const uploadsDir = path.join(__dirname, 'uploads');
        const files = fs.readdirSync(uploadsDir).filter(f => f.endsWith('.mp4') || f.endsWith('.jpg') || f.endsWith('.png'));

        if (files.length === 0) {
            console.log('Sem arquivos');
            process.exit(1);
        }

        const mediaPath = path.join(uploadsDir, files[files.length - 1]);
        console.log('Midia:', files[files.length - 1]);

        try {
            const media = MessageMedia.fromFilePath(mediaPath);
            console.log('Tipo:', media.mimetype);
            console.log('Enviando...');

            await client.sendMessage('status@broadcast', media, { caption: 'Teste' });
            console.log('SUCESSO!');
        } catch (err) {
            console.log('ERRO:', err.message);
            console.log('STACK:', err.stack);
        }

        await client.destroy();
        process.exit(0);
    });

    client.on('auth_failure', () => {
        console.log('Falha auth');
        process.exit(1);
    });

    await client.initialize();
}

test().catch(e => {
    console.log('Erro geral:', e.message);
    process.exit(1);
});
