import React from 'react';
import { ShieldAlert, X } from 'lucide-react';

interface SafetyNoticeProps {
  onDismiss?: () => void;
  compact?: boolean;
}

export const SafetyNotice: React.FC<SafetyNoticeProps> = ({ onDismiss, compact = false }) => {
  if (compact) {
    return (
      <div className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg bg-emerald-950/40 light:bg-emerald-50/80 border border-emerald-500/20 text-[11px] text-emerald-300 light:text-emerald-800">
        <div className="flex items-center gap-1.5">
          <ShieldAlert className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>Never share passwords or financial information. You can leave or skip at any time.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto my-3 px-4 py-3 rounded-xl bg-slate-900/70 light:bg-sky-50/80 border border-slate-700/40 light:border-sky-200 shadow-sm flex items-start gap-3">
      <ShieldAlert className="w-5 h-5 text-emerald-400 mt-0.5 shrink-0" />
      <div className="flex-1 text-xs text-slate-300 light:text-slate-700 leading-relaxed">
        <span className="font-semibold text-white light:text-slate-900">Safety Notice: </span>
        Be respectful. Never share passwords, financial information, or sensitive personal data. You can leave any conversation at any time or report inappropriate behavior.
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="text-slate-400 hover:text-slate-200 light:hover:text-slate-700 p-1"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
