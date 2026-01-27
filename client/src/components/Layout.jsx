import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu, MessageCircle } from 'lucide-react';
import Sidebar from './Sidebar';
import Notifications from './Notifications';

export default function Layout() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className="min-h-screen bg-[var(--background)]">
            <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

            <main className="md:ml-64 min-h-screen">
                {/* Mobile Header */}
                <div className="md:hidden bg-[var(--surface)] border-b border-[var(--border)] p-4 flex items-center justify-between sticky top-0 z-30">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
                            <MessageCircle className="w-5 h-5 text-white" />
                        </div>
                        <h1 className="font-bold text-lg">WA Status</h1>
                    </div>
                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        className="p-2 hover:bg-[var(--surface-light)] rounded-lg"
                    >
                        <Menu className="w-6 h-6 text-[var(--text-muted)]" />
                    </button>
                </div>

                <Outlet />
            </main>
            <Notifications />
        </div>
    );
}
