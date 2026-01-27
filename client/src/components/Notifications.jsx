import { useEffect, useState } from 'react';
import socket from '../lib/socket';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';

const ICONS = {
    success: CheckCircle,
    error: AlertCircle,
    warning: AlertTriangle,
    info: Info
};

const COLORS = {
    success: 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400',
    error: 'bg-red-500/20 border-red-500/50 text-red-400',
    warning: 'bg-amber-500/20 border-amber-500/50 text-amber-400',
    info: 'bg-blue-500/20 border-blue-500/50 text-blue-400'
};

export default function Notifications() {
    const [notifications, setNotifications] = useState([]);

    useEffect(() => {
        const handleNotification = (notification) => {
            const id = Date.now();
            setNotifications(prev => [...prev, { ...notification, id }]);

            // Auto-remove após 5 segundos
            setTimeout(() => {
                setNotifications(prev => prev.filter(n => n.id !== id));
            }, 5000);
        };

        socket.on('notification', handleNotification);

        return () => {
            socket.off('notification', handleNotification);
        };
    }, []);

    const removeNotification = (id) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    if (notifications.length === 0) return null;

    return (
        <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
            {notifications.map((notification) => {
                const Icon = ICONS[notification.type] || Info;
                const colorClass = COLORS[notification.type] || COLORS.info;

                return (
                    <div
                        key={notification.id}
                        className={`
              p-4 rounded-xl border backdrop-blur-lg shadow-xl
              animate-slide-in
              ${colorClass}
            `}
                    >
                        <div className="flex items-start gap-3">
                            <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                                <p className="font-semibold text-sm">{notification.title}</p>
                                <p className="text-xs opacity-80 mt-0.5">{notification.message}</p>
                            </div>
                            <button
                                onClick={() => removeNotification(notification.id)}
                                className="p-1 hover:bg-white/10 rounded-lg transition-colors flex-shrink-0"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
