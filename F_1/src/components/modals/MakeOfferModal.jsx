import { useState, useEffect } from 'react';
import { X, Loader, Tag, Sparkles, TrendingUp, CheckCircle2 } from 'lucide-react';
import Button from '../common/Button';
import { useToast } from '../../context/ToastContext';
import { negotiationService } from '../../services/negotiationService';
import MarketPriceBand from '../crops/MarketPriceBand.jsx';

export default function MakeOfferModal({ isOpen, onClose, crop, onSuccess }) {
  const [offeredPrice, setOfferedPrice] = useState(crop?.price || '');
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [copilot, setCopilot] = useState(null);
  const [copilotLoading, setCopilotLoading] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    if (isOpen && crop) {
      setOfferedPrice(crop.price || '');
      setCopilotLoading(true);
      negotiationService
        .getCopilotGuidance({
          cropId: crop._id || crop.id,
          cropName: crop.cropName,
          offeredPrice: crop.price,
          quantity: 1,
          role: 'buyer',
        })
        .then((res) => {
          if (res?.data) setCopilot(res.data);
        })
        .catch(() => {
          // Graceful fallback if copilot is unavailable
        })
        .finally(() => setCopilotLoading(false));
    }
  }, [isOpen, crop]);

  // Re-evaluate likelihood when offered price changes
  const handlePriceChange = (val) => {
    setOfferedPrice(val);
    const num = Number(val);
    if (num > 0 && crop?.price) {
      const discount = Math.round(((crop.price - num) / crop.price) * 100 * 10) / 10;
      let estLikelihood = Math.round(100 / (1 + Math.exp(0.22 * (discount - 13.5))));
      if (discount <= 0) estLikelihood = 99;

      let status = 'high_probability';
      let advisoryMsg = `Fair offer (${discount}% discount). Good probability of acceptance.`;
      if (discount > 15) {
        status = 'aggressive';
        advisoryMsg = `Aggressive offer (${discount}% discount). Higher risk of rejection.`;
      } else if (discount > 10) {
        status = 'moderate';
        advisoryMsg = `Moderate offer (${discount}% discount). Farmer may send a counter-offer.`;
      }

      setCopilot((prev) =>
        prev
          ? {
              ...prev,
              currentEvaluation: {
                offeredPrice: num,
                discountPct: discount,
                estimatedLikelihood: estLikelihood,
                status,
                advisoryMessage: advisoryMsg,
              },
            }
          : prev
      );
    }
  };

  const applySuggestedOffer = () => {
    if (copilot?.buyerGuidance?.recommendedOffer) {
      handlePriceChange(copilot.buyerGuidance.recommendedOffer);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!offeredPrice || !quantity) return;

    try {
      setLoading(true);
      await negotiationService.makeOffer({
        cropId: crop._id || crop.id,
        offeredPrice: Number(offeredPrice),
        quantity: Number(quantity),
        message,
      });
      addToast('Direct offer submitted! The farmer will review it in their dashboard.', 'success');
      onSuccess?.();
      onClose();
    } catch (error) {
      addToast(error?.response?.data?.message || 'Failed to submit offer.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#132E20]/60 backdrop-blur-md animate-fade-in">
      <div className="bg-white/95 backdrop-blur-xl border border-stone-200 rounded-[32px] w-full max-w-md overflow-hidden shadow-2xl animate-scale-in">
        <div className="flex justify-between items-center px-6 py-5 border-b border-stone-100 bg-[#FBF8F3]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#D97736]/10 text-[#D97736] flex items-center justify-center font-bold">
              <Tag size={18} />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#D97736]">DIRECT OFFER</span>
              <h3 className="font-serif-display text-2xl font-normal text-[#132E20]">Make an Offer</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-100 transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="p-3.5 bg-stone-50 border border-stone-200/80 rounded-2xl text-xs space-y-1">
            <div className="flex justify-between text-stone-800">
              <span className="font-bold">Crop:</span>
              <span className="font-semibold text-[#132E20]">{crop?.cropName || 'Fresh Produce'}</span>
            </div>
            <div className="flex justify-between text-stone-600">
              <span>Asking Price:</span>
              <span className="font-bold text-[#D97736]">₹{crop?.price}/{crop?.unit || 'kg'}</span>
            </div>
            <div className="flex justify-between text-stone-600">
              <span>Available Qty:</span>
              <span className="font-semibold">{crop?.quantity} {crop?.unit || 'kg'}</span>
            </div>
          </div>

          {/* Market Price Band Guidance */}
          {crop?.cropName && (
            <MarketPriceBand
              cropName={crop.cropName}
              currentPrice={offeredPrice}
              unit={crop?.unit || 'kg'}
              compact={true}
            />
          )}

          {/* Negotiation Copilot Advisory Box */}
          {copilot?.buyerGuidance && (
            <div className="p-3.5 bg-gradient-to-br from-emerald-50/90 to-teal-50/80 border border-emerald-200/90 rounded-2xl text-xs animate-fade-in">
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-1.5 font-bold text-emerald-950">
                  <Sparkles size={14} className="text-emerald-700" />
                  <span>Negotiation Copilot</span>
                  {copilotLoading && <Loader size={12} className="animate-spin text-emerald-600 inline ml-1" />}
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Suggested by AI
                </span>
              </div>

              <div className="flex items-center justify-between gap-2 mb-2">
                <div>
                  <span className="text-stone-600">Recommended Offer: </span>
                  <span className="font-bold text-emerald-800 text-sm">
                    ₹{copilot.buyerGuidance.recommendedOffer}/{crop?.unit || 'kg'}
                  </span>
                  <span className="text-stone-500 ml-1">
                    (~{copilot.buyerGuidance.acceptanceLikelihood}% likelihood)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={applySuggestedOffer}
                  className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[11px] transition shadow-xs cursor-pointer"
                >
                  Apply ₹{copilot.buyerGuidance.recommendedOffer}
                </button>
              </div>

              {copilot.currentEvaluation && (
                <div className="text-[11px] text-stone-700 bg-white/70 p-2 rounded-lg border border-emerald-100/80">
                  <span className="font-semibold">Offer Likelihood: </span>
                  <span
                    className={`font-bold ${
                      copilot.currentEvaluation.estimatedLikelihood >= 70
                        ? 'text-emerald-700'
                        : copilot.currentEvaluation.estimatedLikelihood >= 40
                        ? 'text-amber-700'
                        : 'text-rose-700'
                    }`}
                  >
                    ~{copilot.currentEvaluation.estimatedLikelihood}%
                  </span>
                  <p className="mt-0.5 text-stone-600">{copilot.currentEvaluation.advisoryMessage}</p>
                </div>
              )}

              <p className="text-[10px] text-stone-400 mt-2 italic">
                {copilot.disclaimer}
              </p>
            </div>
          )}

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">
                Your Price Offer (₹ per {crop?.unit || 'kg'})
              </label>
              <input
                type="number"
                value={offeredPrice}
                onChange={(e) => handlePriceChange(e.target.value)}
                className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm font-semibold text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                min="1"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">
                Quantity ({crop?.unit || 'kg'})
              </label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm font-semibold text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                min="1"
                max={crop?.quantity}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">
                Message to Farmer (Optional)
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none h-20"
                placeholder="E.g., Ready for immediate harvest pickup if accepted."
              />
            </div>
          </div>

          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs uppercase tracking-wider rounded-xl transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 bg-[#D97736] hover:bg-[#c2652b] text-white font-bold text-xs uppercase tracking-wider rounded-xl transition shadow-lg shadow-orange-900/10 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? <Loader size={16} className="animate-spin" /> : 'Send Offer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}