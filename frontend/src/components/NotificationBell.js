import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Bell, Trophy, Info, AlertTriangle, Clock } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, []);

  const loadNotifications = async () => {
    try {
      const token = localStorage.getItem('soceng_token');
      if (!token) return;
      const response = await axios.get(`${API}/notifications?limit=20`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(response.data.notifications || []);
      setUnreadCount(response.data.unread_count || 0);
    } catch (error) {
      // Silent fail
    }
  };

  const markAllRead = async () => {
    try {
      const token = localStorage.getItem('soceng_token');
      await axios.put(`${API}/notifications/read-all`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (error) {
      // Silent fail
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'achievement': return <Trophy className="w-4 h-4 text-yellow-400" />;
      case 'alert': return <AlertTriangle className="w-4 h-4 text-red-400" />;
      case 'reminder': return <Clock className="w-4 h-4 text-blue-400" />;
      default: return <Info className="w-4 h-4 text-primary" />;
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-muted-foreground hover:text-primary transition-colors"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-10 z-50 w-80 glass-panel border border-primary/30 shadow-2xl max-h-96 overflow-hidden">
            <div className="p-3 border-b border-primary/20 flex items-center justify-between">
              <span className="font-mono text-xs uppercase tracking-widest text-primary">NOTIFICATIONS</span>
              {unreadCount > 0 && (
                <button onClick={markAllRead} className="text-[10px] text-muted-foreground hover:text-primary font-mono">
                  MARK ALL READ
                </button>
              )}
            </div>
            <div className="overflow-y-auto max-h-72">
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground font-mono text-xs">NO NOTIFICATIONS</div>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`p-3 border-b border-white/5 flex items-start gap-3 transition-colors ${
                      !notif.read ? 'bg-primary/5' : ''
                    }`}
                  >
                    {getIcon(notif.type)}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-mono font-bold truncate">{notif.title}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{notif.message}</p>
                      <p className="text-[9px] text-muted-foreground/50 mt-1">
                        {new Date(notif.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
