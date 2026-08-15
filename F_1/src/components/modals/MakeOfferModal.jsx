import { useState } from 'react';
import { X, Loader, Tag, CheckCircle2 } from 'lucide-react';
import Button from '../common/Button';
import { useToast } from '../../context/ToastContext';
import { negotiationService } from '../../services/negotiationService';

export default function MakeOfferModal({ isOpen, onClose, crop, onSuccess }) {
  const [offeredPrice, setOfferedPrice] = useState(crop?.price || '');
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();

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
        message
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
        {}
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
          {}
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

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">
                Your Price Offer (₹ per {crop?.unit || 'kg'})
              </label>
              <input 
                type="number" 
                value={offeredPrice} 
                onChange={(e) => setOfferedPrice(e.target.value)}
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
              className="flex-1 py-3 bg-[#D97736] hover:bg-[#c06528] text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              {loading ? (
                <Loader className="animate-spin" size={16} />
              ) : (
                <>
                  <span>Submit Offer</span>
                  <CheckCircle2 size={16} />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
