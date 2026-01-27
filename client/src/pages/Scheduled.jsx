import { useEffect, useState } from 'react';
import Header from '../components/Header';
import api from '../lib/api';
import { Clock, CheckCircle, XCircle, Trash2, Loader2, Calendar, Image } from 'lucide-react';

export default function Scheduled() {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        fetchJobs();
    }, []);

    const fetchJobs = async () => {
        try {
            const response = await api.get('/jobs');
            setJobs(response.data);
        } catch (error) {
            console.error('Erro ao buscar jobs:', error);
        } finally {
            setLoading(false);
        }
    };

    const deleteJob = async (id) => {
        if (!confirm('Tem certeza que deseja remover este agendamento?')) return;
        try {
            await api.delete(`/jobs/${id}`);
            setJobs(prev => prev.filter(job => job.id !== id));
        } catch (error) {
            console.error('Erro ao deletar job:', error);
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'sent':
                return <CheckCircle className="w-5 h-5 text-emerald-400" />;
            case 'failed':
                return <XCircle className="w-5 h-5 text-red-400" />;
            default:
                return <Clock className="w-5 h-5 text-amber-400" />;
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'sent':
                return (
                    <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-sm">
                        Enviado
                    </span>
                );
            case 'failed':
                return (
                    <span className="px-3 py-1 rounded-full bg-red-500/20 text-red-400 text-sm">
                        Falhou
                    </span>
                );
            default:
                return (
                    <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 text-sm">
                        Pendente
                    </span>
                );
        }
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const filteredJobs = jobs.filter(job => {
        if (filter === 'all') return true;
        return job.status === filter;
    });

    const stats = {
        total: jobs.length,
        pending: jobs.filter(j => j.status === 'pending').length,
        sent: jobs.filter(j => j.status === 'sent').length,
        failed: jobs.filter(j => j.status === 'failed').length
    };

    return (
        <div className="min-h-screen">
            <Header title="Agendamentos" />

            <div className="p-6">
                {/* Stats */}
                <div className="grid grid-cols-4 gap-4 mb-6">
                    <button
                        onClick={() => setFilter('all')}
                        className={`p-4 rounded-xl transition-all ${filter === 'all'
                                ? 'bg-[var(--primary)] text-white'
                                : 'glass hover:border-[var(--primary)]/50'
                            }`}
                    >
                        <p className="text-2xl font-bold">{stats.total}</p>
                        <p className="text-sm opacity-80">Total</p>
                    </button>
                    <button
                        onClick={() => setFilter('pending')}
                        className={`p-4 rounded-xl transition-all ${filter === 'pending'
                                ? 'bg-amber-500 text-white'
                                : 'glass hover:border-amber-500/50'
                            }`}
                    >
                        <p className="text-2xl font-bold">{stats.pending}</p>
                        <p className="text-sm opacity-80">Pendentes</p>
                    </button>
                    <button
                        onClick={() => setFilter('sent')}
                        className={`p-4 rounded-xl transition-all ${filter === 'sent'
                                ? 'bg-emerald-500 text-white'
                                : 'glass hover:border-emerald-500/50'
                            }`}
                    >
                        <p className="text-2xl font-bold">{stats.sent}</p>
                        <p className="text-sm opacity-80">Enviados</p>
                    </button>
                    <button
                        onClick={() => setFilter('failed')}
                        className={`p-4 rounded-xl transition-all ${filter === 'failed'
                                ? 'bg-red-500 text-white'
                                : 'glass hover:border-red-500/50'
                            }`}
                    >
                        <p className="text-2xl font-bold">{stats.failed}</p>
                        <p className="text-sm opacity-80">Falharam</p>
                    </button>
                </div>

                {/* Jobs List */}
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
                    </div>
                ) : filteredJobs.length === 0 ? (
                    <div className="glass rounded-2xl p-12 text-center">
                        <Calendar className="w-16 h-16 mx-auto mb-4 text-[var(--text-muted)]" />
                        <h3 className="text-xl font-semibold mb-2">
                            {filter === 'all' ? 'Nenhum agendamento' : `Nenhum agendamento ${filter === 'pending' ? 'pendente' : filter === 'sent' ? 'enviado' : 'com falha'}`}
                        </h3>
                        <p className="text-[var(--text-muted)]">
                            Crie um novo agendamento para começar
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredJobs.map((job) => (
                            <div
                                key={job.id}
                                className="glass rounded-2xl p-6 hover:border-[var(--primary)]/50 transition-all"
                            >
                                <div className="flex items-start gap-4">
                                    {/* Media Preview */}
                                    {job.mediaPath && (
                                        <div className="w-20 h-20 rounded-xl bg-[var(--surface-light)] flex items-center justify-center overflow-hidden flex-shrink-0">
                                            <img
                                                src={`http://localhost:3001/uploads/${job.mediaPath}`}
                                                alt="Preview"
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    e.target.style.display = 'none';
                                                    e.target.parentElement.innerHTML = '<svg class="w-8 h-8 text-[var(--text-muted)]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>';
                                                }}
                                            />
                                        </div>
                                    )}

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3 mb-2">
                                            {getStatusIcon(job.status)}
                                            <span className="font-semibold">{job.account?.name || 'Conta removida'}</span>
                                            {getStatusBadge(job.status)}
                                        </div>

                                        {job.caption && (
                                            <p className="text-[var(--text-muted)] mb-2 line-clamp-2">
                                                {job.caption}
                                            </p>
                                        )}

                                        <div className="flex items-center gap-4 text-sm text-[var(--text-muted)]">
                                            <span className="flex items-center gap-1">
                                                <Clock className="w-4 h-4" />
                                                {formatDate(job.scheduledAt)}
                                            </span>
                                            {job.repeatType && (
                                                <span className="px-2 py-0.5 bg-[var(--surface-light)] rounded-full text-xs">
                                                    {job.repeatType === 'daily' ? 'Diário' : 'Semanal'}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <button
                                        onClick={() => deleteJob(job.id)}
                                        className="p-2.5 bg-[var(--surface-light)] rounded-xl hover:bg-red-500/20 hover:text-red-400 transition-colors flex-shrink-0"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
