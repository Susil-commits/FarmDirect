import { useState } from 'react';
import { X, Loader } from 'lucide-react';
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
      addToast('Offer submitted successfully! The farmer will review it.', 'success');
      onSuccess?.();
      onClose();
    } catch (error) {
      addToast(error?.response?.data?.message || 'Failed to submit offer.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-scale-in">
        <div className="flex justify-between items-center p-5 border-b">
          <h3 className="text-xl font-bold text-gray-900">Make an Offer</h3>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-4 p-3 bg-green-50 rounded-lg text-sm text-green-800">
            <strong>Crop:</strong> {crop?.cropName} <br/>
            <strong>Asking Price:</strong> ₹{crop?.price}/{crop?.unit} <br/>
            <strong>Available Qty:</strong> {crop?.quantity} {crop?.unit}
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Your Price Offer (₹ per {crop?.unit})</label>
              <input 
                type="number" 
                value={offeredPrice} 
                onChange={(e) => setOfferedPrice(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-400 outline-none"
                min="1"
                required 
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Quantity ({crop?.unit})</label>
              <input 
                type="number" 
                value={quantity} 
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-400 outline-none"
                min="1"
                max={crop?.quantity}
                required 
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Message (Optional)</label>
              <textarea 
                value={message} 
                onChange={(e) => setMessage(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-400 outline-none resize-none h-20"
                placeholder="E.g., I'll buy the whole lot if you can do this price."
              />
            </div>
          </div>
          
          <div className="mt-6 flex gap-3">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" className="flex-1" disabled={loading}>
              {loading ? <Loader className="animate-spin" size={20} /> : 'Submit Offer'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
