import React, { useRef, useEffect, useState } from 'react';
import { VideoOff, AlertCircle, RefreshCw } from 'lucide-react';
import { VideoControls } from './VideoControls.js';
import { AudioIndicator } from './AudioIndicator.js';
import { ChatPanel } from '../chat/ChatPanel.js';
import { useAudioActivity } from '../../hooks/useAudioActivity.js';
import { ChatMessage } from '@samvada/shared';

interface VideoChatProps {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  micEnabled: boolean;
  cameraEnabled: boolean;
  partnerMicEnabled: boolean;
  partnerCameraEnabled: boolean;
  permissionError: string | null;
  sharedInterests: string[];
  partnerName?: string;
  partnerEmoji?: string;
  myName?: string;
  myEmoji?: string;
  messages: ChatMessage[];
  mySessionId: string;
  isPartnerTyping: boolean;
  onToggleMic: () => void;
  onToggleCamera: () => void;
  onSkip: () => void;
  onEndCall: () => void;
  onOpenReport: () => void;
  onOpenBlock: () => void;
  onSendMessage: (text: string) => void;
  onSendTyping: (isTyping: boolean) => void;
  onRetryMedia: () => void;
}

export const VideoChat: React.FC<VideoChatProps> = ({
  localStream,
  remoteStream,
  micEnabled,
  cameraEnabled,
  partnerMicEnabled,
  partnerCameraEnabled,
  permissionError,
  sharedInterests,
  partnerName,
  partnerEmoji,
  myName,
  myEmoji,
  messages,
  mySessionId,
  isPartnerTyping,
  onToggleMic,
  onToggleCamera,
  onSkip,
  onEndCall,
  onOpenReport,
  onOpenBlock,
  onSendMessage,
  onSendTyping,
  onRetryMedia,
}) => {
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Hook analyzing real incoming audio activity from remote peer
  const { audioLevel, isSpeaking } = useAudioActivity(remoteStream, !partnerMicEnabled);

  // Bind local stream
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
      localVideoRef.current.play().catch(() => {});
    }
  }, [localStream]);

  // Bind remote stream
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
      remoteVideoRef.current.play().catch(() => {});
    }
  }, [remoteStream]);

  // Track unread messages while chat drawer is closed
  useEffect(() => {
    if (!isChatOpen && messages.length > 0) {
      const last = messages[messages.length - 1];
      if (last.senderSessionId !== mySessionId) {
        setUnreadCount(prev => prev + 1);
      }
    }
  }, [messages, isChatOpen, mySessionId]);

  const handleToggleChat = () => {
    setIsChatOpen(prev => {
      if (!prev) setUnreadCount(0);
      return !prev;
    });
  };

  return (
    <div className="relative w-full h-[calc(100vh-75px)] max-w-7xl mx-auto px-2 sm:px-4 py-2 flex flex-col justify-between overflow-hidden">
      
      {/* Top Overlay: Partner Profile, Audio Activity & Shared Interests */}
      <div className="absolute top-4 left-6 right-6 z-30 flex items-center justify-between pointer-events-none">
        <div className="pointer-events-auto flex items-center gap-2 flex-wrap">
          {/* Partner Identity Badge */}
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/80 border border-slate-700/70 backdrop-blur-md text-xs font-bold text-white shadow-md">
            <span className="text-base">{partnerEmoji || '👤'}</span>
            <span>{partnerName || 'Stranger'}</span>
          </div>

          <AudioIndicator
            audioLevel={audioLevel}
            isSpeaking={isSpeaking}
            isMuted={!partnerMicEnabled}
          />

          {sharedInterests.length > 0 && (
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/70 border border-slate-700/60 backdrop-blur-md text-xs text-sky-300 font-semibold">
              <span>Shared: {sharedInterests.join(', ')}</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Remote Video Screen (Full Area) */}
      <div className="relative flex-1 w-full rounded-3xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl flex items-center justify-center">
        {permissionError ? (
          <div className="text-center p-6 max-w-md z-20">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/15 text-amber-400 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Camera / Microphone Access Required</h3>
            <p className="text-xs text-slate-300 mb-6 leading-relaxed">
              {permissionError}
            </p>
            <button
              onClick={onRetryMedia}
              className="btn-glow px-6 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold flex items-center gap-2 mx-auto shadow-lg"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Try Again</span>
            </button>
          </div>
        ) : partnerCameraEnabled && remoteStream ? (
          <video
            ref={(el) => {
              remoteVideoRef.current = el;
              if (el && remoteStream && el.srcObject !== remoteStream) {
                el.srcObject = remoteStream;
                el.play().catch(() => {});
              }
            }}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          /* Avatar when peer turns camera off or stream connecting */
          <div className="flex flex-col items-center justify-center text-center p-6 z-10">
            <div
              className={`relative w-28 h-28 sm:w-36 sm:h-36 rounded-full bg-gradient-to-tr from-sky-600 to-indigo-700 flex items-center justify-center text-white shadow-2xl transition-all duration-300 ${
                isSpeaking ? 'ring-8 ring-emerald-400/40 scale-105' : 'ring-4 ring-slate-700'
              }`}
            >
              <span className="text-5xl sm:text-6xl select-none">
                {partnerEmoji || '👤'}
              </span>
              {!partnerCameraEnabled && (
                <span className="absolute bottom-1 right-1 p-1.5 rounded-full bg-red-500 text-white shadow">
                  <VideoOff className="w-4 h-4" />
                </span>
              )}
            </div>
            <h4 className="mt-4 text-lg font-bold text-white flex items-center gap-1.5">
              <span>{partnerEmoji || '👤'}</span>
              <span>{partnerName || 'Stranger'}</span>
            </h4>
            <p className="text-xs text-slate-400 mt-1">
              {!partnerCameraEnabled ? 'Camera is turned off (audio active)' : 'Connecting genuine video stream...'}
            </p>
          </div>
        )}

        {/* Floating Local Video Preview (Picture-in-Picture) */}
        <div className="absolute bottom-20 right-4 sm:bottom-6 sm:right-6 w-28 sm:w-48 aspect-video rounded-2xl overflow-hidden bg-slate-900 border-2 border-sky-400/40 shadow-2xl z-30 transition-all hover:scale-105">
          {cameraEnabled && localStream ? (
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover transform -scale-x-100"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-slate-800 text-slate-400 p-2 text-center">
              <span className="text-2xl mb-1">{myEmoji || '👤'}</span>
              <span className="text-[10px] font-medium">Camera Off</span>
            </div>
          )}
          <div className="absolute bottom-1 left-2 text-[9px] font-semibold text-white/90 bg-black/60 px-2 py-0.5 rounded-md flex items-center gap-1">
            <span>{myEmoji || '👤'}</span>
            <span>You{myName ? ` (${myName})` : ''}</span>
          </div>
        </div>

        {/* Slide-out In-Call Chat Drawer */}
        <ChatPanel
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          messages={messages}
          mySessionId={mySessionId}
          isPartnerTyping={isPartnerTyping}
          partnerName={partnerName}
          partnerEmoji={partnerEmoji}
          onSendMessage={onSendMessage}
          onSendTyping={onSendTyping}
        />
      </div>

      {/* Bottom Floating Video Controls */}
      <div className="w-full py-3 flex justify-center z-30">
        <VideoControls
          micEnabled={micEnabled}
          cameraEnabled={cameraEnabled}
          isChatOpen={isChatOpen}
          unreadCount={unreadCount}
          onToggleMic={onToggleMic}
          onToggleCamera={onToggleCamera}
          onToggleChat={handleToggleChat}
          onSkip={onSkip}
          onEndCall={onEndCall}
          onOpenReport={onOpenReport}
          onOpenBlock={onOpenBlock}
        />
      </div>
    </div>
  );
};
