import React from 'react';
import { Mic, MicOff, Video, VideoOff, MessageSquare, SkipForward, AlertTriangle, Ban, PhoneOff } from 'lucide-react';

interface VideoControlsProps {
  micEnabled: boolean;
  cameraEnabled: boolean;
  isChatOpen: boolean;
  unreadCount?: number;
  onToggleMic: () => void;
  onToggleCamera: () => void;
  onToggleChat: () => void;
  onSkip: () => void;
  onEndCall: () => void;
  onOpenReport: () => void;
  onOpenBlock: () => void;
}

export const VideoControls: React.FC<VideoControlsProps> = ({
  micEnabled,
  cameraEnabled,
  isChatOpen,
  unreadCount = 0,
  onToggleMic,
  onToggleCamera,
  onToggleChat,
  onSkip,
  onEndCall,
  onOpenReport,
  onOpenBlock,
}) => {
  return (
    <div className="flex items-center justify-center gap-2 sm:gap-4 p-3 rounded-2xl glass-panel border border-slate-700/60 shadow-2xl">
      {/* Mic Toggle */}
      <button
        type="button"
        onClick={onToggleMic}
        className={`p-3 sm:p-3.5 rounded-xl border transition-all ${
          micEnabled
            ? 'bg-slate-800/80 hover:bg-slate-700/80 text-white border-slate-700'
            : 'bg-red-500/20 hover:bg-red-500/30 text-red-400 border-red-500/40'
        }`}
        title={micEnabled ? 'Mute Microphone' : 'Unmute Microphone'}
        aria-label={micEnabled ? 'Mute Microphone' : 'Unmute Microphone'}
      >
        {micEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
      </button>

      {/* Camera Toggle */}
      <button
        type="button"
        onClick={onToggleCamera}
        className={`p-3 sm:p-3.5 rounded-xl border transition-all ${
          cameraEnabled
            ? 'bg-slate-800/80 hover:bg-slate-700/80 text-white border-slate-700'
            : 'bg-red-500/20 hover:bg-red-500/30 text-red-400 border-red-500/40'
        }`}
        title={cameraEnabled ? 'Turn Camera Off' : 'Turn Camera On'}
        aria-label={cameraEnabled ? 'Turn Camera Off' : 'Turn Camera On'}
      >
        {cameraEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
      </button>

      {/* In-Call Text Chat Toggle */}
      <button
        type="button"
        onClick={onToggleChat}
        className={`relative p-3 sm:p-3.5 rounded-xl border transition-all ${
          isChatOpen
            ? 'bg-sky-500 text-white border-sky-400 shadow-md shadow-sky-500/20'
            : 'bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border-slate-700'
        }`}
        title="Toggle In-Call Chat"
        aria-label="Toggle In-Call Chat"
      >
        <MessageSquare className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-sky-400 text-slate-950 font-bold text-[10px] flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Red Call Cut / End Button */}
      <button
        type="button"
        onClick={onEndCall}
        className="px-4 sm:px-5 py-3 sm:py-3.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-sm flex items-center gap-2 shadow-lg shadow-red-600/30 transition-all active:scale-95 border border-red-500/50"
        title="Cut / End Call and Return to Home"
        aria-label="End Call"
      >
        <PhoneOff className="w-4 h-4" />
        <span className="hidden sm:inline">End Call</span>
      </button>

      {/* Prominent Skip Button */}
      <button
        type="button"
        onClick={onSkip}
        className="btn-glow px-4 sm:px-6 py-3 sm:py-3.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-sm flex items-center gap-2 shadow-lg shadow-sky-500/25 transition-all"
        title="Skip to next real user"
      >
        <span>Skip</span>
        <SkipForward className="w-4 h-4" />
      </button>

      {/* Safety / Report Button */}
      <button
        type="button"
        onClick={onOpenReport}
        className="p-3 sm:p-3.5 rounded-xl bg-slate-800/80 hover:bg-amber-400/20 text-slate-400 hover:text-amber-400 border border-slate-700 transition-all"
        title="Report Inappropriate Behavior"
        aria-label="Report Inappropriate Behavior"
      >
        <AlertTriangle className="w-5 h-5" />
      </button>

      {/* Block Button */}
      <button
        type="button"
        onClick={onOpenBlock}
        className="p-3 sm:p-3.5 rounded-xl bg-slate-800/80 hover:bg-rose-400/20 text-slate-400 hover:text-rose-400 border border-slate-700 transition-all"
        title="Block User"
        aria-label="Block User"
      >
        <Ban className="w-5 h-5" />
      </button>
    </div>
  );
};
