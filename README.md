# 📱 WA Status Scheduler

Aplicação para agendar e gerenciar status do WhatsApp em múltiplas contas.

## ✨ Funcionalidades

- 📱 Gerenciar múltiplas contas WhatsApp
- ⏰ Agendar status com data/hora específica
- 🔄 Repetição automática (diária, semanal)
- 📸 Suporte a imagens e vídeos
- 📊 Dashboard com estatísticas
- 🔔 Notificações em tempo real via WebSocket

## 🛠️ Tecnologias

**Backend:**
- Node.js + Express
- Socket.IO (tempo real)
- Prisma + SQLite
- whatsapp-web.js
- node-cron (agendamento)

**Frontend:**
- React (Vite)
- TailwindCSS v4
- Lucide Icons

## 🚀 Instalação

### Pré-requisitos
- Node.js 18+
- Google Chrome (para whatsapp-web.js)

### Backend
```bash
cd server
npm install
npx prisma db push
npm run dev
```

### Frontend
```bash
cd client
npm install
npm run dev
```

## 📖 Como Usar

1. Acesse http://localhost:5173
2. Vá em **Contas** → **Nova Conta**
3. Clique **Conectar** e escaneie o QR Code com seu celular
4. Vá em **Novo Status** para criar agendamentos
5. Acompanhe em **Agendados**

## 📁 Estrutura

```
├── client/          # Frontend React
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── lib/
│   └── package.json
├── server/          # Backend Express
│   ├── src/
│   │   ├── index.js
│   │   ├── wa-client.js
│   │   └── scheduler.js
│   ├── prisma/
│   └── package.json
└── README.md
```

## ⚠️ Importante

- O WhatsApp pode bloquear contas que usam automação
- Use por sua conta e risco
- Recomendado para uso pessoal/testes

## 📄 Licença

MIT
