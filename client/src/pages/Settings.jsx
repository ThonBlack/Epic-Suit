import Header from '../components/Header';
import { Database, Server, Palette, Bell, Info, Github, ExternalLink } from 'lucide-react';

export default function Settings() {
    return (
        <div className="min-h-screen">
            <Header title="Configurações" />

            <div className="p-6 max-w-4xl space-y-6">
                {/* Sobre */}
                <div className="glass rounded-2xl p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Info className="w-5 h-5 text-[var(--primary)]" />
                        Sobre o Sistema
                    </h3>
                    <div className="space-y-3 text-[var(--text-muted)]">
                        <p><strong className="text-white">WA Status Scheduler</strong> v1.0.0</p>
                        <p>Sistema para agendar e gerenciar status do WhatsApp em múltiplas contas.</p>
                        <div className="flex gap-4 mt-4">
                            <a
                                href="https://github.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 px-4 py-2 bg-[var(--surface-light)] rounded-lg hover:bg-[var(--border)] transition-colors"
                            >
                                <Github className="w-4 h-4" />
                                GitHub
                                <ExternalLink className="w-3 h-3" />
                            </a>
                        </div>
                    </div>
                </div>

                {/* Status do Sistema */}
                <div className="glass rounded-2xl p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Server className="w-5 h-5 text-emerald-500" />
                        Status do Sistema
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-[var(--surface-light)] rounded-xl">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[var(--text-muted)]">Backend API</span>
                                <span className="flex items-center gap-2 text-emerald-400">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                    Online
                                </span>
                            </div>
                            <p className="text-sm text-[var(--text-muted)]">http://localhost:3001</p>
                        </div>
                        <div className="p-4 bg-[var(--surface-light)] rounded-xl">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[var(--text-muted)]">Agendador</span>
                                <span className="flex items-center gap-2 text-emerald-400">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                    Ativo
                                </span>
                            </div>
                            <p className="text-sm text-[var(--text-muted)]">Verificando a cada minuto</p>
                        </div>
                    </div>
                </div>

                {/* Banco de Dados */}
                <div className="glass rounded-2xl p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Database className="w-5 h-5 text-blue-500" />
                        Banco de Dados
                    </h3>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center p-3 bg-[var(--surface-light)] rounded-lg">
                            <span className="text-[var(--text-muted)]">Tipo</span>
                            <span>SQLite</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-[var(--surface-light)] rounded-lg">
                            <span className="text-[var(--text-muted)]">Localização</span>
                            <span className="text-sm">server/prisma/dev.db</span>
                        </div>
                    </div>
                </div>

                {/* Aparência */}
                <div className="glass rounded-2xl p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Palette className="w-5 h-5 text-purple-500" />
                        Aparência
                    </h3>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="font-medium">Tema</p>
                                <p className="text-sm text-[var(--text-muted)]">Escolha o tema da interface</p>
                            </div>
                            <select className="px-4 py-2 bg-[var(--surface-light)] border border-[var(--border)] rounded-lg">
                                <option value="dark">Escuro</option>
                                <option value="light" disabled>Claro (em breve)</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Notificações */}
                <div className="glass rounded-2xl p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Bell className="w-5 h-5 text-amber-500" />
                        Notificações
                    </h3>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="font-medium">Notificar ao enviar status</p>
                                <p className="text-sm text-[var(--text-muted)]">Receba notificação quando um status for postado</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" className="sr-only peer" defaultChecked />
                                <div className="w-11 h-6 bg-[var(--surface-light)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--primary)]"></div>
                            </label>
                        </div>
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="font-medium">Notificar ao falhar</p>
                                <p className="text-sm text-[var(--text-muted)]">Receba notificação quando um agendamento falhar</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" className="sr-only peer" defaultChecked />
                                <div className="w-11 h-6 bg-[var(--surface-light)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--primary)]"></div>
                            </label>
                        </div>
                    </div>
                </div>

                {/* Créditos */}
                <div className="text-center text-sm text-[var(--text-muted)] pt-4">
                    <p>Desenvolvido com ❤️ usando React, Express e whatsapp-web.js</p>
                </div>
            </div>
        </div>
    );
}
