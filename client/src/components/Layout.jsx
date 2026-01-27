import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Notifications from './Notifications';

export default function Layout() {
    return (
        <div className="min-h-screen bg-[var(--background)]">
            <Sidebar />
            <main className="ml-64 min-h-screen">
                <Outlet />
            </main>
            <Notifications />
        </div>
    );
}
