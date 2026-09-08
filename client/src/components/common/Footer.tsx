import React from 'react';
import { ShieldCheck, Lock, HelpCircle } from 'lucide-react';

interface FooterProps {
  onOpenHowItWorks?: () => void;
  onOpenSafety?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenHowItWorks, onOpenSafety }) => {
  return (
    <footer className="w-full mt-auto py-8 border-t border-slate-800/60 light:border-slate-200/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Brand statement */}
        <div className="flex flex-col items-center md:items-start text-center md:text-left">
          <div className="text-sm font-bold tracking-wider text-slate-200 light:text-slate-800">
            SAMVADA
          </div>
          <p className="text-xs text-slate-400 light:text-slate-500 mt-0.5">
            Real human-to-human conversations. No accounts, no bots, completely private.
          </p>
        </div>

        {/* Links */}
        <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400 light:text-slate-600">
          <button
            onClick={onOpenHowItWorks}
            className="hover:text-sky-400 light:hover:text-sky-600 transition-colors flex items-center gap-1.5"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            How It Works
          </button>
          <button
            onClick={onOpenSafety}
            className="hover:text-sky-400 light:hover:text-sky-600 transition-colors flex items-center gap-1.5"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            Safety Guidelines
          </button>
          <div className="flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-sky-400" />
            <span>P2P WebRTC Encrypted</span>
          </div>
        </div>

        <div className="text-xs text-slate-500 light:text-slate-400 flex items-center gap-1">
          Made for authentic conversations
        </div>
      </div>
    </footer>
  );
};
