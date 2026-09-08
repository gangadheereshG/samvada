import React, { useState, KeyboardEvent } from 'react';
import { X, Plus, Sparkles, ArrowRight, Video, MessageSquare } from 'lucide-react';
import { ChatMode } from '@samvada/shared';

const SUGGESTED_INTERESTS = [
  'Friendship',
  'Programming',
  'Coding',
  'Technology',
  'Gaming',
  'Movies',
  'Music',
  'Travel',
  'Sports',
  'Anime',
  'Books',
  'Fitness',
  'Photography',
  'Art',
  'Study',
  'Business',
  'Startups',
  'Entrepreneurship',
];

interface InterestSelectorProps {
  interests: string[];
  onChangeInterests: (interests: string[]) => void;
  onStartMatching: (mode: ChatMode) => void;
  onCancel: () => void;
}

export const InterestSelector: React.FC<InterestSelectorProps> = ({
  interests,
  onChangeInterests,
  onStartMatching,
  onCancel,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [preferredMode, setPreferredMode] = useState<ChatMode>('video');
  const maxInterests = 5;

  const addInterest = (interest: string) => {
    const trimmed = interest.trim();
    if (!trimmed) return;

    // Check if already selected (case-insensitive)
    const exists = interests.some(i => i.toLowerCase() === trimmed.toLowerCase());
    if (exists) return;

    if (interests.length >= maxInterests) return;

    onChangeInterests([...interests, trimmed]);
    setInputValue('');
  };

  const removeInterest = (indexToRemove: number) => {
    onChangeInterests(interests.filter((_, idx) => idx !== indexToRemove));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addInterest(inputValue);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-8">
      <div className="glass-panel p-6 sm:p-8 rounded-3xl shadow-2xl border border-sky-400/20">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/10 text-sky-400 light:text-sky-600 text-xs font-semibold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            Step 1 of 2
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white light:text-slate-900">
            What are you interested in?
          </h2>
          <p className="mt-2 text-sm text-slate-300 light:text-slate-600">
            Choose up to 5 interests and we'll find people with similar interests.
          </p>
        </div>

        {/* Selected Tags Display */}
        <div className="min-h-[52px] p-3 rounded-2xl bg-slate-900/50 light:bg-slate-100/70 border border-slate-700/60 light:border-slate-300/80 mb-4 flex flex-wrap items-center gap-2">
          {interests.length === 0 ? (
            <span className="text-xs text-slate-400 light:text-slate-500 italic px-2">
              No interests selected yet (or proceed without for pure random discovery)
            </span>
          ) : (
            interests.map((tag, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-sky-500/20 to-indigo-500/20 border border-sky-400/40 text-sky-200 light:text-sky-800 text-xs font-semibold shadow-sm animate-fadeIn"
              >
                <span>{tag}</span>
                <button
                  type="button"
                  onClick={() => removeInterest(idx)}
                  className="hover:text-red-400 light:hover:text-red-600 p-0.5 rounded-full transition-colors"
                  aria-label={`Remove ${tag}`}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            ))
          )}
        </div>

        {/* Input Field */}
        <div className="relative mb-6">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={interests.length >= maxInterests}
            placeholder={
              interests.length >= maxInterests
                ? 'Maximum 5 interests reached'
                : 'Type an interest and press Enter...'
            }
            className="w-full px-4 py-3.5 rounded-2xl bg-slate-800/80 light:bg-white border border-slate-700 light:border-slate-300 text-white light:text-slate-900 placeholder-slate-400 light:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm shadow-inner transition-all disabled:opacity-50"
          />
          {inputValue.trim() && interests.length < maxInterests && (
            <button
              onClick={() => addInterest(inputValue)}
              className="absolute right-2 top-2 px-3 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-medium flex items-center gap-1 shadow-md transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              Add
            </button>
          )}
          <div className="flex justify-end mt-1.5 px-1">
            <span className="text-[11px] font-medium text-slate-400 light:text-slate-500">
              {interests.length} / {maxInterests} selected
            </span>
          </div>
        </div>

        {/* Suggested Interests */}
        <div className="mb-8">
          <label className="block text-xs font-bold text-slate-400 light:text-slate-600 uppercase tracking-wider mb-3">
            Popular Suggestions
          </label>
          <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto pr-1">
            {SUGGESTED_INTERESTS.map((sug) => {
              const isSelected = interests.some(i => i.toLowerCase() === sug.toLowerCase());
              return (
                <button
                  key={sug}
                  type="button"
                  onClick={() => addInterest(sug)}
                  disabled={isSelected || interests.length >= maxInterests}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                    isSelected
                      ? 'bg-sky-500/10 text-sky-400 light:text-sky-600 border border-sky-400/30 opacity-60 cursor-default'
                      : 'bg-slate-800/60 light:bg-slate-100 hover:bg-sky-500/20 text-slate-300 light:text-slate-700 border border-slate-700/50 light:border-slate-200 hover:border-sky-400/40'
                  }`}
                >
                  + {sug}
                </button>
              );
            })}
          </div>
        </div>

        {/* Preferred Initial Mode Picker */}
        <div className="mb-8 p-3.5 rounded-2xl bg-slate-900/40 light:bg-sky-50 border border-slate-700/40 light:border-sky-200 flex items-center justify-between">
          <span className="text-xs font-medium text-slate-300 light:text-slate-700">Preferred Mode:</span>
          <div className="flex items-center gap-1.5 bg-slate-800 light:bg-white p-1 rounded-xl border border-slate-700/50 light:border-slate-200">
            <button
              type="button"
              onClick={() => setPreferredMode('video')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                preferredMode === 'video'
                  ? 'bg-sky-500 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white light:text-slate-600'
              }`}
            >
              <Video className="w-3.5 h-3.5" />
              Video Chat
            </button>
            <button
              type="button"
              onClick={() => setPreferredMode('text')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                preferredMode === 'text'
                  ? 'bg-sky-500 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white light:text-slate-600'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              Text Only
            </button>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <button
            type="button"
            onClick={() => onStartMatching(preferredMode)}
            className="btn-glow w-full sm:flex-1 py-4 rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-base flex items-center justify-center gap-2.5 shadow-xl shadow-sky-500/25"
          >
            <span>Find Someone</span>
            <ArrowRight className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="w-full sm:w-auto px-6 py-4 rounded-2xl text-slate-400 hover:text-white light:text-slate-600 light:hover:text-slate-900 font-medium text-sm transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
