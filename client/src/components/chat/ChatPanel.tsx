import React, { useState, useEffect, useRef } from 'react';
import { Send, X, MessageSquare } from 'lucide-react';
import { ChatMessage } from '@samvada/shared';

interface ChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  messages: ChatMessage[];
  mySessionId: string;
  isPartnerTyping: boolean;
  partnerName?: string;
  partnerEmoji?: string;
  onSendMessage: (text: string) => void;
  onSendTyping: (isTyping: boolean) => void;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
  isOpen,
  onClose,
  messages,
  mySessionId,
  isPartnerTyping,
  partnerName,
  partnerEmoji,
  onSendMessage,
  onSendTyping,
}) => {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isPartnerTyping]);

  if (!isOpen) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
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
  };

  const formatTime = (ts: number) => {
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="absolute inset-y-0 right-0 w-full sm:w-96 z-40 flex flex-col bg-slate-900/90 light:bg-white/95 backdrop-blur-xl border-l border-slate-700/60 light:border-slate-200 shadow-2xl transition-transform animate-slideInRight">
      {/* Panel Header */}
      <div className="p-4 border-b border-slate-700/60 light:border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-sky-400" />
          <h3 className="text-sm font-bold text-white light:text-slate-900">In-Call Chat</h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-center text-xs text-slate-400">
            No messages yet. Send a quick hello!
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderSessionId === mySessionId;
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-center gap-1.5 mb-1 px-1">
                  <span className="text-xs">{msg.senderEmoji || (isMe ? '👤' : (partnerEmoji || '👥'))}</span>
                  <span className="text-[10px] font-semibold text-slate-400 light:text-slate-500">
                    {isMe ? 'You' : (msg.senderName || partnerName || 'Stranger')}
                  </span>
                </div>
                <div
                  className={`px-3.5 py-2 rounded-2xl text-xs leading-relaxed max-w-[85%] ${
                    isMe
                      ? 'bg-sky-600 text-white rounded-br-none'
                      : 'bg-slate-800 light:bg-slate-100 text-slate-100 light:text-slate-900 rounded-bl-none'
                  }`}
                >
                  {msg.text}
                </div>
                <span className="text-[9px] text-slate-500 mt-0.5 px-1">
                  {formatTime(msg.timestamp)}
                </span>
              </div>
            );
          })
        )}
        {isPartnerTyping && (
          <div className="text-[11px] text-sky-400 italic px-2 flex items-center gap-1.5">
            <span>{partnerEmoji || '💬'}</span>
            <span>{partnerName || 'Stranger'} is typing...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-3 border-t border-slate-700/60 light:border-slate-200 flex items-center gap-2">
        <input
          type="text"
          value={inputText}
          onChange={handleInputChange}
          placeholder="Send a message..."
          maxLength={1000}
          className="flex-1 px-3 py-2 rounded-xl bg-slate-800 light:bg-slate-100 text-white light:text-slate-900 placeholder-slate-400 text-xs focus:outline-none focus:ring-1 focus:ring-sky-500"
        />
        <button
          type="submit"
          disabled={!inputText.trim()}
          className="p-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white disabled:opacity-40"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
