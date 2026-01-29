import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../../components/Header';
import api from '../../lib/api';
import { Plus, Play, Pause, FileSpreadsheet, MessageSquare, Clock, ArrowRight } from 'lucide-react';

export default function CampaignListPage() {
    const [campaigns, setCampaigns] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchCampaigns();
        const interval = setInterval(fetchCampaigns, 5000); // Polling for updates
        return () => clearInterval(interval);
    }, []);

    const fetchCampaigns = async () => {
        try {
            const res = await api.get('/campaigns');
            setCampaigns(res.data);
        } catch (error) {
            console.error('Erro ao buscar campanhas:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleStatus = async (id, e) => {
        e.preventDefault(); // Prevent navigation if button inside link
        try {
            await api.post(`/campaigns/${id}/toggle`);
            fetchCampaigns();
        } catch (error) {
            alert('Erro ao alterar status');
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'pending': return 'bg-amber-500/20 text-amber-400';
            case 'running': return 'bg-emerald-500/20 text-emerald-400 animate-pulse';
            case 'paused': return 'bg-gray-500/20 text-gray-400';
            case 'completed': return 'bg-blue-500/20 text-blue-400';
            case 'scheduled': return 'bg-purple-500/20 text-purple-400';
            default: return 'bg-gray-500/20 text-gray-400';
        }
    };

    return (
        <div className="min-h-screen">
            <Header title="Campanhas em Massa" />
            <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold">Minhas Campanhas</h2>
                    <Link to="/campaigns/new" className="px-4 py-2 gradient-primary rounded-xl flex items-center gap-2 font-medium hover:opacity-90">
                        <Plus className="w-5 h-5" /> Nova Campanha
                    </Link>
                </div>

                {loading ? (
                    <div className="text-center py-10 opacity-50">Carregando...</div>
                ) : campaigns.length === 0 ? (
                    <div className="glass rounded-2xl p-12 text-center text-[var(--text-muted)]">
                        <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-30" />
                        <h3 className="text-xl font-semibold mb-2">Nenhuma campanha criada</h3>
                        <p>Crie sua primeira campanha para enviar mensagens em massa.</p>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {campaigns.map(campaign => (
                            <Link to={`/campaigns/${campaign.id}`} key={campaign.id} className="glass rounded-xl p-6 hover:border-[var(--primary)]/50 transition-all group relative">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <div className="flex items-center gap-3 mb-1">
                                            <h3 className="font-bold text-lg">{campaign.name}</h3>
                                            <span className={`text-xs px-2 py-0.5 rounded-full uppercase font-bold tracking-wider ${getStatusColor(campaign.status)}`}>
                                                {campaign.status}
                                            </span>
                                        </div>
                                        <p className="text-sm text-[var(--text-muted)]">
                                            {campaign.status === 'scheduled' && campaign.scheduledAt
                                                ? `Agendado para ${new Date(campaign.scheduledAt).toLocaleString()}`
                                                : `Criada em ${new Date(campaign.createdAt).toLocaleDateString()}`
                                            }
                                        </p>
                                    </div>
                                    <button
                                        onClick={(e) => toggleStatus(campaign.id, e)}
                                        className={`p-2 rounded-full transition-colors z-10 ${campaign.status === 'running'
                                            ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30'
                                            : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                                            }`}
                                    >
                                        {campaign.status === 'running' ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                                    </button>
                                </div>

                                <div className="grid grid-cols-3 gap-4 text-sm">
                                    <div className="bg-[var(--surface-light)] p-3 rounded-lg">
                                        <p className="text-[var(--text-muted)] mb-1 flex items-center gap-1"><FileSpreadsheet className="w-3 h-3" /> Contatos</p>
                                        <p className="font-semibold">{campaign._count?.items || 0}</p>
                                    </div>
                                    <div className="bg-[var(--surface-light)] p-3 rounded-lg">
                                        <p className="text-[var(--text-muted)] mb-1 flex items-center gap-1"><Clock className="w-3 h-3" /> Intervalo</p>
                                        <p className="font-semibold">{campaign.minInterval}-{campaign.maxInterval}s</p>
                                    </div>
                                    <div className="flex items-center justify-end text-[var(--primary)]">
                                        Ver Detalhes <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
