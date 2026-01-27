import { Bell, Search } from 'lucide-react';

export default function Header({ title }) {
    return (
        <header className="h-16 glass border-b border-[var(--border)] flex items-center justify-between px-6">
            <h2 className="text-xl font-semibold">{title}</h2>

            <div className="flex items-center gap-4">
                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                    <input
                        type="text"
                        placeholder="Buscar..."
                        className="w-64 pl-10 pr-4 py-2 bg-[var(--surface-light)] border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent transition-all"
                    />
                </div>

                {/* Notifications */}
                <button className="relative p-2 rounded-lg hover:bg-[var(--surface-light)] transition-colors">
                    <Bell className="w-5 h-5 text-[var(--text-muted)]" />
                    <span className="absolute top-1 right-1 w-2 h-2 bg-[var(--primary)] rounded-full"></span>
                </button>

                {/* User Avatar */}
                <div className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center text-white font-medium">
                    U
                </div>
            </div>
        </header>
    );
}
