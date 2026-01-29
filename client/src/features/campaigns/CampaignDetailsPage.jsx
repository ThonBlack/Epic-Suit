import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Header from '../../components/Header';
import api from '../../lib/api';
import socket from '../../lib/socket';
import { Play, Pause, CheckCircle, XCircle, Clock, ArrowLeft, Loader2 } from 'lucide-react';

export default function CampaignDetailsPage() {
    const { id } = useParams();
    const [campaign, setCampaign] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDetails();

        socket.on('campaign:progress', (data) => {
            if (data.campaignId === id) {
                // Optimistic update or just refetch? 
                // Refetching is safer for stats consistency for now
                fetchDetails();
            }
        });

        return () => {
            socket.off('campaign:progress');
        };
    }, [id]);

    const fetchDetails = async () => {
        try {
            const res = await api.get(`/campaigns/${id}`);
            setCampaign(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const toggleStatus = async () => {
        try {
            await api.post(`/campaigns/${id}/toggle`);
            fetchDetails();
        } catch (error) {
            alert('Erro ao alterar status');
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;
    if (!campaign) return <div className="p-8 text-center">Campanha não encontrada</div>;

    const progress = Math.round(((campaign.stats.sent + campaign.stats.failed) / campaign.stats.total) * 100) || 0;

    return (
        <div className="min-h-screen">
            <Header title="Detalhes da Campanha" />
            <div className="p-6 max-w-6xl mx-auto">
                <Link to="/campaigns" className="inline-flex items-center gap-2 text-[var(--text-muted)] hover:text-white mb-6">
                    <ArrowLeft className="w-4 h-4" /> Voltar
                </Link>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                    {/* Status Card */}
                    <div className="glass rounded-2xl p-6 lg:col-span-2">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h2 className="text-2xl font-bold mb-1">{campaign.name}</h2>
                                <p className="text-[var(--text-muted)]">Conta: {campaign.account.name}</p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-sm font-bold uppercase tracking-wider ${campaign.status === 'running' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-500/20 text-gray-400'
                                }`}>
                                {campaign.status}
                            </span>
                        </div>

                        {/* Progress Bar */}
                        <div className="mb-4">
                            <div className="flex justify-between text-sm mb-2">
                                <span>Progresso</span>
                                <span>{progress}%</span>
                            </div>
                            <div className="h-3 bg-[var(--surface-light)] rounded-full overflow-hidden">
                                <div
                                    className="h-full gradient-primary transition-all duration-500"
                                    style={{ width: `${progress}%` }}
                                ></div>
                            </div>
                        </div>

                        <div className="grid grid-cols-4 gap-4 text-center">
                            <div className="p-4 bg-[var(--surface-light)] rounded-xl">
                                <p className="text-2xl font-bold">{campaign.stats.total}</p>
                                <p className="text-xs text-[var(--text-muted)] uppercase">Total</p>
                            </div>
                            <div className="p-4 bg-amber-500/10 rounded-xl text-amber-400">
                                <p className="text-2xl font-bold">{campaign.stats.pending}</p>
                                <p className="text-xs uppercase">Pendentes</p>
                            </div>
                            <div className="p-4 bg-emerald-500/10 rounded-xl text-emerald-400">
                                <p className="text-2xl font-bold">{campaign.stats.sent}</p>
                                <p className="text-xs uppercase">Enviados</p>
                            </div>
                            <div className="p-4 bg-red-500/10 rounded-xl text-red-400">
                                <p className="text-2xl font-bold">{campaign.stats.failed}</p>
                                <p className="text-xs uppercase">Falhas</p>
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end">
                            {campaign.status !== 'completed' && (
                                <button
                                    onClick={toggleStatus}
                                    className={`px-6 py-3 rounded-xl font-medium flex items-center gap-2 ${campaign.status === 'running'
                                            ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30'
                                            : 'gradient-primary text-white hover:opacity-90'
                                        }`}
                                >
                                    {campaign.status === 'running' ? <><Pause className="w-5 h-5" /> Pausar</> : <><Play className="w-5 h-5" /> Iniciar</>}
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Config Preview */}
                    <div className="glass rounded-2xl p-6">
                        <h3 className="font-semibold mb-4">Configurações</h3>
                        <div className="space-y-4 text-sm">
                            <div className="flex justify-between border-b border-[var(--border)] pb-2">
                                <span className="text-[var(--text-muted)]">Intervalo</span>
                                <span>{campaign.minInterval}s - {campaign.maxInterval}s</span>
                            </div>
                            <div className="flex justify-between border-b border-[var(--border)] pb-2">
                                <span className="text-[var(--text-muted)]">Criado em</span>
                                <span>{new Date(campaign.createdAt).toLocaleDateString()}</span>
                            </div>
                            <div>
                                <span className="text-[var(--text-muted)] block mb-1">Template</span>
                                <p className="bg-[var(--surface-light)] p-3 rounded-lg italic text-[var(--text-muted)] text-xs">
                                    {campaign.messageTemplate}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Items List */}
                <div className="glass rounded-2xl overflow-hidden">
                    <div className="p-4 border-b border-[var(--border)] font-semibold">
                        Log de Envios
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-[var(--surface-light)] text-[var(--text-muted)] uppercase text-xs">
                                <tr>
                                    <th className="px-6 py-3">Telefone</th>
                                    <th className="px-6 py-3">Nome</th>
                                    <th className="px-6 py-3">Status</th>
                                    <th className="px-6 py-3">Enviado Em</th>
                                    <th className="px-6 py-3">Log</th>
                                </tr>
                            </thead>
                            <tbody>
                                {campaign.items.map(item => (
                                    <tr key={item.id} className="border-b border-[var(--border)] hover:bg-[var(--surface-light)]/50">
                                        <td className="px-6 py-4 font-medium">{item.phone}</td>
                                        <td className="px-6 py-4">{item.name || '-'}</td>
                                        <td className="px-6 py-4">
                                            {item.status === 'sent' && <span className="text-emerald-400 flex items-center gap-1"><CheckCircle className="w-4 h-4" /> Enviado</span>}
                                            {item.status === 'failed' && <span className="text-red-400 flex items-center gap-1"><XCircle className="w-4 h-4" /> Falha</span>}
                                            {item.status === 'pending' && <span className="text-amber-400 flex items-center gap-1"><Clock className="w-4 h-4" /> Pendente</span>}
                                        </td>
                                        <td className="px-6 py-4">
                                            {item.sentAt ? new Date(item.sentAt).toLocaleString() : '-'}
                                        </td>
                                        <td className="px-6 py-4 text-red-300 max-w-xs truncate">
                                            {item.errorLog || '-'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
