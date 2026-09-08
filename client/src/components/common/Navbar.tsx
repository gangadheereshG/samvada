import React from 'react';
import { Sun, Moon, Users, ShieldCheck, Sparkles } from 'lucide-react';
import { UserProfile } from '../../services/profileService.js';

interface NavbarProps {
  isDark: boolean;
  onToggleTheme: () => void;
  onlineCount?: number;
  profile?: UserProfile;
  onOpenProfile?: () => void;
  onNavigateHome?: () => void;
  onOpenSafety?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  isDark,
  onToggleTheme,
  onlineCount = 1,
  profile,
  onOpenProfile,
  onNavigateHome,
  onOpenSafety,
}) => {
  return (
    <header className="w-full sticky top-0 z-40 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="glass-panel rounded-2xl px-5 py-3 flex items-center justify-between shadow-lg">
          {/* Logo & Brand */}
          <div
            onClick={onNavigateHome}
            className="flex items-center gap-3 cursor-pointer group select-none"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-md shadow-sky-500/20 group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-wider bg-gradient-to-r from-sky-400 via-sky-200 to-indigo-300 bg-clip-text text-transparent light:from-sky-700 light:to-indigo-800">
                SAMVADA
              </h1>
              <p className="text-[10px] text-slate-400 light:text-slate-500 font-medium tracking-wide uppercase">
                Real Human Chat
              </p>
            </div>
          </div>

          {/* Right Actions: Online Count, Safety Badge, Theme Switch */}
          <div className="flex items-center gap-3">
            {/* Live Presence Badge */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/60 light:bg-sky-50 border border-slate-700/50 light:border-sky-200/60 text-xs font-medium text-slate-300 light:text-slate-700">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <Users className="w-3.5 h-3.5 text-slate-400" />
              <span>{onlineCount} Real People Online</span>
            </div>

            {/* Safety Button */}
            {onOpenSafety && (
              <button
                onClick={onOpenSafety}
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-300 light:text-slate-600 hover:text-sky-400 light:hover:text-sky-600 hover:bg-white/5 light:hover:bg-sky-100/50 transition-colors"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Safety First</span>
              </button>
            )}

            {/* User Profile Customization Button */}
            {onOpenProfile && (
              <button
                onClick={onOpenProfile}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 light:bg-white hover:bg-slate-700/80 light:hover:bg-slate-100 border border-slate-700/60 light:border-slate-300 text-xs font-semibold text-slate-200 light:text-slate-800 transition-all shadow-sm group"
                title="Customize your name and emoji"
              >
                <span className="text-base">{profile?.avatarEmoji || '👤'}</span>
                <span className="max-w-[80px] sm:max-w-[110px] truncate">
                  {profile?.displayName || 'Set Name'}
                </span>
              </button>
            )}

            {/* Theme Toggle Button */}
            <button
              onClick={onToggleTheme}
              className="p-2.5 rounded-xl bg-slate-800/70 light:bg-white border border-slate-700/50 light:border-slate-200 text-slate-300 light:text-slate-700 hover:text-sky-400 light:hover:text-sky-600 hover:border-sky-500/40 transition-all shadow-sm"
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              aria-label="Toggle Theme"
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
