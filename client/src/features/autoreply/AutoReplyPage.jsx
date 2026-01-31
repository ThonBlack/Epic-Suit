import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../../components/Header';
import api from '../../lib/api';
import { Plus, MessageSquare, Trash2, Power, PowerOff, Loader2, Clock, Shield, Users, User, Zap } from 'lucide-react';
import RuleForm from './components/RuleForm';

export default function AutoReplyPage() {
    const [accounts, setAccounts] = useState([]);
    const [selectedAccount, setSelectedAccount] = useState('');
    const [rules, setRules] = useState([]);
    const [loading, setLoading] = useState(false);

    // Modal
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        fetchAccounts();
    }, []);

    useEffect(() => {
        if (selectedAccount) {
            fetchRules(selectedAccount);
        } else {
            setRules([]);
        }
    }, [selectedAccount]);

    const fetchAccounts = async () => {
        try {
            const res = await api.get('/accounts');
            setAccounts(res.data);
            if (res.data.length > 0) setSelectedAccount(res.data[0].id);
        } catch (error) {
            console.error('Erro buscar contas:', error);
        }
    };

    const fetchRules = async (accountId) => {
        setLoading(true);
        try {
            const res = await api.get(`/autoreply/${accountId}`);
            setRules(res.data);
        } catch (error) {
            console.error('Erro buscar regras:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSuccess = () => {
        setShowModal(false);
        fetchRules(selectedAccount);
    };

    const handleDelete = async (id) => {
        if (!confirm('Deletar regra?')) return;
        try {
            await api.delete(`/autoreply/${id}`);
            setRules(rules.filter(r => r.id !== id));
        } catch (error) {
            alert('Erro ao deletar');
        }
    };

    const toggleRule = async (rule) => {
        try {
            const updated = { ...rule, isActive: !rule.isActive };
            await api.patch(`/autoreply/${rule.id}/toggle`, { isActive: updated.isActive });
            setRules(rules.map(r => r.id === rule.id ? updated : r));
        } catch (error) {
            console.error('Erro toggle:', error);
        }
    };

    return (
        <div className="min-h-screen">
            <Header title="Auto Resposta" />

            <div className="p-6">
                {/* Account Selector */}
                <div className="mb-6">
                    <label className="text-sm text-[var(--text-muted)] mb-2 block">
                        Selecione a conta para gerenciar as regras:
                    </label>
                    {accounts.length === 0 ? (
                        <div className="text-amber-400 bg-amber-500/10 px-4 py-3 rounded-xl text-sm">
                            ⚠️ Nenhuma conta cadastrada. <Link to="/accounts" className="underline font-medium">Adicione uma conta primeiro.</Link>
                        </div>
                    ) : (
                        <div className="flex items-center gap-3 overflow-x-auto pb-2">
                            {accounts.map(acc => (
                                <button
                                    key={acc.id}
                                    onClick={() => setSelectedAccount(acc.id)}
                                    className={`px-4 py-2.5 rounded-xl whitespace-nowrap transition-all flex items-center gap-2 ${selectedAccount === acc.id
                                        ? 'gradient-primary font-medium shadow-lg shadow-[var(--primary)]/20'
                                        : 'bg-[var(--surface-light)] border border-[var(--border)] hover:border-[var(--primary)]'
                                        }`}
                                >
                                    <span className={`w-2 h-2 rounded-full ${acc.status === 'connected' ? 'bg-emerald-400' : 'bg-gray-500'}`}></span>
                                    {acc.name}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold">Regras de Resposta</h2>
                    <button
                        onClick={() => setShowModal(true)}
                        className="flex items-center gap-2 px-4 py-2 gradient-primary rounded-xl hover:opacity-90 transition-all shadow-lg shadow-[var(--primary)]/20"
                    >
                        <Plus className="w-5 h-5" /> Nova Regra
                    </button>
                </div>

                {loading ? (
                    <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin" /></div>
                ) : rules.length === 0 ? (
                    <div className="text-center py-12 text-[var(--text-muted)] glass rounded-2xl border-dashed border-2 border-[var(--border)]">
                        <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>Nenhuma regra configurada para esta conta.</p>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {rules.map(rule => (
                            <div key={rule.id} className="glass rounded-xl p-5 flex items-center justify-between group hover:border-[var(--primary)]/30 transition-all">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        {rule.name && (
                                            <span className="text-xs font-bold text-[var(--primary)] uppercase tracking-wider bg-[var(--primary)]/10 px-2 py-0.5 rounded-full">
                                                {rule.name}
                                            </span>
                                        )}
                                        <span className={`text-xs px-2 py-0.5 rounded-full ${rule.matchType === 'exact' ? 'bg-blue-500/20 text-blue-400' :
                                            rule.matchType === 'regex' ? 'bg-pink-500/20 text-pink-400' :
                                                'bg-purple-500/20 text-purple-400'
                                            }`}>
                                            {rule.matchType === 'exact' ? 'Exato' : rule.matchType === 'regex' ? 'Regex' : 'Contém'}
                                        </span>
                                        {rule.priority > 0 && (
                                            <span className="flex items-center gap-1 text-xs text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full" title="Prioridade">
                                                <Zap className="w-3 h-3" /> {rule.priority}
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <h4 className="font-bold text-lg min-w-[100px]">"{rule.trigger}"</h4>
                                        <div className="text-[var(--text-muted)] text-sm border-l-2 border-[var(--border)] pl-3">
                                            <p className="line-clamp-2">{rule.response || '(Apenas Mídia)'}</p>
                                            {rule.mediaPath && <span className="text-xs text-[var(--primary)] flex items-center gap-1 mt-1"><MessageSquare className="w-3 h-3" /> Contém Mídia</span>}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 mt-3 text-xs text-[var(--text-muted)]">
                                        {rule.delay > 0 && (
                                            <span className="flex items-center gap-1" title="Delay"><Clock className="w-3 h-3" /> {rule.delay}s</span>
                                        )}
                                        <span className="flex items-center gap-1">
                                            {rule.isPrivate && <User className="w-3 h-3" title="Privado" />}
                                            {rule.isGroup && <Users className="w-3 h-3" title="Grupos" />}
                                        </span>
                                        {(rule.startTime || rule.endTime) && (
                                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {rule.startTime || '00:00'} - {rule.endTime || '23:59'}</span>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => toggleRule(rule)}
                                        className={`p-2.5 rounded-xl transition-colors ${rule.isActive ? 'text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20' : 'text-gray-500 bg-gray-500/10 hover:bg-gray-500/20'
                                            }`}
                                        title={rule.isActive ? "Desativar" : "Ativar"}
                                    >
                                        {rule.isActive ? <Power className="w-5 h-5" /> : <PowerOff className="w-5 h-5" />}
                                    </button>
                                    <button
                                        onClick={() => handleDelete(rule.id)}
                                        className="p-2.5 text-red-400 hover:bg-red-500/10 rounded-xl transition-colors opacity-0 group-hover:opacity-100"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm p-4">
                    <RuleForm
                        accountId={selectedAccount}
                        onSuccess={handleSuccess}
                        onCancel={() => setShowModal(false)}
                    />
                </div>
            )}
        </div>
    );
}
