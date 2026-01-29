import { useState } from 'react';
import { Upload, X, Clock, AlertCircle, Shield } from 'lucide-react';
import api from '../../../lib/api';

export default function RuleForm({ accountId, onSuccess, onCancel }) {
    const [tab, setTab] = useState('basic'); // basic, advanced, filters
    const [loading, setLoading] = useState(false);

    // Form Data
    const [name, setName] = useState('');
    const [trigger, setTrigger] = useState('');
    const [response, setResponse] = useState('');
    const [matchType, setMatchType] = useState('contains');
    const [priority, setPriority] = useState(0);
    const [delay, setDelay] = useState(0);
    const [media, setMedia] = useState(null);

    // Filters
    const [isPrivate, setIsPrivate] = useState(true);
    const [isGroup, setIsGroup] = useState(false);
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData();
        formData.append('accountId', accountId);
        formData.append('trigger', trigger);
        formData.append('response', response);
        if (name) formData.append('name', name);
        formData.append('matchType', matchType);
        formData.append('priority', priority);
        formData.append('delay', delay);
        formData.append('isPrivate', isPrivate);
        formData.append('isGroup', isGroup);
        if (startTime) formData.append('startTime', startTime);
        if (endTime) formData.append('endTime', endTime);
        if (media) formData.append('media', media);

        try {
            await api.post('/autoreply', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            onSuccess();
        } catch (error) {
            alert('Erro ao criar regra: ' + (error.response?.data?.error || error.message));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="glass rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold">Nova Regra</h3>
                <button onClick={onCancel} className="p-2 hover:bg-[var(--border)] rounded-full">
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6 border-b border-[var(--border)]">
                {['basic', 'advanced', 'filters'].map(t => (
                    <button
                        key={t}
                        onClick={() => setTab(t)}
                        className={`px-4 py-2 capitalize font-medium border-b-2 transition-colors ${tab === t
                            ? 'border-[var(--primary)] text-[var(--primary)]'
                            : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text)]'
                            }`}
                    >
                        {t === 'basic' ? 'Básico' : t === 'advanced' ? 'Avançado' : 'Filtros'}
                    </button>
                ))}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">

                {tab === 'basic' && (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm mb-1 text-[var(--text-muted)]">Nome da Regra (Opcional)</label>
                            <input
                                className="w-full bg-[var(--surface-light)] border border-[var(--border)] rounded-xl px-4 py-2"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                placeholder="Ex: Lead Quente"
                            />
                        </div>
                        <div>
                            <label className="block text-sm mb-1 text-[var(--text-muted)]">Gatilho (Texto recebido)</label>
                            <input
                                className="w-full bg-[var(--surface-light)] border border-[var(--border)] rounded-xl px-4 py-2"
                                value={trigger}
                                onChange={e => setTrigger(e.target.value)}
                                placeholder="Ex: preço, oi, promo"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm mb-1 text-[var(--text-muted)]">Resposta</label>
                            <textarea
                                className="w-full bg-[var(--surface-light)] border border-[var(--border)] rounded-xl px-4 py-2 resize-none h-32"
                                value={response}
                                onChange={e => setResponse(e.target.value)}
                                placeholder="Mensagem a ser enviada..."
                            />
                        </div>
                        <div>
                            <label className="block text-sm mb-1 text-[var(--text-muted)]">Mídia (Opcional)</label>
                            <input
                                type="file"
                                onChange={e => setMedia(e.target.files[0])}
                                className="w-full text-sm"
                            />
                        </div>
                    </div>
                )}

                {tab === 'advanced' && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm mb-1 text-[var(--text-muted)]">Tipo de Correspondência</label>
                                <select
                                    className="w-full bg-[var(--surface-light)] border border-[var(--border)] rounded-xl px-4 py-2"
                                    value={matchType}
                                    onChange={e => setMatchType(e.target.value)}
                                >
                                    <option value="contains">Contém (Mais comum)</option>
                                    <option value="exact">Exato (Igual)</option>
                                    <option value="regex">Regex (Avançado)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm mb-1 text-[var(--text-muted)]">Prioridade</label>
                                <input
                                    type="number"
                                    className="w-full bg-[var(--surface-light)] border border-[var(--border)] rounded-xl px-4 py-2"
                                    value={priority}
                                    onChange={e => setPriority(e.target.value)}
                                    placeholder="0"
                                />
                                <p className="text-xs text-[var(--text-muted)] mt-1">Regras com maior prioridade são testadas primeiro.</p>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm mb-1 text-[var(--text-muted)]">Atraso (Delay) em segundos</label>
                            <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-[var(--text-muted)]" />
                                <input
                                    type="number"
                                    className="w-full bg-[var(--surface-light)] border border-[var(--border)] rounded-xl px-4 py-2"
                                    value={delay}
                                    onChange={e => setDelay(e.target.value)}
                                    placeholder="0"
                                />
                            </div>
                            <p className="text-xs text-[var(--text-muted)] mt-1">Simula digitação humana antes de enviar.</p>
                        </div>
                    </div>
                )}

                {tab === 'filters' && (
                    <div className="space-y-6">
                        <div className="flex gap-6">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={isPrivate}
                                    onChange={e => setIsPrivate(e.target.checked)}
                                    className="w-5 h-5 rounded theme-checkbox"
                                />
                                <span>Conversas Privadas</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={isGroup}
                                    onChange={e => setIsGroup(e.target.checked)}
                                    className="w-5 h-5 rounded theme-checkbox"
                                />
                                <span>Grupos</span>
                            </label>
                        </div>

                        <div className="pt-4 border-t border-[var(--border)]">
                            <h4 className="font-semibold mb-3 flex items-center gap-2"><Clock className="w-4 h-4" /> Horário de Funcionamento</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm mb-1 text-[var(--text-muted)]">Início</label>
                                    <input
                                        type="time"
                                        className="w-full bg-[var(--surface-light)] border border-[var(--border)] rounded-xl px-4 py-2"
                                        value={startTime}
                                        onChange={e => setStartTime(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm mb-1 text-[var(--text-muted)]">Fim</label>
                                    <input
                                        type="time"
                                        className="w-full bg-[var(--surface-light)] border border-[var(--border)] rounded-xl px-4 py-2"
                                        value={endTime}
                                        onChange={e => setEndTime(e.target.value)}
                                    />
                                </div>
                            </div>
                            <p className="text-xs text-[var(--text-muted)] mt-2 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Deixe em branco para funcionar 24h.</p>
                        </div>
                    </div>
                )}

                <div className="flex gap-2 mt-8 pt-4 border-t border-[var(--border)]">
                    <button type="button" onClick={onCancel} className="flex-1 py-3 bg-[var(--surface-light)] rounded-xl hover:bg-[var(--border)] transition-colors">
                        Cancelar
                    </button>
                    <button type="submit" disabled={loading} className="flex-1 py-3 gradient-primary rounded-xl font-medium hover:opacity-90 disabled:opacity-50">
                        {loading ? 'Salvando...' : 'Salvar Regra'}
                    </button>
                </div>
            </form>
        </div>
    );
}
