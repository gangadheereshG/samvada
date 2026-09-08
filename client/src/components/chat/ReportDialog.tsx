import React, { useState } from 'react';
import { AlertTriangle, X, Send, CheckCircle2 } from 'lucide-react';
import { ReportReason } from '@samvada/shared';

interface ReportDialogProps {
  reportedSessionId: string;
  matchId?: string;
  reporterSessionId: string;
  onClose: () => void;
  onReportSubmitted: () => void;
}

const REASONS: { value: ReportReason; label: string; desc: string }[] = [
  { value: 'harassment', label: 'Harassment or Bullying', desc: 'Threats, hateful speech, or aggressive behavior' },
  { value: 'inappropriate', label: 'Inappropriate Behavior', desc: 'Nudity, sexual misconduct, or unconsented acts' },
  { value: 'offensive', label: 'Offensive Content', desc: 'Racism, hate symbols, or discriminatory slurs' },
  { value: 'spam', label: 'Spam or Advertising', desc: 'Promotion, automated links, or phishing attempts' },
  { value: 'other', label: 'Other Safety Concern', desc: 'Any other violation of respectful conduct' },
];

export const ReportDialog: React.FC<ReportDialogProps> = ({
  reportedSessionId,
  matchId,
  reporterSessionId,
  onClose,
  onReportSubmitted,
}) => {
  const [selectedReason, setSelectedReason] = useState<ReportReason>('inappropriate');
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await fetch('/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reporterSessionId,
          reportedSessionId,
          reason: selectedReason,
          details: details.trim(),
          matchId,
        }),
      });
      setIsSuccess(true);
      setTimeout(() => {
        onReportSubmitted();
        onClose();
      }, 1500);
    } catch (err) {
      console.error('Failed to submit report:', err);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm">
      <div className="glass-panel w-full max-w-md p-6 rounded-3xl shadow-2xl border border-red-500/30 text-left relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-2 text-slate-400 hover:text-white rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {isSuccess ? (
          <div className="text-center py-8">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3 animate-bounce" />
            <h3 className="text-xl font-bold text-white light:text-slate-900">Report Submitted</h3>
            <p className="text-xs text-slate-300 light:text-slate-600 mt-2">
              Thank you for keeping Samvada safe. Our safety team will review this interaction.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-red-500/10 text-red-400">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white light:text-slate-900">Report User</h3>
                <p className="text-xs text-slate-400">Reports are confidential and anonymous.</p>
              </div>
            </div>

            <div className="space-y-2 mb-4 max-h-56 overflow-y-auto pr-1">
              {REASONS.map((r) => (
                <label
                  key={r.value}
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    selectedReason === r.value
                      ? 'bg-red-500/10 border-red-400/50 text-white'
                      : 'bg-slate-800/40 border-slate-700/60 text-slate-300 hover:border-slate-600'
                  }`}
                >
                  <input
                    type="radio"
                    name="reason"
                    value={r.value}
                    checked={selectedReason === r.value}
                    onChange={() => setSelectedReason(r.value)}
                    className="mt-1 text-red-500 focus:ring-red-400"
                  />
                  <div>
                    <div className="text-xs font-semibold">{r.label}</div>
                    <div className="text-[11px] text-slate-400">{r.desc}</div>
                  </div>
                </label>
              ))}
            </div>

            <div className="mb-5">
              <label className="block text-xs font-semibold text-slate-300 light:text-slate-700 mb-1">
                Additional Details (Optional)
              </label>
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                maxLength={400}
                placeholder="Describe what occurred..."
                className="w-full h-20 px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-400 text-xs focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-xs font-medium text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl bg-red-500 hover:bg-red-400 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-red-500/20 disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'Submitting...' : 'Submit Report'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
