import { useState } from 'react';
import { X, AlertTriangle, CheckCircle2 } from 'lucide-react';
import Button from '../common/Button';

const CANCEL_REASONS = [
  'Price too high',
  'Found a better deal elsewhere',
  'Changed my mind',
  'Crop quality concerns',
  'Delivery/Pickup too far',
  'Quantity not sufficient',
  'Ordered by mistake',
  'Farmer not responding',
  'Buyer not responding',
  'Delay in processing',
  'Crop no longer available',
  'Payment issues (COD)',
  'Other reason',
];

export default function CancelWithReason({ isOpen, onClose, onConfirm, loading, title = 'Cancel Order', subtitle = 'Please select a reason for cancellation' }) {
  const [selectedReason, setSelectedReason] = useState('');
  const [customReason, setCustomReason] = useState('');

  if (!isOpen) return null;

  const reason = selectedReason === 'Other reason' ? customReason.trim() : selectedReason;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!reason || reason.length < 5) return;
    onConfirm(reason);
  };

  const handleClose = () => {
    setSelectedReason('');
    setCustomReason('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#132E20]/60 backdrop-blur-md animate-fade-in">
      <div className="relative bg-white/95 backdrop-blur-xl border border-stone-200 rounded-[32px] shadow-2xl w-full max-w-md animate-scale-in overflow-hidden max-h-[90vh] flex flex-col">
        {}
        <div className="flex items-center justify-between p-6 border-b border-stone-100 bg-[#FBF8F3]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
              <AlertTriangle size={20} />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#D97736]">CONFIRMATION</span>
              <h3 className="font-serif-display text-2xl font-normal text-[#132E20]">{title}</h3>
              <p className="text-xs text-stone-500">{subtitle}</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-700 transition cursor-pointer"
            disabled={loading}
          >
            <X size={18} />
          </button>
        </div>

        {}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-6 space-y-3 overflow-y-auto max-h-[50vh] scrollbar-none">
            <div className="space-y-2">
              {CANCEL_REASONS.map((r) => (
                <label
                  key={r}
                  className={`flex items-center gap-3 p-3 rounded-2xl border transition-all cursor-pointer text-xs ${
                    selectedReason === r
                      ? 'border-[#D97736] bg-[#D97736]/10 text-[#132E20] font-bold shadow-sm'
                      : 'border-stone-200 bg-stone-50/50 hover:bg-stone-100 text-stone-700 font-medium'
                  }`}
                >
                  <input
                    type="radio"
                    name="cancelReason"
                    value={r}
                    checked={selectedReason === r}
                    onChange={(e) => {
                      setSelectedReason(e.target.value);
                      if (e.target.value !== 'Other reason') setCustomReason('');
                    }}
                    className="w-4 h-4 text-[#D97736] accent-[#D97736] focus:ring-[#D97736] cursor-pointer"
                  />
                  <span>{r}</span>
                </label>
              ))}
            </div>

            {selectedReason === 'Other reason' && (
              <textarea
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Please describe your reason for cancellation (min 5 characters)..."
                className="w-full p-3 bg-stone-50 border border-stone-200 rounded-2xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all resize-none mt-2"
                rows={3}
                minLength={5}
                required
                autoFocus
              />
            )}
          </div>

          {}
          <div className="p-6 border-t border-stone-100 bg-[#FBF8F3] flex gap-3 mt-auto">
            <button
              type="button"
              className="flex-1 py-3 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs uppercase tracking-wider rounded-xl transition cursor-pointer"
              onClick={handleClose}
              disabled={loading}
            >
              Back
            </button>
            <button
              type="submit"
              className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg flex items-center justify-center gap-1.5 transition cursor-pointer"
              disabled={!reason || reason.length < 5 || loading}
            >
              {loading ? 'Processing...' : 'Confirm Cancel'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}