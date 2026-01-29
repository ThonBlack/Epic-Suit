import { useState, useEffect, useCallback } from 'react';
import { Download, Filter, RefreshCw } from 'lucide-react';
import api from '../lib/api';

export default function LogsTable({ accountId, campaignId }) {
    const [logs, setLogs] = useState([]);
    const [stats, setStats] = useState({ total: 0 });
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(0);

    const fetchLogs = useCallback(async () => {
        setLoading(true);
        try {
            const params = { limit: 50, offset: page * 50 };
            if (accountId) params.accountId = accountId;
            if (campaignId) params.campaignId = campaignId;

            const res = await api.get('/logs', { params });
            setLogs(res.data.logs);
            setStats({ total: res.data.total });
        } catch (error) {
            console.error('Erro ao buscar logs:', error);
        } finally {
            setLoading(false);
        }
    }, [accountId, campaignId, page]);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    const handleExport = async () => {
        try {
            const params = {};
            if (accountId) params.accountId = accountId;
            if (campaignId) params.campaignId = campaignId;

            const res = await api.get('/logs/export', {
                params,
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `logs-${new Date().toISOString()}.csv`);
            document.body.appendChild(link);
            link.click();
        } catch (error) {
            console.error(error);
            alert('Erro ao exportar logs');
        }
    };

    const getLevelColor = (level) => {
        switch (level) {
            case 'error': return 'text-red-400';
            case 'warning': return 'text-amber-400';
            default: return 'text-blue-400';
        }
    };

    return (
        <div className="glass rounded-2xl p-6">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Filter className="w-5 h-5" /> Logs de Atividade
                </h3>
                <div className="flex gap-2">
                    <button onClick={fetchLogs} className="p-2 hover:bg-[var(--surface-light)] rounded-lg" title="Atualizar">
                        <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                    <button onClick={handleExport} className="flex items-center gap-2 px-3 py-2 bg-[var(--surface-light)] rounded-lg hover:bg-[var(--border)] transition-colors text-sm">
                        <Download className="w-4 h-4" /> Exportar CSV
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-[var(--border)] text-[var(--text-muted)] text-sm">
                            <th className="p-3">Data</th>
                            <th className="p-3">Nível</th>
                            <th className="p-3">Ação</th>
                            <th className="p-3">Detalhes</th>
                        </tr>
                    </thead>
                    <tbody>
                        {logs.length === 0 ? (
                            <tr>
                                <td colSpan="4" className="p-8 text-center text-[var(--text-muted)]">Nenhum registro encontrado.</td>
                            </tr>
                        ) : (
                            logs.map(log => (
                                <tr key={log.id} className="border-b border-[var(--border)] hover:bg-[var(--surface-light)]/50 transition-colors">
                                    <td className="p-3 text-sm whitespace-nowrap text-[var(--text-muted)]">
                                        {new Date(log.createdAt).toLocaleString()}
                                    </td>
                                    <td className={`p-3 text-sm font-medium ${getLevelColor(log.type)} uppercase`}>
                                        {log.type}
                                    </td>
                                    <td className="p-3 text-sm font-medium">{log.action}</td>
                                    <td className="p-3 text-sm max-w-md truncate" title={log.details}>
                                        {log.details}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Simple Pagination */}
            <div className="mt-4 flex justify-between items-center text-sm text-[var(--text-muted)]">
                <span>Total: {stats.total}</span>
                <div className="flex gap-2">
                    <button
                        disabled={page === 0}
                        onClick={() => setPage(p => p - 1)}
                        className="px-3 py-1 bg-[var(--surface-light)] rounded disabled:opacity-50"
                    >
                        Anterior
                    </button>
                    <button
                        disabled={(page + 1) * 50 >= stats.total}
                        onClick={() => setPage(p => p + 1)}
                        className="px-3 py-1 bg-[var(--surface-light)] rounded disabled:opacity-50"
                    >
                        Próxima
                    </button>
                </div>
            </div>
        </div>
    );
}
