import { useEffect, useState } from 'react';
import Header from '../components/Header';
import api from '../lib/api';
import { Upload, Calendar, Clock, Repeat, Send, Image, X, Loader2, AlertCircle } from 'lucide-react';

export default function NewStatus() {
    const [accounts, setAccounts] = useState([]);
    const [selectedAccounts, setSelectedAccounts] = useState([]);
    const [caption, setCaption] = useState('');
    const [scheduledAt, setScheduledAt] = useState('');
    const [repeatType, setRepeatType] = useState('');
    const [mediaFile, setMediaFile] = useState(null);
    const [mediaPreview, setMediaPreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [errors, setErrors] = useState([]);

    useEffect(() => {
        fetchAccounts();
    }, []);

    const fetchAccounts = async () => {
        try {
            const response = await api.get('/accounts');
            setAccounts(response.data);
        } catch (error) {
            console.error('Erro ao buscar contas:', error);
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            setMediaFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setMediaPreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const removeMedia = () => {
        setMediaFile(null);
        setMediaPreview(null);
    };

    const toggleAccount = (accountId) => {
        setSelectedAccounts(prev =>
            prev.includes(accountId)
                ? prev.filter(id => id !== accountId)
                : [...prev, accountId]
        );
    };

    const validateForm = () => {
        const newErrors = [];

        if (!mediaFile) {
            newErrors.push('Selecione uma imagem ou vídeo para o status');
        }
        if (!scheduledAt) {
            newErrors.push('Selecione a data e hora do agendamento');
        }
        if (selectedAccounts.length === 0) {
            newErrors.push('Selecione pelo menos uma conta');
        }

        setErrors(newErrors);
        return newErrors.length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setLoading(true);
        setErrors([]);

        try {
            for (const accountId of selectedAccounts) {
                const formData = new FormData();
                formData.append('accountId', accountId);
                formData.append('media', mediaFile);
                formData.append('caption', caption);
                formData.append('scheduledAt', scheduledAt);
                if (repeatType) {
                    formData.append('repeatType', repeatType);
                }

                await api.post('/jobs', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            }

            setSuccess(true);
            setSelectedAccounts([]);
            setCaption('');
            setScheduledAt('');
            setRepeatType('');
            removeMedia();

            setTimeout(() => setSuccess(false), 5000);
        } catch (error) {
            console.error('Erro ao criar agendamento:', error);
            const errorMessage = error.response?.data?.error || error.message || 'Erro desconhecido ao criar agendamento.';
            setErrors([`Erro: ${errorMessage}`]);
        } finally {
            setLoading(false);
        }
    };

    // Set minimum date/time to now
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    const minDateTime = now.toISOString().slice(0, 16);

    return (
        <div className="min-h-screen">
            <Header title="Novo Status" />

            <div className="p-6 max-w-4xl">
                {/* Success Message */}
                {success && (
                    <div className="mb-6 p-4 bg-emerald-500/20 border border-emerald-500/50 rounded-xl text-emerald-400 flex items-center gap-2">
                        <Send className="w-5 h-5" />
                        Status agendado com sucesso! Confira em "Agendados".
                    </div>
                )}

                {/* Error Messages */}
                {errors.length > 0 && (
                    <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-400">
                        <div className="flex items-center gap-2 mb-2">
                            <AlertCircle className="w-5 h-5" />
                            <span className="font-semibold">Preencha os campos obrigatórios:</span>
                        </div>
                        <ul className="list-disc list-inside space-y-1 text-sm">
                            {errors.map((error, i) => (
                                <li key={i}>{error}</li>
                            ))}
                        </ul>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Media Upload */}
                    <div className={`glass rounded-2xl p-6 ${!mediaFile && errors.length > 0 ? 'border-red-500/50' : ''}`}>
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <Image className="w-5 h-5 text-[var(--primary)]" />
                            Mídia do Status
                            <span className="text-red-400 text-sm">*</span>
                        </h3>

                        {mediaPreview && mediaFile ? (
                            <div className="relative inline-block">
                                {mediaFile.type.startsWith('video/') ? (
                                    <video
                                        src={mediaPreview}
                                        className="max-h-64 rounded-xl"
                                        controls
                                    />
                                ) : (
                                    <img
                                        src={mediaPreview}
                                        alt="Preview"
                                        className="max-h-64 rounded-xl"
                                    />
                                )}
                                <button
                                    type="button"
                                    onClick={removeMedia}
                                    className="absolute -top-2 -right-2 p-1.5 bg-red-500 rounded-full text-white hover:bg-red-600 transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                                <p className="mt-2 text-sm text-[var(--text-muted)]">{mediaFile.name}</p>
                            </div>
                        ) : (
                            <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-[var(--border)] rounded-xl cursor-pointer hover:border-[var(--primary)] transition-colors group">
                                <Upload className="w-12 h-12 text-[var(--text-muted)] group-hover:text-[var(--primary)] transition-colors mb-3" />
                                <span className="text-[var(--text-muted)] group-hover:text-white transition-colors text-center px-4">
                                    Clique para selecionar uma imagem ou vídeo
                                </span>
                                <span className="text-xs text-[var(--text-muted)] mt-2">
                                    Formatos: JPG, PNG, GIF, MP4, MOV
                                </span>
                                <input
                                    type="file"
                                    accept="image/*,video/*"
                                    onChange={handleFileChange}
                                    className="hidden"
                                />
                            </label>
                        )}
                    </div>

                    {/* Caption */}
                    <div className="glass rounded-2xl p-6">
                        <h3 className="text-lg font-semibold mb-4">Legenda (opcional)</h3>
                        <textarea
                            value={caption}
                            onChange={(e) => setCaption(e.target.value)}
                            placeholder="Digite a legenda do seu status..."
                            rows={3}
                            className="w-full px-4 py-3 bg-[var(--surface-light)] border border-[var(--border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--primary)] resize-none"
                        />
                    </div>

                    {/* Schedule */}
                    <div className={`glass rounded-2xl p-6 ${!scheduledAt && errors.length > 0 ? 'border-red-500/50' : ''}`}>
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-amber-500" />
                            Agendamento
                            <span className="text-red-400 text-sm">*</span>
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm text-[var(--text-muted)] mb-2">
                                    Data e Hora
                                </label>
                                <div className="relative">
                                    <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
                                    <input
                                        type="datetime-local"
                                        value={scheduledAt}
                                        onChange={(e) => setScheduledAt(e.target.value)}
                                        min={minDateTime}
                                        className="w-full pl-12 pr-4 py-3 bg-[var(--surface-light)] border border-[var(--border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm text-[var(--text-muted)] mb-2">
                                    Repetição
                                </label>
                                <div className="relative">
                                    <Repeat className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
                                    <select
                                        value={repeatType}
                                        onChange={(e) => setRepeatType(e.target.value)}
                                        className="w-full pl-12 pr-4 py-3 bg-[var(--surface-light)] border border-[var(--border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--primary)] appearance-none"
                                    >
                                        <option value="">Não repetir</option>
                                        <option value="daily">Diariamente</option>
                                        <option value="weekly">Semanalmente</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Account Selection */}
                    <div className={`glass rounded-2xl p-6 ${selectedAccounts.length === 0 && errors.length > 0 ? 'border-red-500/50' : ''}`}>
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            Contas
                            <span className="text-red-400 text-sm">*</span>
                            {selectedAccounts.length > 0 && (
                                <span className="ml-auto text-sm text-[var(--primary)]">
                                    {selectedAccounts.length} selecionada(s)
                                </span>
                            )}
                        </h3>

                        {accounts.length === 0 ? (
                            <div className="text-center py-8">
                                <p className="text-[var(--text-muted)] mb-4">
                                    Nenhuma conta cadastrada.
                                </p>
                                <a
                                    href="/accounts"
                                    className="inline-flex items-center gap-2 px-4 py-2 gradient-primary rounded-lg text-sm font-medium"
                                >
                                    Adicionar Conta
                                </a>
                            </div>
                        ) : (
                            <>
                                <p className="text-sm text-amber-400 mb-4">
                                    ⚠️ Apenas contas conectadas (●) poderão postar o status
                                </p>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                    {accounts.map((account) => (
                                        <button
                                            key={account.id}
                                            type="button"
                                            onClick={() => toggleAccount(account.id)}
                                            className={`p-4 rounded-xl border-2 transition-all text-left relative ${selectedAccounts.includes(account.id)
                                                ? 'border-[var(--primary)] bg-[var(--primary)]/10'
                                                : 'border-[var(--border)] hover:border-[var(--primary)]/50'
                                                }`}
                                        >
                                            <span className={`absolute top-2 right-2 w-3 h-3 rounded-full ${account.status === 'connected'
                                                ? 'bg-emerald-500'
                                                : 'bg-gray-500'
                                                }`}></span>
                                            <p className="font-medium truncate pr-4">{account.name}</p>
                                            <p className="text-sm text-[var(--text-muted)] truncate">
                                                {account.status === 'connected' ? (account.phoneNumber || 'Conectado') : 'Desconectado'}
                                            </p>
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 gradient-primary rounded-xl font-semibold text-lg hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-[var(--primary)]/20"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Agendando...
                            </>
                        ) : (
                            <>
                                <Send className="w-5 h-5" />
                                Agendar Status
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
