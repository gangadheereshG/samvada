import React from 'react';
import { MessageSquare, Video, Sparkles, Heart } from 'lucide-react';
import { ChatMode } from '@samvada/shared';

interface MatchFoundModalProps {
  sharedInterests: string[];
  initialMode?: ChatMode;
  onSelectMode: (mode: ChatMode) => void;
}

export const MatchFoundModal: React.FC<MatchFoundModalProps> = ({
  sharedInterests,
  initialMode = 'video',
  onSelectMode,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fadeIn">
      <div className="glass-panel w-full max-w-md p-6 sm:p-8 rounded-3xl shadow-2xl border border-sky-400/30 text-center relative overflow-hidden animate-scaleUp">
        
        {/* Glow effect */}
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-tr from-sky-400 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/30">
          <Sparkles className="w-8 h-8 text-white animate-pulse" />
        </div>

        {/* Heading */}
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white light:text-slate-900">
          Someone is here!
        </h2>

        {/* Shared Interests */}
        <div className="my-6 p-4 rounded-2xl bg-slate-900/50 light:bg-sky-50 border border-slate-700/60 light:border-sky-200">
          <div className="text-[11px] font-semibold text-slate-400 light:text-slate-600 uppercase tracking-wider mb-2 flex items-center justify-center gap-1">
            <Heart className="w-3.5 h-3.5 text-rose-400" />
            <span>
              {sharedInterests.length > 0 ? 'You both like' : 'Spontaneous Discovery'}
            </span>
          </div>

          {sharedInterests.length > 0 ? (
            <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
              {sharedInterests.map((interest, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 rounded-xl bg-gradient-to-r from-sky-500/20 to-indigo-500/20 border border-sky-400/40 text-sky-200 light:text-sky-800 text-xs font-bold"
                >
                  {interest}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-300 light:text-slate-600">
              Matched randomly from active online participants!
            </p>
          )}
        </div>

        <p className="text-xs text-slate-300 light:text-slate-600 mb-6 font-medium">
          How would you like to start your conversation?
        </p>

        {/* Mode Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => onSelectMode('video')}
            className={`p-4 rounded-2xl flex flex-col items-center justify-center gap-2 border transition-all ${
              initialMode === 'video'
                ? 'bg-gradient-to-tr from-sky-500 to-indigo-600 border-sky-400 text-white shadow-lg shadow-sky-500/25 btn-glow'
                : 'glass-panel text-slate-200 light:text-slate-800 hover:border-sky-400'
            }`}
          >
            <Video className="w-6 h-6" />
            <span className="text-xs font-bold">Video Chat</span>
          </button>

          <button
            onClick={() => onSelectMode('text')}
            className={`p-4 rounded-2xl flex flex-col items-center justify-center gap-2 border transition-all ${
              initialMode === 'text'
                ? 'bg-gradient-to-tr from-sky-500 to-indigo-600 border-sky-400 text-white shadow-lg shadow-sky-500/25 btn-glow'
                : 'glass-panel text-slate-200 light:text-slate-800 hover:border-sky-400'
            }`}
          >
            <MessageSquare className="w-6 h-6" />
            <span className="text-xs font-bold">Text Chat</span>
          </button>
        </div>
      </div>
    </div>
  );
};
