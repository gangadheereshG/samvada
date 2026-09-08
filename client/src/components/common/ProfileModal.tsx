import React, { useState } from 'react';
import { X, Check, Smile, User } from 'lucide-react';
import { UserProfile, POPULAR_EMOJIS } from '../../services/profileService.js';

interface ProfileModalProps {
  currentProfile: UserProfile;
  onSave: (updated: UserProfile) => void;
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  currentProfile,
  onSave,
  onClose,
}) => {
  const [displayName, setDisplayName] = useState(currentProfile.displayName);
  const [selectedEmoji, setSelectedEmoji] = useState(currentProfile.avatarEmoji);
  const [customEmojiInput, setCustomEmojiInput] = useState('');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      displayName: displayName.trim(),
      avatarEmoji: selectedEmoji || '👤',
    });
    onClose();
  };

  const handleSelectEmoji = (emoji: string) => {
    setSelectedEmoji(emoji);
  };

  const handleCustomEmojiAdd = () => {
    const trimmed = customEmojiInput.trim();
    if (trimmed) {
      setSelectedEmoji(trimmed);
      setCustomEmojiInput('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fadeIn">
      <div className="glass-panel w-full max-w-md p-6 rounded-3xl shadow-2xl border border-sky-400/30 text-left relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-2 text-slate-400 hover:text-white rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-2xl shadow-lg shadow-sky-500/25">
            {selectedEmoji || '👤'}
          </div>
          <div>
            <h3 className="text-lg font-bold text-white light:text-slate-900">
              Your Chat Identity
            </h3>
            <p className="text-xs text-slate-400 light:text-slate-500">
              Keep a custom name and emoji for other people to see.
            </p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-5">
          {/* Display Name Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 light:text-slate-700 mb-1.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-sky-400" />
              <span>Display Name</span>
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. Alex, Sam (or leave blank for Stranger)"
              maxLength={20}
              className="w-full px-4 py-3 rounded-2xl bg-slate-800/80 light:bg-slate-100 border border-slate-700 light:border-slate-300 text-white light:text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all shadow-inner"
            />
          </div>

          {/* Emoji Avatar Picker */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 light:text-slate-700 mb-2 flex items-center gap-1.5">
              <Smile className="w-3.5 h-3.5 text-sky-400" />
              <span>Choose Emoji Avatar</span>
            </label>
            <div className="grid grid-cols-5 gap-2 max-h-40 overflow-y-auto p-1 bg-slate-900/40 light:bg-slate-50 rounded-2xl border border-slate-800 light:border-slate-200">
              {POPULAR_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => handleSelectEmoji(emoji)}
                  className={`h-11 rounded-xl flex items-center justify-center text-xl transition-all ${
                    selectedEmoji === emoji
                      ? 'bg-sky-500/20 border-2 border-sky-400 shadow-md scale-105'
                      : 'hover:bg-slate-800/60 light:hover:bg-slate-200 border border-transparent'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Emoji Input */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={customEmojiInput}
              onChange={(e) => setCustomEmojiInput(e.target.value)}
              placeholder="Type any other emoji..."
              maxLength={4}
              className="flex-1 px-3 py-2 rounded-xl bg-slate-800/80 light:bg-slate-100 border border-slate-700 light:border-slate-300 text-white light:text-slate-900 placeholder-slate-400 text-xs focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
            <button
              type="button"
              onClick={handleCustomEmojiAdd}
              disabled={!customEmojiInput.trim()}
              className="px-3 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-xs font-medium transition-all disabled:opacity-40"
            >
              Use Emoji
            </button>
          </div>

          {/* Live Identity Preview */}
          <div className="p-3 rounded-xl bg-slate-800/40 light:bg-sky-50 border border-slate-700/50 light:border-sky-200 flex items-center justify-between">
            <span className="text-[11px] text-slate-400 light:text-slate-600 font-medium">
              Preview how others see you:
            </span>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800 light:bg-white border border-slate-700 light:border-slate-200 text-xs font-bold text-white light:text-slate-900 shadow-sm">
              <span>{selectedEmoji || '👤'}</span>
              <span>{displayName.trim() || 'Stranger'}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-medium text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-glow px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-sky-500/25"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Save Profile</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
