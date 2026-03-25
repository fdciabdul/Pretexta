import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from './ui/button';
import NotificationBell from './NotificationBell';
import {
  Terminal, LayoutDashboard, FileCode, ListChecks, Activity, Settings, LogOut, BookOpen,
  Trophy, BarChart3, Flag, Pencil, Zap, Sun, Moon, User
} from 'lucide-react';

export default function Layout({ children, onLogout }) {
  const { t } = useTranslation();
  const location = useLocation();
  const [theme, setTheme] = useState(localStorage.getItem('soceng_theme') || 'dark');

  const navigation = [
    { name: t('nav.dashboard'), path: '/', icon: LayoutDashboard },
    { name: t('nav.scenarios'), path: '/scenarios', icon: FileCode },
    { name: t('nav.quizzes'), path: '/quizzes', icon: ListChecks },
    { name: t('nav.ai_challenge'), path: '/ai-challenge', icon: Zap },
    { name: 'Campaigns', path: '/campaigns', icon: Flag },
    { name: t('nav.history'), path: '/simulations', icon: Activity },
    { name: 'Leaderboard', path: '/leaderboard', icon: Trophy },
    { name: 'Analytics', path: '/analytics', icon: BarChart3 },
    { name: 'Scenario Builder', path: '/scenario-builder', icon: Pencil },
    { name: t('nav.glossary', 'Glossary'), path: '/glossary', icon: BookOpen },
    { name: t('nav.settings'), path: '/settings', icon: Settings },
  ];

  const handleLogout = () => {
    localStorage.removeItem('soceng_token');
    localStorage.removeItem('soceng_user');
    onLogout();
  };

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('soceng_theme', newTheme);
    document.documentElement.classList.toggle('light', newTheme === 'light');
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-mono relative overflow-hidden">
      {/* Global Scanlines Overlay */}
      <div className="fixed inset-0 pointer-events-none z-50 scanlines opacity-20" />

      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 w-72 bg-black/60 backdrop-blur-md border-r border-primary/20 flex flex-col z-40 shadow-[0_0_30px_rgba(0,0,0,0.5)]">

        {/* Logo Section */}
        <div className="p-8 border-b border-primary/20 relative overflow-hidden group">
          <div className="absolute inset-0 bg-primary/5 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-in-out" />
          <Link to="/" className="relative z-10 block">
            <div className="flex items-center space-x-3 mb-2">
              <Terminal className="w-8 h-8 text-primary animate-pulse-slow" />
              <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary via-white to-primary bg-300% animate-grid-flow glitch" data-text="PRETEXTA">
                PRETEXTA
              </h1>
            </div>
            <p className="text-[10px] text-primary/60 tracking-widest uppercase pl-11">
              Social Engineering Lab
            </p>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-3 px-4 py-2.5 rounded-none border-l-2 transition-all duration-300 group relative overflow-hidden ${isActive
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-transparent text-muted-foreground hover:text-primary hover:bg-primary/5 hover:border-primary/50'
                  }`}
              >
                <div className={`absolute inset-0 bg-primary/5 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-300 ${isActive ? 'translate-x-0' : ''}`} />
                <Icon className={`w-4 h-4 relative z-10 transition-transform duration-300 ${isActive ? 'scale-110 drop-shadow-[0_0_5px_rgba(0,255,0,0.5)]' : 'group-hover:scale-110'}`} />
                <span className="relative z-10 tracking-wide text-xs font-semibold">
                  {isActive && <span className="mr-1 text-xs blink">&gt;</span>}
                  {item.name}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-primary/20 bg-black/20 space-y-2">
          {/* Theme + Notifications + Profile */}
          <div className="flex items-center justify-between px-2 mb-2">
            <div className="flex items-center gap-2">
              <button
                onClick={toggleTheme}
                className="p-2 text-muted-foreground hover:text-primary transition-colors"
                title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              >
                {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
              <NotificationBell />
            </div>
            <Link to="/profile" className="p-2 text-muted-foreground hover:text-primary transition-colors">
              <User className="w-4 h-4" />
            </Link>
          </div>

          <Button
            variant="ghost"
            className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10 border border-transparent hover:border-destructive/30 rounded-none transition-all uppercase tracking-widest text-xs font-bold"
            onClick={handleLogout}
            data-testid="logout-btn"
          >
            <LogOut className="w-4 h-4 mr-2" />
            {t('auth.logout')}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="ml-72 min-h-screen relative z-10">
        <div className="p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
