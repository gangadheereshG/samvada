import React from 'react';
import { Users, X, Shield } from 'lucide-react';

interface WaitingScreenProps {
  interests: string[];
  waitingCount?: number;
  onLeaveQueue: () => void;
}

export const WaitingScreen: React.FC<WaitingScreenProps> = ({
  interests,
  waitingCount = 1,
  onLeaveQueue,
}) => {
  return (
    <div className="w-full max-w-xl mx-auto px-4 py-12 flex flex-col items-center justify-center text-center">
      <div className="glass-panel w-full p-8 sm:p-10 rounded-3xl shadow-2xl border border-sky-400/30 flex flex-col items-center relative overflow-hidden">
        
        {/* Subtle decorative glow */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-sky-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Pulse Radar Animation */}
        <div className="relative my-8 flex items-center justify-center">
          <div className="w-32 h-32 rounded-full border border-sky-400/30 animate-ping absolute" />
          <div className="w-24 h-24 rounded-full border border-indigo-400/40 animate-pulse absolute" />
          <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/30 z-10">
            <Users className="w-8 h-8 text-white" />
          </div>
        </div>

        {/* Real Status Heading */}
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white light:text-slate-900 tracking-tight">
          Waiting for someone to connect...
        </h2>

        {/* Explanatory subtitle */}
        <p className="mt-3 text-sm text-slate-300 light:text-slate-600 max-w-md leading-relaxed">
          Samvada matches strictly with real people who are currently online. As soon as a compatible human connects, your conversation begins instantly.
        </p>

        {/* Current Interests in Search */}
        {interests.length > 0 && (
          <div className="mt-6 w-full">
            <div className="text-[11px] font-semibold text-slate-400 light:text-slate-500 uppercase tracking-wider mb-2">
              Searching with interests
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {interests.map((tag, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 rounded-xl bg-sky-500/15 border border-sky-400/30 text-sky-300 light:text-sky-800 text-xs font-semibold"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Real-Time Authenticity Badge */}
        <div className="mt-8 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-800/80 light:bg-sky-50 border border-slate-700/60 light:border-sky-200 text-xs text-slate-300 light:text-slate-700">
          <Shield className="w-3.5 h-3.5 text-emerald-400" />
          <span>Zero bots policy • {waitingCount} in queue</span>
        </div>

        {/* Cancel / Leave Queue */}
        <button
          onClick={onLeaveQueue}
          className="mt-8 px-6 py-3 rounded-2xl glass-panel hover:bg-slate-800/80 light:hover:bg-slate-200/60 text-slate-300 light:text-slate-700 hover:text-white light:hover:text-slate-900 text-xs font-semibold flex items-center gap-2 border border-slate-700/60 transition-all"
        >
          <X className="w-4 h-4" />
          <span>Cancel Search</span>
        </button>
      </div>
    </div>
  );
};
