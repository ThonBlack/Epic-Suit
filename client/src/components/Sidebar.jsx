import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    Smartphone,
    CalendarPlus,
    Clock,
    Settings,
    MessageCircle,
    CalendarDays
} from 'lucide-react';

const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { icon: Smartphone, label: 'Contas', path: '/accounts' },
    { icon: CalendarPlus, label: 'Novo Status', path: '/new-status' },
    { icon: Clock, label: 'Agendados', path: '/scheduled' },
    { icon: CalendarDays, label: 'Calendário', path: '/calendar' },
];

export default function Sidebar() {
    return (
        <aside className="fixed left-0 top-0 h-screen w-64 bg-[var(--surface)] border-r border-[var(--border)] flex flex-col">
            {/* Logo */}
            <div className="p-6 border-b border-[var(--border)]">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center animate-pulse-glow">
                        <MessageCircle className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="font-bold text-lg">WA Status</h1>
                        <p className="text-xs text-[var(--text-muted)]">Scheduler</p>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4">
                <ul className="space-y-2">
                    {navItems.map((item) => (
                        <li key={item.path}>
                            <NavLink
                                to={item.path}
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
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-[var(--border)]">
                <NavLink
                    to="/settings"
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-[var(--text-muted)] hover:bg-[var(--surface-light)] hover:text-white transition-all duration-200"
                >
                    <Settings className="w-5 h-5" />
                    <span className="font-medium">Configurações</span>
                </NavLink>
            </div>
        </aside>
    );
}
