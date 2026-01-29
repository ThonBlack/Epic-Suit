import { useEffect, useState } from 'react';
import Header from '../../components/Header';
import api from '../../lib/api';
import { Smartphone, Clock, CheckCircle, Zap } from 'lucide-react';

export default function Dashboard() {
    const [stats, setStats] = useState({
        totalAccounts: 0,
        connectedAccounts: 0,
        pendingJobs: 0,
        completedJobs: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
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
            icon: Clock,
            label: 'Agendados',
            value: stats.pendingJobs,
            color: 'from-amber-500 to-orange-600',
            glow: 'shadow-amber-500/20'
        },
        {
            icon: CheckCircle,
            label: 'Enviados',
            value: stats.completedJobs,
            color: 'from-blue-500 to-indigo-600',
            glow: 'shadow-blue-500/20'
        },
        {
            icon: Zap,
            label: 'Taxa de Sucesso',
            value: stats.completedJobs > 0
                ? `${Math.round((stats.completedJobs / (stats.completedJobs + stats.pendingJobs)) * 100)}%`
                : '100%',
            color: 'from-purple-500 to-pink-600',
            glow: 'shadow-purple-500/20'
        }
    ];

    return (
        <div className="min-h-screen">
            <Header title="Dashboard" />

            <div className="p-6">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {statCards.map((card, index) => (
                        <div
                            key={index}
                            className={`group relative overflow-hidden rounded-2xl bg-[var(--surface)] border border-[var(--border)] p-6 hover:border-[var(--primary)]/50 transition-all duration-300 hover:-translate-y-1 shadow-xl ${card.glow}`}
                        >
                            {/* Background Gradient */}
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

                {/* Quick Actions */}
                <div className="glass rounded-2xl p-6 mb-8">
                    <h3 className="text-lg font-semibold mb-4">Ações Rápidas</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <a
                            href="/accounts"
                            className="p-4 bg-[var(--surface-light)] rounded-xl border border-[var(--border)] hover:border-[var(--primary)] transition-all group"
                        >
                            <Smartphone className="w-8 h-8 mb-3 text-[var(--primary)] group-hover:scale-110 transition-transform" />
                            <h4 className="font-medium mb-1">Conectar Conta</h4>
                            <p className="text-sm text-[var(--text-muted)]">Adicione uma nova conta WhatsApp</p>
                        </a>
                        <a
                            href="/new-status"
                            className="p-4 bg-[var(--surface-light)] rounded-xl border border-[var(--border)] hover:border-[var(--primary)] transition-all group"
                        >
                            <Clock className="w-8 h-8 mb-3 text-amber-500 group-hover:scale-110 transition-transform" />
                            <h4 className="font-medium mb-1">Agendar Status</h4>
                            <p className="text-sm text-[var(--text-muted)]">Crie um novo agendamento</p>
                        </a>
                        <a
                            href="/scheduled"
                            className="p-4 bg-[var(--surface-light)] rounded-xl border border-[var(--border)] hover:border-[var(--primary)] transition-all group"
                        >
                            <CheckCircle className="w-8 h-8 mb-3 text-blue-500 group-hover:scale-110 transition-transform" />
                            <h4 className="font-medium mb-1">Ver Agendados</h4>
                            <p className="text-sm text-[var(--text-muted)]">Gerencie seus agendamentos</p>
                        </a>
                    </div>
                </div>

                {/* Welcome Banner */}
                <div className="relative overflow-hidden rounded-2xl gradient-primary p-8">
                    <div className="relative z-10">
                        <h2 className="text-2xl font-bold mb-2">Bem-vindo ao WA Status Scheduler! 👋</h2>
                        <p className="text-white/80 max-w-xl">
                            Automatize seus status do WhatsApp em múltiplas contas. Agende posts,
                            defina repetições e deixe o sistema fazer o resto.
                        </p>
                    </div>
                    <div className="absolute right-0 bottom-0 w-64 h-64 opacity-20">
                        <div className="w-full h-full rounded-full bg-white/20 blur-3xl"></div>
                    </div>
                </div>
            </div>
        </div>
    );
}
