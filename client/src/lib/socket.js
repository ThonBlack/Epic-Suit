import { io } from 'socket.io-client';

/**
 * Detecta a URL do servidor Socket.IO baseado no ambiente
 * - Em desenvolvimento (Vite): usa localhost:3001
 * - Em produção (Electron): usa a porta dinâmica do servidor embutido
 */
const getSocketUrl = () => {
    // Verifica se está rodando no Electron
    if (window.electronAPI?.getServerPort) {
        const port = window.electronAPI.getServerPort();
        return `http://localhost:${port}`;
    }

    // Em desenvolvimento ou fallback
    return 'http://localhost:3001';
};

const socket = io(getSocketUrl(), {
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
});

export default socket;
