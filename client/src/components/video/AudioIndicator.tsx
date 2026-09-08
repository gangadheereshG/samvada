import React from 'react';
import { Mic, MicOff } from 'lucide-react';

interface AudioIndicatorProps {
  audioLevel: number; // 0.0 to 1.0 from real WebAudio frequency analysis
  isSpeaking: boolean;
  isMuted: boolean;
  className?: string;
}

export const AudioIndicator: React.FC<AudioIndicatorProps> = ({
  audioLevel,
  isSpeaking,
  isMuted,
  className = '',
}) => {
  if (isMuted) {
    return (
      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/20 border border-red-500/40 text-red-400 text-xs font-semibold backdrop-blur-md ${className}`}>
        <MicOff className="w-3.5 h-3.5" />
        <span>Muted</span>
      </div>
    );
  }

  // Calculate dynamic bar heights from real audio level
  const height1 = Math.max(3, Math.min(18, audioLevel * 24));
  const height2 = Math.max(4, Math.min(22, audioLevel * 32));
  const height3 = Math.max(3, Math.min(18, audioLevel * 26));

  return (
    <div className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-900/70 border border-slate-700/60 backdrop-blur-md text-xs ${className}`}>
      <Mic className={`w-3.5 h-3.5 ${isSpeaking ? 'text-emerald-400 animate-pulse' : 'text-slate-400'}`} />
      
      {/* Real-time reactive audio frequency bars */}
      <div className="flex items-center gap-0.5 h-5">
        <span
          className="w-1 rounded-full bg-emerald-400 transition-all duration-75"
          style={{ height: `${height1}px` }}
        />
        <span
          className="w-1 rounded-full bg-emerald-400 transition-all duration-75"
          style={{ height: `${height2}px` }}
        />
        <span
          className="w-1 rounded-full bg-emerald-400 transition-all duration-75"
          style={{ height: `${height3}px` }}
        />
      </div>

      <span className="text-[10px] font-medium text-slate-300">
        {isSpeaking ? 'Speaking' : 'Connected'}
      </span>
    </div>
  );
};
