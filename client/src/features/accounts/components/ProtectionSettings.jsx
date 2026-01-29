import { useState, useEffect } from 'react';
import { Shield, Clock, AlertTriangle, Save, X } from 'lucide-react';
import api from '../../../lib/api';

export default function ProtectionSettings({ accountId, onClose }) {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState({
        dailyLimit: 1000,
        minDelay: 5,
        maxDelay: 15,
        autoPause: false,
        pauseAfter: 50,
        pauseDuration: 10,
        useTyping: true
    });

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await api.get(`/accounts/${accountId}`);
                const data = res.data;
                setSettings({
                    dailyLimit: data.dailyLimit || 1000,
                    minDelay: data.minDelay || 5,
                    maxDelay: data.maxDelay || 15,
                    autoPause: data.autoPause || false,
                    pauseAfter: data.pauseAfter || 50,
                    pauseDuration: data.pauseDuration || 10,
                    useTyping: data.useTyping !== false // default true
                });
            } catch (error) {
                console.error('Erro buscar settings:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchSettings();
    }, [accountId]);

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await api.patch(`/accounts/${accountId}`, settings);
            onClose();
            alert('Configurações salvas com sucesso!');
        } catch (error) {
            alert('Erro ao salvar: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8 text-center">Carregando...</div>;

    return (
        <div className="glass rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2">
                    <Shield className="w-6 h-6 text-emerald-400" />
                    <h3 className="text-xl font-bold">Proteção & Anti-Ban</h3>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-[var(--border)] rounded-full">
                    <X className="w-5 h-5" />
                </button>
            </div>

            <form onSubmit={handleSave} className="space-y-6">

                {/* Limites Diários */}
                <div className="p-4 bg-[var(--surface-light)] rounded-xl border border-[var(--border)]">
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-400" /> Limites de Envio
                    </h4>
                    <div>
                        <label className="block text-sm mb-1 text-[var(--text-muted)]">Limite de Mensagens Diárias</label>
                        <input
                            type="number"
                            className="w-full bg-[var(--background)] border border-[var(--border)] rounded-lg px-3 py-2"
                            value={settings.dailyLimit}
                            onChange={e => setSettings({ ...settings, dailyLimit: parseInt(e.target.value) })}
                        />
                        <p className="text-xs text-[var(--text-muted)] mt-1">O contador reseta à meia-noite.</p>
                    </div>
                </div>

                {/* Comportamento Humano */}
                <div className="p-4 bg-[var(--surface-light)] rounded-xl border border-[var(--border)]">
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-blue-400" /> Comportamento Humano
                    </h4>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-sm mb-1 text-[var(--text-muted)]">Delay Mín (seg)</label>
                            <input
                                type="number"
                                className="w-full bg-[var(--background)] border border-[var(--border)] rounded-lg px-3 py-2"
                                value={settings.minDelay}
                                onChange={e => setSettings({ ...settings, minDelay: parseInt(e.target.value) })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm mb-1 text-[var(--text-muted)]">Delay Máx (seg)</label>
                            <input
                                type="number"
                                className="w-full bg-[var(--background)] border border-[var(--border)] rounded-lg px-3 py-2"
                                value={settings.maxDelay}
                                onChange={e => setSettings({ ...settings, maxDelay: parseInt(e.target.value) })}
                            />
                        </div>
                    </div>

                    <label className="flex items-center gap-2 cursor-pointer mb-2">
                        <input
                            type="checkbox"
                            checked={settings.useTyping}
                            onChange={e => setSettings({ ...settings, useTyping: e.target.checked })}
                            className="w-4 h-4 rounded theme-checkbox"
                        />
                        <span className="text-sm">Simular "Digitando..." antes de enviar</span>
                    </label>
                </div>

                {/* Pausa Automática */}
                <div className="p-4 bg-[var(--surface-light)] rounded-xl border border-[var(--border)]">
                    <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold flex items-center gap-2">
                            <Clock className="w-4 h-4 text-purple-400" /> Pausa Automática
                        </h4>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={settings.autoPause}
                                onChange={e => setSettings({ ...settings, autoPause: e.target.checked })}
                            />
                            <div className="w-9 h-5 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                        </label>
                    </div>

                    {settings.autoPause && (
                        <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
                            <div>
                                <label className="block text-sm mb-1 text-[var(--text-muted)]">Pausar após (msgs)</label>
                                <input
                                    type="number"
                                    className="w-full bg-[var(--background)] border border-[var(--border)] rounded-lg px-3 py-2"
                                    value={settings.pauseAfter}
                                    onChange={e => setSettings({ ...settings, pauseAfter: parseInt(e.target.value) })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm mb-1 text-[var(--text-muted)]">Duração (minutos)</label>
                                <input
                                    type="number"
                                    className="w-full bg-[var(--background)] border border-[var(--border)] rounded-lg px-3 py-2"
                                    value={settings.pauseDuration}
                                    onChange={e => setSettings({ ...settings, pauseDuration: parseInt(e.target.value) })}
                                />
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex gap-2 pt-2">
                    <button type="button" onClick={onClose} className="flex-1 py-3 bg-[var(--surface-light)] rounded-xl hover:bg-[var(--border)] transition-colors">
                        Cancelar
                    </button>
                    <button type="submit" disabled={saving} className="flex-1 py-3 gradient-primary rounded-xl font-medium hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2">
                        <Save className="w-4 h-4" />
                        {saving ? 'Salvando...' : 'Salvar Configurações'}
                    </button>
                </div>
            </form>
        </div>
    );
}
