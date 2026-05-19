import { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';
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

export default function CancelWithReason({ isOpen, onClose, onConfirm, loading, title = 'Cancel Order', subtitle = 'Please provide a reason for cancellation' }) {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md animate-scale-in overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
              <AlertTriangle size={20} className="text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">{title}</h3>
              <p className="text-sm text-gray-500">{subtitle}</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
            disabled={loading}
          >
            <X size={18} className="text-gray-400" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            <div className="space-y-3">
              {CANCEL_REASONS.map((r) => (
                <label
                  key={r}
                  className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                    selectedReason === r
                      ? 'border-red-500 bg-red-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
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
                    className="w-4 h-4 text-red-600 focus:ring-red-500"
                  />
                  <span className="text-sm font-medium text-gray-700">{r}</span>
                </label>
              ))}
            </div>

            {selectedReason === 'Other reason' && (
              <textarea
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Please describe your reason for cancellation (min 5 characters)..."
                className="w-full p-3 border-2 border-gray-200 rounded-xl text-sm focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-100 transition-all resize-none"
                rows={3}
                minLength={5}
                required
                autoFocus
              />
            )}

            {selectedReason && selectedReason !== 'Other reason' && (
              <div className="p-3 bg-red-50 border-l-4 border-red-400 rounded-lg">
                <p className="text-sm text-red-700">
                  <strong>Reason:</strong> {selectedReason}
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 pt-0 flex gap-3">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="flex-1 bg-red-600 hover:bg-red-700"
              disabled={!reason || reason.length < 5 || loading}
            >
              {loading ? 'Cancelling...' : 'Confirm Cancellation'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}