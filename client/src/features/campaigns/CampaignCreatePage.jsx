import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/Header';
import api from '../../lib/api';
import { Upload, Clock, Send, Loader2, AlertCircle, Download } from 'lucide-react';

export default function CampaignCreatePage() {
    const navigate = useNavigate();
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(false);

    // Form Data
    const [name, setName] = useState('');
    const [template, setTemplate] = useState('');
    const [selectedAccount, setSelectedAccount] = useState('');
    const [minInterval, setMinInterval] = useState(15);
    const [maxInterval, setMaxInterval] = useState(60);
    const [scheduledAt, setScheduledAt] = useState('');
    const [isDryRun, setIsDryRun] = useState(false);
    const [testNumber, setTestNumber] = useState('');
    const [csvFile, setCsvFile] = useState(null);
    const [mediaFile, setMediaFile] = useState(null);

    useEffect(() => {
        const fetchAccounts = async () => {
            const res = await api.get('/accounts');
            setAccounts(res.data);
            if (res.data.length > 0) setSelectedAccount(res.data[0].id);
        };
        fetchAccounts();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!csvFile) return alert('Selecione um arquivo CSV');

        setLoading(true);
        const formData = new FormData();
        formData.append('name', name);
        formData.append('messageTemplate', template);
        formData.append('accountId', selectedAccount);
        formData.append('minInterval', minInterval);
        formData.append('maxInterval', maxInterval);
        if (scheduledAt) formData.append('scheduledAt', scheduledAt);
        formData.append('isDryRun', isDryRun);
        if (testNumber) formData.append('testNumber', testNumber);
        formData.append('csv', csvFile);
        if (mediaFile) formData.append('media', mediaFile);

        try {
            await api.post('/campaigns', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            navigate('/campaigns');
        } catch (error) {
            console.error(error);
            alert('Erro ao criar campanha: ' + (error.response?.data?.error || error.message));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen">
            <Header title="Nova Campanha" />
            <div className="p-6 max-w-3xl mx-auto">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic Info */}
                    <div className="glass rounded-2xl p-6">
                        <h3 className="text-lg font-semibold mb-4">Informações Básicas</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm text-[var(--text-muted)] mb-1">Nome da Campanha</label>
                                <input
                                    className="w-full bg-[var(--surface-light)] border border-[var(--border)] rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                                    placeholder="Ex: Promoção de Verão"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-[var(--text-muted)] mb-1">Conta de Envio</label>
                                <select
                                    className="w-full bg-[var(--surface-light)] border border-[var(--border)] rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                                    value={selectedAccount}
                                    onChange={e => setSelectedAccount(e.target.value)}
                                    required
                                >
                                    {accounts.map(acc => (
                                        <option key={acc.id} value={acc.id}>{acc.name} ({acc.status})</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Configuration */}
                    <div className="glass rounded-2xl p-6">
                        <h3 className="text-lg font-semibold mb-4">Configuração de Envio</h3>

                        <div className="mb-4">
                            <div className="flex items-center justify-between mb-1">
                                <label className="block text-sm text-[var(--text-muted)]">Arquivo de Contatos (.csv ou .xlsx)</label>
                                <a
                                    href="/templates/modelo_contatos.csv"
                                    download="modelo_contatos.csv"
                                    className="inline-flex items-center gap-1 text-xs text-[var(--primary)] hover:underline"
                                >
                                    <Download className="w-3 h-3" />
                                    Baixar modelo
                                </a>
                            </div>
                            <div className="border-2 border-dashed border-[var(--border)] rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer hover:border-[var(--primary)] transition-colors relative">
                                <input
                                    type="file"
                                    accept=".csv,.xlsx,.xls"
                                    onChange={e => setCsvFile(e.target.files[0])}
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                />
                                <Upload className="w-8 h-8 text-[var(--text-muted)] mb-2" />
                                <span className="text-sm font-medium">
                                    {csvFile ? csvFile.name : 'Clique para enviar planilha'}
                                </span>
                                <span className="text-xs text-[var(--text-muted)] mt-1">CSV ou Excel • Colunas detectadas automaticamente</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm text-[var(--text-muted)] mb-1">Intervalo Mínimo (s)</label>
                                <input
                                    type="number"
                                    className="w-full bg-[var(--surface-light)] border border-[var(--border)] rounded-xl px-4 py-3"
                                    value={minInterval}
                                    onChange={e => setMinInterval(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-[var(--text-muted)] mb-1">Intervalo Máximo (s)</label>
                                <input
                                    type="number"
                                    className="w-full bg-[var(--surface-light)] border border-[var(--border)] rounded-xl px-4 py-3"
                                    value={maxInterval}
                                    onChange={e => setMaxInterval(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="mt-4 pt-4 border-t border-[var(--border)]">
                            <label className="flex items-center gap-2 text-sm font-semibold mb-2">
                                <Clock className="w-4 h-4" /> Agendar Início (Opcional)
                            </label>
                            <input
                                type="datetime-local"
                                className="w-full bg-[var(--surface-light)] border border-[var(--border)] rounded-xl px-4 py-3"
                                value={scheduledAt}
                                onChange={e => setScheduledAt(e.target.value)}
                            />
                            <p className="text-xs text-[var(--text-muted)] mt-1">Se definido, a campanha iniciará automaticamente nesta data.</p>
                        </div>

                        {/* Testing & Simulation */}
                        <div className="mt-4 pt-4 border-t border-[var(--border)] space-y-4">
                            <h4 className="text-sm font-semibold flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 text-purple-400" /> Teste & Simulação
                            </h4>

                            <label className="flex items-center gap-2 cursor-pointer p-3 bg-[var(--background)] rounded-lg border border-[var(--border)]">
                                <input
                                    type="checkbox"
                                    checked={isDryRun}
                                    onChange={e => setIsDryRun(e.target.checked)}
                                    className="w-4 h-4 rounded theme-checkbox"
                                />
                                <div className="flex-1">
                                    <span className="text-sm font-medium block">Modo Simulação (Dry Run)</span>
                                    <span className="text-xs text-[var(--text-muted)] block">Simula todo o processo sem enviar mensagens reais. Gera logs.</span>
                                </div>
                            </label>

                            <div>
                                <label className="block text-sm text-[var(--text-muted)] mb-1">Número de Teste (Opcional)</label>
                                <input
                                    type="text"
                                    className="w-full bg-[var(--surface-light)] border border-[var(--border)] rounded-xl px-4 py-3"
                                    placeholder="Ex: 5511999999999"
                                    value={testNumber}
                                    onChange={e => setTestNumber(e.target.value)}
                                />
                                <p className="text-xs text-[var(--text-muted)] mt-1">Se preenchido, TODAS as mensagens serão enviadas para este número.</p>
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="glass rounded-2xl p-6">
                        <h3 className="text-lg font-semibold mb-4">Conteúdo da Mensagem</h3>

                        <div className="mb-4">
                            <label className="block text-sm text-[var(--text-muted)] mb-1">Mensagem (Spintax suportado)</label>
                            <textarea
                                className="w-full bg-[var(--surface-light)] border border-[var(--border)] rounded-xl px-4 py-3 h-32 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] resize-none"
                                placeholder="Olá {nome}, tudo bem? {Confira|Veja} nossas ofertas!"
                                value={template}
                                onChange={e => setTemplate(e.target.value)}
                                required
                            />
                            <p className="text-xs text-[var(--text-muted)] mt-2">
                                Variáveis: <code>{'{nome}'}</code>, <code>{'{primeiro_nome}'}</code>, <code>{'{telefone}'}</code>, <code>{'{data}'}</code>. Spintax: <code>{'{Olá|Oi}'}</code>
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm text-[var(--text-muted)] mb-1">Mídia (Opcional)</label>
                            <input
                                type="file"
                                accept="image/*,video/*"
                                onChange={e => setMediaFile(e.target.files[0])}
                                className="w-full bg-[var(--surface-light)] border border-[var(--border)] rounded-xl px-4 py-2 text-sm"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 gradient-primary rounded-xl font-bold text-lg hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : <Send />}
                        Criar Campanha
                    </button>
                </form>
            </div >
        </div >
    );
}
