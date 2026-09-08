import React, { useState } from 'react';
import { Ban, X } from 'lucide-react';

interface BlockDialogProps {
  blockedSessionId: string;
  matchId?: string;
  blockerSessionId: string;
  onClose: () => void;
  onConfirmBlock: () => void;
}

export const BlockDialog: React.FC<BlockDialogProps> = ({
  blockedSessionId,
  matchId,
  blockerSessionId,
  onClose,
  onConfirmBlock,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleBlock = async () => {
    setIsSubmitting(true);
    try {
      await fetch('/api/block', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          blockerSessionId,
          blockedSessionId,
          matchId,
        }),
      });
      onConfirmBlock();
      onClose();
    } catch (err) {
      console.error('Failed to block:', err);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm">
      <div className="glass-panel w-full max-w-sm p-6 rounded-3xl shadow-2xl border border-rose-500/30 text-center relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-2 text-slate-400 hover:text-white rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-12 h-12 rounded-2xl bg-rose-500/15 text-rose-400 flex items-center justify-center mx-auto mb-4">
          <Ban className="w-6 h-6" />
        </div>

        <h3 className="text-lg font-bold text-white light:text-slate-900 mb-2">
          Block this user?
        </h3>
        <p className="text-xs text-slate-300 light:text-slate-600 mb-6 leading-relaxed">
          You will immediately disconnect from this conversation and you will never be matched with this user again.
        </p>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-700 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleBlock}
            disabled={isSubmitting}
            className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-600/25 transition-all disabled:opacity-50"
          >
            {isSubmitting ? 'Blocking...' : 'Yes, Block'}
          </button>
        </div>
      </div>
    </div>
  );
};
