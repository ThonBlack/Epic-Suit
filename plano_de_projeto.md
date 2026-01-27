# Plano de Implementação do Agendador de Status WhatsApp

Este projeto visa construir uma aplicação completa para agendar e gerenciar status do WhatsApp em múltiplas contas.

## Revisão do Usuário Necessária

> [!IMPORTANT]
> **Seleção de Tecnologias**:
> - **Frontend**: React (Vite) + TailwindCSS (para interface moderna e limpa).
> - **Backend**: Node.js + Express.
> - **Banco de Dados**: SQLite (gerenciado via Prisma) para armazenar agendamentos e sessões.
> - **Motor WhatsApp**: `whatsapp-web.js` (Requer uma instância do Chromium, geralmente automatizada).

> [!NOTE]
> O app rodará localmente. Você precisará escanear QR codes para vincular as contas do WhatsApp.

## Mudanças Propostas

### Estrutura do Projeto
O diretório raiz conterá `client` (frontend) e `server` (backend).

### Backend (Servidor)
#### [NEW] `server/package.json`
- Dependências: `express`, `whatsapp-web.js`, `qrcode-terminal` (ou `qrcode` para frontend), `multer`, `prisma`, `node-cron` (ou similar).

#### [NEW] `server/src/wa-client.js`
- Gerencia clientes `whatsapp-web.js`.
- Lida com suporte a múltiplas sessões (um cliente por pasta/ID).

#### [NEW] `server/src/scheduler.js`
- Verifica no BD por status pendentes.
- Executa atualizações de status via `wa-client`.
- Lida com lógica de repetição (cálculo da próxima execução).

#### [NEW] `server/prisma/schema.prisma`
- Modelos: `Account` (Sessões WA), `Job` (Status Agendados), `Media` (Arquivos Enviados).

### Frontend (Cliente)
#### [NEW] `client/`
- Configuração padrão Vite React.
- **Páginas**:
    - `Dashboard`: Visão geral de contas ativas e trabalhos pendentes.
    - `Contas`: Adicionar/Remover contas WA (Visualização do QR Code).
    - `Novo Status`: Formulário para enviar mídia, definir legenda, agendar e selecionar contas.
    - `Histórico`: Ver status passados.

## Plano de Verificação

### Testes Automatizados
- Como isso depende muito da conexão em tempo real com o WhatsApp, testes unitários extensivos para a interação WA são difíceis.
- Confiaremos na verificação manual para a conexão e envio do WA.
- **Lógica do Agendador**: Testes unitários para a função de cálculo da "próxima execução".

### Verificação Manual
1.  **Build do Frontend**: Rodar `npm run dev` no cliente e verificar se a UI carrega.
2.  **Início do Backend**: Rodar `npm run dev` no servidor.
3.  **Vincular Conta**: Ir para "Contas", escanear QR com WhatsApp real. Verificar status "Conectado".
4.  **Agendar Status**:
    - Enviar uma imagem.
    - Definir horário para +2 minutos a partir de agora.
    - Enviar.
5.  **Verificar Execução**:
    - Verificar logs do terminal para "Enviando status...".
    - Verificar celular com WhatsApp real para ver se o status foi postado.
