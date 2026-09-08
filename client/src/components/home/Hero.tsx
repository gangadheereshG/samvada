import React from 'react';
import { ArrowRight, Sparkles, Shield, UserCheck, Zap } from 'lucide-react';

interface HeroProps {
  onStartConnecting: () => void;
  onInstantMatch: () => void;
  onHowItWorks: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onStartConnecting, onInstantMatch, onHowItWorks }) => {
  return (
    <div className="relative pt-12 pb-20 md:pt-20 md:pb-28 flex flex-col items-center justify-center text-center px-4 max-w-5xl mx-auto">
      {/* Genuine Human Badge */}
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-panel border border-sky-400/30 text-sky-400 light:text-sky-700 text-xs font-semibold uppercase tracking-wider mb-8 shadow-sm">
        <Sparkles className="w-3.5 h-3.5 animate-pulse" />
        <span>100% Real Human-to-Human Platform</span>
      </div>

      {/* Main Heading */}
      <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white light:text-slate-900 max-w-4xl leading-[1.15]">
        Meet someone.{' '}
        <span className="bg-gradient-to-r from-sky-400 via-sky-200 to-indigo-300 bg-clip-text text-transparent light:from-sky-600 light:to-indigo-600">
          Start a conversation.
        </span>
      </h1>

      {/* Subtitle */}
      <p className="mt-6 text-lg sm:text-xl text-slate-300 light:text-slate-600 max-w-2xl leading-relaxed font-normal">
        Connect with real people who share your interests. No account required.
      </p>

      {/* Action Buttons */}
      <div className="mt-10 flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
        <button
          onClick={onStartConnecting}
          className="btn-glow w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-semibold text-lg flex items-center justify-center gap-3 shadow-xl shadow-sky-500/25 transition-all group"
        >
          <span>Connect with Interests</span>
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </button>

        <button
          onClick={onInstantMatch}
          className="btn-glow w-full sm:w-auto px-8 py-4 rounded-2xl bg-slate-800/90 hover:bg-slate-700/90 light:bg-white light:hover:bg-sky-50 text-white light:text-slate-900 font-semibold text-lg flex items-center justify-center gap-2 border border-sky-400/40 shadow-lg transition-all"
        >
          <Sparkles className="w-5 h-5 text-sky-400" />
          <span>Instant Random Match</span>
        </button>

        <button
          onClick={onHowItWorks}
          className="w-full sm:w-auto px-6 py-4 rounded-2xl glass-panel hover:bg-slate-800/80 light:hover:bg-white text-slate-300 light:text-slate-700 font-medium text-base border border-slate-700/60 light:border-slate-300/80 transition-all"
        >
          How It Works
        </button>
      </div>

      {/* Trust & Transparency Statement */}
      <p className="mt-8 text-xs sm:text-sm text-slate-400 light:text-slate-500 font-medium tracking-wide">
        No login. No profiles. Just real people and real conversations.
      </p>

      {/* Quick Trust Cards */}
      <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-3xl">
        <div className="glass-panel p-4 rounded-xl flex items-center gap-3 text-left">
          <div className="p-2.5 rounded-lg bg-sky-500/10 text-sky-400 light:text-sky-600">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-200 light:text-slate-800">Zero Bots Guarantee</div>
            <div className="text-[11px] text-slate-400 light:text-slate-500">Only genuine live online users</div>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-xl flex items-center gap-3 text-left">
          <div className="p-2.5 rounded-lg bg-indigo-500/10 text-indigo-400 light:text-indigo-600">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-200 light:text-slate-800">Smart Affinity</div>
            <div className="text-[11px] text-slate-400 light:text-slate-500">Related topic & random discovery</div>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-xl flex items-center gap-3 text-left">
          <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 light:text-emerald-600">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-200 light:text-slate-800">Anonymous & P2P</div>
            <div className="text-[11px] text-slate-400 light:text-slate-500">Encrypted WebRTC streaming</div>
          </div>
        </div>
      </div>
    </div>
  );
};
