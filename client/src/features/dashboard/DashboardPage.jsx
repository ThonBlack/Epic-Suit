import { useEffect, useState } from 'react';
import Header from '../../components/Header';
import api from '../../lib/api';
import {
    Smartphone,
    Clock,
    CheckCircle,
    AlertTriangle,
    Megaphone,
    MessageSquare,
    Activity,
    MessageCircle
} from 'lucide-react';

export default function Dashboard() {
    const [stats, setStats] = useState({
        totalAccounts: 0,
        connectedAccounts: 0,
        messagesToday: 0,
        errorsLast24h: 0,
        pendingJobs: 0,
        completedJobs: 0,
        failedJobs: 0,
        runningCampaigns: 0,
        totalCampaigns: 0,
        activeAutoReplies: 0,
        upcomingJobs: [],
        activeCampaigns: [],
        recentActivity: []
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
        // Atualiza a cada 30 segundos
        const interval = setInterval(fetchStats, 30000);
        return () => clearInterval(interval);
    }, []);

    const fetchStats = async () => {
        try {
            const response = await api.get('/stats');
            setStats(response.data);
        } catch (error) {
            console.error('Erro ao buscar stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const statCards = [
        {
            icon: Smartphone,
            label: 'Contas Conectadas',
            value: `${stats.connectedAccounts}/${stats.totalAccounts}`,
            color: 'from-emerald-500 to-green-600',
            glow: 'shadow-emerald-500/20'
        },
        {
            icon: MessageSquare,
            label: 'Mensagens Hoje',
            value: stats.messagesToday,
            color: 'from-blue-500 to-indigo-600',
            glow: 'shadow-blue-500/20'
        },
        {
            icon: Megaphone,
            label: 'Campanhas Ativas',
            value: stats.runningCampaigns,
            color: 'from-violet-500 to-purple-600',
            glow: 'shadow-violet-500/20'
        },
        {
            icon: AlertTriangle,
            label: 'Erros 24h',
            value: stats.errorsLast24h,
            color: stats.errorsLast24h > 0 ? 'from-red-500 to-rose-600' : 'from-gray-500 to-gray-600',
            glow: stats.errorsLast24h > 0 ? 'shadow-red-500/20' : 'shadow-gray-500/20'
        }
    ];

    const secondaryStats = [
        { label: 'Agendados', value: stats.pendingJobs, icon: Clock },
        { label: 'Enviados', value: stats.completedJobs, icon: CheckCircle },
        { label: 'Auto Respostas', value: stats.activeAutoReplies, icon: MessageCircle },
        { label: 'Total Campanhas', value: stats.totalCampaigns, icon: Megaphone },
    ];

    return (
        <div className="min-h-screen">
            <Header title="Dashboard" />

            <div className="p-6">
                {/* KPIs Principais */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {statCards.map((card, index) => (
                        <div
                            key={index}
                            className={`group relative overflow-hidden rounded-2xl bg-[var(--surface)] border border-[var(--border)] p-6 hover:border-[var(--primary)]/50 transition-all duration-300 hover:-translate-y-1 shadow-xl ${card.glow}`}
                        >
                            <div className={`absolute inset-0 bg-gradient-to-br ${card.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}></div>

                            <div className="relative flex items-center justify-between">
                                <div>
                                    <p className="text-[var(--text-muted)] text-sm mb-1">{card.label}</p>
                                    <p className="text-3xl font-bold">{loading ? '...' : card.value}</p>
                                </div>
                                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center shadow-lg`}>
                                    <card.icon className="w-6 h-6 text-white" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Stats Secundárias */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {secondaryStats.map((stat, index) => (
                        <div key={index} className="bg-[var(--surface)] rounded-xl border border-[var(--border)] p-4 flex items-center gap-4">
                            <stat.icon className="w-5 h-5 text-[var(--text-muted)]" />
                            <div>
                                <p className="text-xs text-[var(--text-muted)]">{stat.label}</p>
                                <p className="text-xl font-semibold">{loading ? '...' : stat.value}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Campanhas em Andamento */}
                {stats.activeCampaigns.length > 0 && (
                    <div className="glass rounded-2xl p-6 mb-8">
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <Megaphone className="w-5 h-5 text-violet-500" />
                            Campanhas em Andamento
                        </h3>
                        <div className="space-y-4">
                            {stats.activeCampaigns.map((campaign) => (
                                <div key={campaign.id} className="bg-[var(--surface-light)] rounded-xl p-4">
                                    <div className="flex justify-between items-center mb-2">
                                        <div>
                                            <p className="font-medium">{campaign.name}</p>
                                            <p className="text-xs text-[var(--text-muted)]">{campaign.account}</p>
                                        </div>
                                        <span className="text-sm text-[var(--text-muted)]">
                                            {campaign.sent}/{campaign.total}
                                        </span>
                                    </div>
                                    <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-violet-500 to-purple-400 transition-all duration-500"
                                            style={{ width: `${campaign.progress}%` }}
                                        />
                                    </div>
                                    <p className="text-xs text-[var(--text-muted)] mt-1 text-right">
                                        {campaign.progress}% concluído
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Próximos Agendamentos + Ações Rápidas */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    {/* Próximos Agendamentos */}
                    <div className="glass rounded-2xl p-6">
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <Clock className="w-5 h-5 text-amber-500" />
                            Próximos Agendamentos
                        </h3>
                        {stats.upcomingJobs.length === 0 ? (
                            <p className="text-[var(--text-muted)] text-sm">Nenhum agendamento pendente</p>
                        ) : (
                            <div className="space-y-3">
                                {stats.upcomingJobs.map((job) => (
                                    <div key={job.id} className="flex items-center justify-between p-3 bg-[var(--surface-light)] rounded-lg">
                                        <div>
                                            <p className="font-medium text-sm">{job.account?.name || 'Conta'}</p>
                                            <p className="text-xs text-[var(--text-muted)]">
                                                {new Date(job.scheduledAt).toLocaleString('pt-BR')}
                                            </p>
                                        </div>
                                        <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Ações Rápidas */}
                    <div className="glass rounded-2xl p-6">
                        <h3 className="text-lg font-semibold mb-4">Ações Rápidas</h3>
                        <div className="grid grid-cols-2 gap-3">
                            <a
                                href="/accounts"
                                className="p-4 bg-[var(--surface-light)] rounded-xl border border-[var(--border)] hover:border-[var(--primary)] transition-all group text-center"
                            >
                                <Smartphone className="w-6 h-6 mb-2 mx-auto text-emerald-500 group-hover:scale-110 transition-transform" />
                                <span className="text-sm font-medium">Contas</span>
                            </a>
                            <a
                                href="/new-status"
                                className="p-4 bg-[var(--surface-light)] rounded-xl border border-[var(--border)] hover:border-[var(--primary)] transition-all group text-center"
                            >
                                <Clock className="w-6 h-6 mb-2 mx-auto text-amber-500 group-hover:scale-110 transition-transform" />
                                <span className="text-sm font-medium">Agendar Status</span>
                            </a>
                            <a
                                href="/campaigns/new"
                                className="p-4 bg-[var(--surface-light)] rounded-xl border border-[var(--border)] hover:border-[var(--primary)] transition-all group text-center"
                            >
                                <Megaphone className="w-6 h-6 mb-2 mx-auto text-violet-500 group-hover:scale-110 transition-transform" />
                                <span className="text-sm font-medium">Nova Campanha</span>
                            </a>
                            <a
                                href="/autoreply"
                                className="p-4 bg-[var(--surface-light)] rounded-xl border border-[var(--border)] hover:border-[var(--primary)] transition-all group text-center"
                            >
                                <MessageCircle className="w-6 h-6 mb-2 mx-auto text-blue-500 group-hover:scale-110 transition-transform" />
                                <span className="text-sm font-medium">Auto Resposta</span>
                            </a>
                        </div>
                    </div>
                </div>

                {/* Atividade Recente */}
                {stats.recentActivity.length > 0 && (
                    <div className="glass rounded-2xl p-6">
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <Activity className="w-5 h-5 text-blue-500" />
                            Atividade Recente
                        </h3>
                        <div className="space-y-2">
                            {stats.recentActivity.slice(0, 5).map((log, index) => (
                                <div key={index} className="flex items-center gap-3 p-3 bg-[var(--surface-light)] rounded-lg">
                                    <div className={`w-2 h-2 rounded-full ${log.type === 'error' ? 'bg-red-500' :
                                            log.type === 'warning' ? 'bg-yellow-500' : 'bg-emerald-500'
                                        }`}></div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm truncate">{log.action}</p>
                                        <p className="text-xs text-[var(--text-muted)]">
                                            {log.account?.name || log.campaign?.name || ''}
                                        </p>
                                    </div>
                                    <span className="text-xs text-[var(--text-muted)]">
                                        {new Date(log.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
