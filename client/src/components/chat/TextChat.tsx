import React, { useState, useEffect, useRef } from 'react';
import { Send, SkipForward, AlertTriangle, Ban, Video, Clock, PhoneOff, Shield } from 'lucide-react';
import { ChatMessage } from '@samvada/shared';
import { SafetyNotice } from '../common/SafetyNotice.js';

interface TextChatProps {
  messages: ChatMessage[];
  mySessionId: string;
  isPartnerTyping: boolean;
  sharedInterests: string[];
  partnerName?: string;
  partnerEmoji?: string;
  onSendMessage: (text: string) => void;
  onSendTyping: (isTyping: boolean) => void;
  onSkip: () => void;
  onEndCall?: () => void;
  onOpenReport: () => void;
  onOpenBlock: () => void;
  onSwitchToVideo?: () => void;
}

export const TextChat: React.FC<TextChatProps> = ({
  messages,
  mySessionId,
  isPartnerTyping,
  sharedInterests,
  partnerName,
  partnerEmoji,
  onSendMessage,
  onSendTyping,
  onSkip,
  onEndCall,
  onOpenReport,
  onOpenBlock,
  onSwitchToVideo,
}) => {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isPartnerTyping]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);

    // Typing notification with debounce
    onSendTyping(true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      onSendTyping(false);
    }, 1200);
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    const text = inputText.trim();
    if (!text) return;

    onSendMessage(text);
    setInputText('');
    onSendTyping(false);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
  };

  const formatTime = (timestamp: number) => {
    const d = new Date(timestamp);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-2 sm:px-4 py-4 h-[calc(100vh-80px)] flex flex-col">
      <div className="glass-panel flex-1 rounded-3xl overflow-hidden shadow-2xl border border-sky-400/20 flex flex-col">
        {/* Chat Header Bar */}
        <div className="px-4 sm:px-6 py-3.5 border-b border-slate-700/60 light:border-slate-200/80 bg-slate-900/50 light:bg-white/80 flex items-center justify-between gap-2">
          {/* Status & Shared Interests */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500/20 to-indigo-500/20 border border-sky-400/30 flex items-center justify-center text-lg shrink-0">
              {partnerEmoji || '👤'}
            </div>
            <div className="truncate">
              <div className="text-xs sm:text-sm font-bold text-white light:text-slate-900 flex items-center gap-2">
                <span>{partnerName || 'Stranger'}</span>
                {sharedInterests.length > 0 && (
                  <span className="hidden sm:inline-block px-2 py-0.5 rounded-full bg-sky-500/15 border border-sky-400/30 text-sky-300 light:text-sky-700 text-[10px] font-semibold truncate">
                    Shared: {sharedInterests.join(', ')}
                  </span>
                )}
              </div>
              <div className="text-[10px] text-slate-400 light:text-slate-500 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <span>Live in conversation</span>
              </div>
            </div>
          </div>

          {/* Action Controls */}
          <div className="flex items-center gap-2">
            {onSwitchToVideo && (
              <button
                onClick={onSwitchToVideo}
                className="px-3 py-1.5 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 light:text-sky-700 border border-sky-400/30 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                title="Switch to Video Chat"
              >
                <Video className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Video Call</span>
              </button>
            )}

            <button
              onClick={onOpenReport}
              className="p-2 rounded-xl text-slate-400 hover:text-amber-400 hover:bg-amber-400/10 transition-colors"
              title="Report User"
            >
              <AlertTriangle className="w-4 h-4" />
            </button>

            <button
              onClick={onOpenBlock}
              className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-400/10 transition-colors"
              title="Block User"
            >
              <Ban className="w-4 h-4" />
            </button>

            {onEndCall && (
              <button
                onClick={onEndCall}
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-red-600/20 transition-all border border-red-500/50"
                title="Cut Call and Return to Home"
              >
                <PhoneOff className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">End</span>
              </button>
            )}

            <button
              onClick={onSkip}
              className="btn-glow px-4 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-sky-500/20 transition-all"
            >
              <span>Skip</span>
              <SkipForward className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Safety Compact Notice */}
        <div className="px-4 py-2 bg-slate-900/30 border-b border-slate-800">
          <SafetyNotice compact />
        </div>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 light:text-slate-500">
              <div className="w-12 h-12 rounded-2xl bg-sky-500/10 text-sky-400 flex items-center justify-center mb-3">
                <Shield className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-slate-200 light:text-slate-800">
                You're connected with a real human!
              </p>
              <p className="text-xs mt-1 max-w-sm">
                Say hello, break the ice, or discuss your shared interests.
              </p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.senderSessionId === mySessionId;
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} animate-fadeIn`}
                >
                  <div className="flex items-end gap-1.5 max-w-[80%]">
                    {!isMe && (
                      <span className="text-[10px] font-bold text-slate-400 mb-1 flex items-center gap-1">
                        <span>{msg.senderEmoji || partnerEmoji || '👤'}</span>
                        <span>{msg.senderName || partnerName || 'Stranger'}:</span>
                      </span>
                    )}
                    <div
                      className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-sm ${
                        isMe
                          ? 'bg-gradient-to-tr from-sky-600 to-indigo-600 text-white rounded-br-none'
                          : 'bg-slate-800 light:bg-white text-slate-100 light:text-slate-900 border border-slate-700/60 light:border-slate-200 rounded-bl-none'
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-500 light:text-slate-400 mt-1 px-1 flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5" />
                    {formatTime(msg.timestamp)}
                  </span>
                </div>
              );
            })
          )}

          {/* Typing Indicator */}
          {isPartnerTyping && (
            <div className="flex items-center gap-2 text-xs text-sky-400 italic px-2 py-1 animate-pulse">
              <span className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-sky-400 rounded-full animate-bounce"></span>
                <span className="w-1.5 h-1.5 bg-sky-400 rounded-full animate-bounce delay-100"></span>
                <span className="w-1.5 h-1.5 bg-sky-400 rounded-full animate-bounce delay-200"></span>
              </span>
              <span>{partnerEmoji || '👤'} {partnerName || 'Stranger'} is typing...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSend} className="p-3 sm:p-4 bg-slate-900/60 light:bg-white/90 border-t border-slate-700/60 light:border-slate-200 flex items-center gap-2">
          <input
            type="text"
            value={inputText}
            onChange={handleInputChange}
            placeholder="Type a message and press Enter..."
            maxLength={1000}
            className="flex-1 px-4 py-3 rounded-2xl bg-slate-800/80 light:bg-slate-100 border border-slate-700 light:border-slate-300 text-white light:text-slate-900 placeholder-slate-400 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-inner"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="btn-glow p-3 rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white disabled:opacity-40 disabled:pointer-events-none transition-all shadow-md shadow-sky-500/25"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
