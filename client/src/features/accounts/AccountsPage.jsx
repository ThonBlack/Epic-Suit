import { useEffect, useState } from 'react';
import Header from '../../components/Header';
import api from '../../lib/api';
import socket from '../../lib/socket';
import { Plus, Smartphone, Wifi, WifiOff, Trash2, QrCode, Loader2, Shield, FileText, X } from 'lucide-react';
import ProtectionSettings from './components/ProtectionSettings';
import LogsTable from '../../components/LogsTable';

export default function Accounts() {
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [newAccountName, setNewAccountName] = useState('');
    const [qrCode, setQrCode] = useState(null);
    const [connectingId, setConnectingId] = useState(null);
    const [settingsAccountId, setSettingsAccountId] = useState(null);
    const [logsAccountId, setLogsAccountId] = useState(null);

    useEffect(() => {
        fetchAccounts();
    }, []);

    useEffect(() => {
        // Escuta eventos de QR code e status
        accounts.forEach(account => {
            socket.on(`qr:${account.id}`, (qrDataUrl) => {
                if (connectingId === account.id) {
                    setQrCode(qrDataUrl);
                }
            });

            socket.on(`status:${account.id}`, (status) => {
                setAccounts(prev =>
                    prev.map(acc =>
                        acc.id === account.id ? { ...acc, status } : acc
                    )
                );
                if (status === 'connected') {
                    setConnectingId(null);
                    setQrCode(null);
                }
            });
        });

        return () => {
            accounts.forEach(account => {
                socket.off(`qr:${account.id}`);
                socket.off(`status:${account.id}`);
            });
        };
    }, [accounts, connectingId]);

    const fetchAccounts = async () => {
        try {
            const response = await api.get('/accounts');
            setAccounts(response.data);
            return response.data; // Retorna para uso no Manual Check
        } catch (error) {
            console.error('Erro ao buscar contas:', error);
            return [];
        } finally {
            setLoading(false);
        }
    };

    const handleManualCheck = async () => {
        const updatedAccounts = await fetchAccounts();
        const account = updatedAccounts.find(acc => acc.id === connectingId);

        if (account?.status === 'connected') {
            setQrCode(null);
            setConnectingId(null);
        } else {
            alert('Ainda não detectamos a conexão completa. Aguarde alguns segundos e tente novamente.');
        }
    };

    const [isCreating, setIsCreating] = useState(false);

    const createAccount = async (e) => {
        e.preventDefault();
        setIsCreating(true);
        try {
            const response = await api.post('/accounts', { name: newAccountName });
            setAccounts([response.data, ...accounts]);
            setNewAccountName('');
            setShowModal(false);
        } catch (error) {
            console.error('Erro ao criar conta:', error);
            alert('Erro ao criar conta. Verifique o console para mais detalhes.');
        } finally {
            setIsCreating(false);
        }
    };

    const connectAccount = async (id) => {
        try {
            setConnectingId(id);
            setQrCode(null);
            await api.post(`/accounts/${id}/connect`);
        } catch (error) {
            console.error('Erro ao conectar:', error);
            setConnectingId(null);
        }
    };

    const disconnectAccount = async (id) => {
        try {
            await api.post(`/accounts/${id}/disconnect`);
            setAccounts(prev =>
                prev.map(acc =>
                    acc.id === id ? { ...acc, status: 'disconnected' } : acc
                )
            );
        } catch (error) {
            console.error('Erro ao desconectar:', error);
        }
    };

    const deleteAccount = async (id) => {
        if (!confirm('Tem certeza que deseja remover esta conta?')) return;
        try {
            await api.delete(`/accounts/${id}`);
            setAccounts(prev => prev.filter(acc => acc.id !== id));
        } catch (error) {
            console.error('Erro ao deletar:', error);
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'connected':
                return (
                    <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-sm">
                        <Wifi className="w-3.5 h-3.5" /> Conectado
                    </span>
                );
            case 'qr_pending':
                return (
                    <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 text-sm">
                        <QrCode className="w-3.5 h-3.5" /> Aguardando QR
                    </span>
                );
            default:
                return (
                    <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-500/20 text-gray-400 text-sm">
                        <WifiOff className="w-3.5 h-3.5" /> Desconectado
                    </span>
                );
        }
    };

    return (
        <div className="min-h-screen">
            <Header title="Contas WhatsApp" />

            <div className="p-6">
                {/* Add Button */}
                <button
                    onClick={() => setShowModal(true)}
                    className="mb-6 flex items-center gap-2 px-6 py-3 gradient-primary rounded-xl font-medium hover:opacity-90 transition-opacity shadow-lg shadow-[var(--primary)]/20"
                >
                    <Plus className="w-5 h-5" />
                    Nova Conta
                </button>

                {/* QR Code Modal */}
                {qrCode && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
                        <div className="glass rounded-2xl p-8 max-w-md w-full mx-4">
                            <h3 className="text-xl font-bold mb-4 text-center">Escaneie o QR Code</h3>
                            <p className="text-[var(--text-muted)] text-center mb-6">
                                Abra o WhatsApp no seu celular e escaneie o código abaixo
                            </p>
                            <div className="bg-white p-4 rounded-xl mb-6">
                                <img src={qrCode} alt="QR Code" className="w-full" />
                            </div>
                            <div className="flex flex-col gap-2">
                                <button
                                    onClick={handleManualCheck}
                                    className="w-full py-3 gradient-primary rounded-xl font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                                >
                                    <Wifi className="w-5 h-5" />
                                    Já Escaneei
                                </button>
                                <button
                                    onClick={() => {
                                        setQrCode(null);
                                        setConnectingId(null);
                                    }}
                                    className="w-full py-3 bg-[var(--surface-light)] rounded-xl hover:bg-[var(--border)] transition-colors"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* New Account Modal */}
                {showModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
                        <div className="glass rounded-2xl p-8 max-w-md w-full mx-4">
                            <h3 className="text-xl font-bold mb-6">Nova Conta WhatsApp</h3>
                            <form onSubmit={createAccount}>
                                <input
                                    type="text"
                                    value={newAccountName}
                                    onChange={(e) => setNewAccountName(e.target.value)}
                                    placeholder="Nome da conta (ex: Loja Principal)"
                                    className="w-full px-4 py-3 bg-[var(--surface-light)] border border-[var(--border)] rounded-xl mb-4 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                                    required
                                />
                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="flex-1 py-3 bg-[var(--surface-light)] rounded-xl hover:bg-[var(--border)] transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        disabled={isCreating}
                                        className="flex-1 py-3 gradient-primary rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {isCreating ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                Criando...
                                            </>
                                        ) : (
                                            'Criar'
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Accounts List */}
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
                    </div>
                ) : accounts.length === 0 ? (
                    <div className="glass rounded-2xl p-12 text-center">
                        <Smartphone className="w-16 h-16 mx-auto mb-4 text-[var(--text-muted)]" />
                        <h3 className="text-xl font-semibold mb-2">Nenhuma conta cadastrada</h3>
                        <p className="text-[var(--text-muted)]">
                            Adicione sua primeira conta WhatsApp para começar
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {accounts.map((account) => (
                            <div
                                key={account.id}
                                className="glass rounded-2xl p-6 hover:border-[var(--primary)]/50 transition-all"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
                                            <Smartphone className="w-6 h-6 text-white" />
                                        </div>
                                        <div>
                                            <h4 className="font-semibold">{account.name}</h4>
                                            <p className="text-sm text-[var(--text-muted)]">
                                                {account.phoneNumber || 'Não conectado'}
                                            </p>
                                        </div>
                                    </div>
                                    {getStatusBadge(account.status)}
                                </div>

                                <div className="flex gap-2">
                                    {account.status === 'connected' ? (
                                        <button
                                            onClick={() => disconnectAccount(account.id)}
                                            className="flex-1 py-2.5 bg-red-500/20 text-red-400 rounded-xl hover:bg-red-500/30 transition-colors text-sm font-medium"
                                        >
                                            Desconectar
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => connectAccount(account.id)}
                                            disabled={connectingId === account.id}
                                            className="flex-1 py-2.5 gradient-primary rounded-xl hover:opacity-90 transition-opacity text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                                        >
                                            {connectingId === account.id ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                    Conectando...
                                                </>
                                            ) : (
                                                'Conectar'
                                            )}
                                        </button>
                                    )}
                                    <button
                                        onClick={() => deleteAccount(account.id)}
                                        className="p-2.5 bg-[var(--surface-light)] rounded-xl hover:bg-red-500/20 hover:text-red-400 transition-colors"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={() => setSettingsAccountId(account.id)}
                                        className="p-2.5 bg-[var(--surface-light)] rounded-xl hover:bg-[var(--primary)]/20 hover:text-[var(--primary)] transition-colors"
                                        title="Configurações de Proteção"
                                    >
                                        <Shield className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={() => setLogsAccountId(account.id)}
                                        className="p-2.5 bg-[var(--surface-light)] rounded-xl hover:bg-blue-500/20 hover:text-blue-400 transition-colors"
                                        title="Logs de Atividade"
                                    >
                                        <FileText className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Protection Settings Modal */}
            {settingsAccountId && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm p-4">
                    <ProtectionSettings
                        accountId={settingsAccountId}
                        onClose={() => setSettingsAccountId(null)}
                    />
                </div>
            )}

            {/* Logs Modal */}
            {logsAccountId && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm p-4">
                    <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto relative">
                        <button
                            onClick={() => setLogsAccountId(null)}
                            className="absolute top-4 right-4 p-2 bg-[var(--surface-light)] rounded-full hover:bg-[var(--border)] z-10"
                        >
                            <X className="w-5 h-5" />
                        </button>
                        <LogsTable accountId={logsAccountId} />
                    </div>
                </div>
            )}
        </div>
    );
}
