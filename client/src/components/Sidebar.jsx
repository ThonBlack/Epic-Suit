import { NavLink } from 'react-router-dom';
import { useState } from 'react';
import {
    LayoutDashboard,
    Smartphone,
    CalendarPlus,
    Clock,
    Settings,
    MessageCircle,
    CalendarDays,
    Megaphone,
    ChevronDown,
    Zap
} from 'lucide-react';

// Navegação principal reorganizada
const navItems = [
    { icon: LayoutDashboard, label: 'Overview', path: '/' },
    { icon: Smartphone, label: 'Contas', path: '/accounts' },
];

// Submenu de agendamentos
const schedulerItems = [
    { icon: CalendarPlus, label: 'Novo Status', path: '/new-status' },
    { icon: Clock, label: 'Agendados', path: '/scheduled' },
    { icon: CalendarDays, label: 'Calendário', path: '/calendar' },
];

// Módulos adicionais
const moduleItems = [
    { icon: Megaphone, label: 'Campanhas', path: '/campaigns' },
    { icon: MessageCircle, label: 'Auto Respostas', path: '/autoreply' },
];

export default function Sidebar({ isOpen, onClose }) {
    const [schedulerOpen, setSchedulerOpen] = useState(true);

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden"
                    onClick={onClose}
                />
            )}

            <aside className={`
                fixed top-0 left-0 h-screen w-64 bg-[var(--surface)] border-r border-[var(--border)] flex flex-col z-50
                transition-transform duration-300 ease-in-out
                ${isOpen ? 'translate-x-0' : '-translate-x-full'}
                md:translate-x-0 md:fixed
            `}>
                {/* Logo & Close Button */}
                <div className="p-6 border-b border-[var(--border)] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center animate-pulse-glow">
                            <Zap className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="font-bold text-lg">Epic Suit</h1>
                            <p className="text-xs text-[var(--text-muted)]">WhatsApp Manager</p>
                        </div>
                    </div>
                    {/* Close Button (Mobile Only) */}
                    <button
                        onClick={onClose}
                        className="md:hidden p-2 hover:bg-[var(--surface-light)] rounded-lg"
                    >
                        <svg className="w-6 h-6 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4 overflow-y-auto">
                    {/* Main Nav */}
                    <ul className="space-y-2">
                        {navItems.map((item) => (
                            <li key={item.path}>
                                <NavLink
                                    to={item.path}
                                    onClick={() => onClose && onClose()}
                                    className={({ isActive }) =>
                                        `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${isActive
                                            ? 'bg-[var(--primary)] text-white shadow-lg shadow-[var(--primary)]/20'
                                            : 'text-[var(--text-muted)] hover:bg-[var(--surface-light)] hover:text-white'
                                        }`
                                    }
                                >
                                    <item.icon className="w-5 h-5" />
                                    <span className="font-medium">{item.label}</span>
                                </NavLink>
                            </li>
                        ))}
                    </ul>

                    {/* Scheduler Section */}
                    <div className="mt-6">
                        <button
                            onClick={() => setSchedulerOpen(!schedulerOpen)}
                            className="flex items-center justify-between w-full px-4 py-2 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider hover:text-white transition-colors"
                        >
                            <span>Agendamentos</span>
                            <ChevronDown className={`w-4 h-4 transition-transform ${schedulerOpen ? 'rotate-0' : '-rotate-90'}`} />
                        </button>
                        {schedulerOpen && (
                            <ul className="mt-2 space-y-1">
                                {schedulerItems.map((item) => (
                                    <li key={item.path}>
                                        <NavLink
                                            to={item.path}
                                            onClick={() => onClose && onClose()}
                                            className={({ isActive }) =>
                                                `flex items-center gap-3 px-4 py-2 rounded-xl transition-all duration-200 ${isActive
                                                    ? 'bg-[var(--primary)] text-white shadow-lg shadow-[var(--primary)]/20'
                                                    : 'text-[var(--text-muted)] hover:bg-[var(--surface-light)] hover:text-white'
                                                }`
                                            }
                                        >
                                            <item.icon className="w-4 h-4" />
                                            <span className="text-sm">{item.label}</span>
                                        </NavLink>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    {/* Modules Section */}
                    <div className="mt-6">
                        <p className="px-4 py-2 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                            Módulos
                        </p>
                        <ul className="mt-2 space-y-1">
                            {moduleItems.map((item) => (
                                <li key={item.path}>
                                    <NavLink
                                        to={item.path}
                                        onClick={() => onClose && onClose()}
                                        className={({ isActive }) =>
                                            `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${isActive
                                                ? 'bg-[var(--primary)] text-white shadow-lg shadow-[var(--primary)]/20'
                                                : 'text-[var(--text-muted)] hover:bg-[var(--surface-light)] hover:text-white'
                                            }`
                                        }
                                    >
                                        <item.icon className="w-5 h-5" />
                                        <span className="font-medium">{item.label}</span>
                                    </NavLink>
                                </li>
                            ))}
                        </ul>
                    </div>
                </nav>

                {/* Footer */}
                <div className="p-4 border-t border-[var(--border)]">
                    <NavLink
                        to="/settings"
                        onClick={() => onClose && onClose()}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl text-[var(--text-muted)] hover:bg-[var(--surface-light)] hover:text-white transition-all duration-200"
                    >
                        <Settings className="w-5 h-5" />
                        <span className="font-medium">Configurações</span>
                    </NavLink>
                </div>
            </aside>
        </>
    );
}

