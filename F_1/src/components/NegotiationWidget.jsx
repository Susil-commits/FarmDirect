import { useState } from 'react';
import { Loader, CheckCircle, XCircle, Edit3 } from 'lucide-react';
import Button from './common/Button';
import Badge from './common/Badge';
import { useToast } from '../hooks/useToast';
import { negotiationService } from '../services/negotiationService';

const getStatusColor = (status) => {
  switch (status) {
    case 'pending': return 'warning';
    case 'accepted': return 'success';
    case 'rejected': return 'danger';
    case 'counter_offered': return 'primary';
    default: return 'secondary';
  }
};

export default function NegotiationWidget({ negotiation, userRole, onUpdate }) {
  const [loadingAction, setLoadingAction] = useState(null);
  const [showCounter, setShowCounter] = useState(false);
  const [counterPrice, setCounterPrice] = useState(negotiation?.offeredPrice || '');
  const [message, setMessage] = useState('');
  const { addToast } = useToast();

  const handleAction = async (action) => {
    try {
      setLoadingAction(action);
      let payload = { action };
      
      if (action === 'counter') {
        if (!counterPrice) {
          addToast('Please enter a counter price', 'warning');
          setLoadingAction(null);
          return;
        }
        payload.offeredPrice = Number(counterPrice);
      }
      
      if (message) {
        payload.message = message;
      }

      const res = await negotiationService.respondToOffer(negotiation._id, payload);
      addToast(res.message || `Negotiation ${action}ed successfully`, 'success');
      setShowCounter(false);
      setMessage('');
      if (onUpdate) onUpdate();
    } catch (error) {
      addToast(error?.response?.data?.message || 'Action failed', 'error');
    } finally {
      setLoadingAction(null);
    }
  };

  const isFarmer = userRole === 'farmer';
  const isPending = negotiation.status === 'pending';
  const isCountered = negotiation.status === 'counter_offered';

  const canAct = (isFarmer && isPending) || (!isFarmer && isCountered);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-4 hover:shadow-md transition">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 border-b pb-4 mb-4">
        <div>
          <h4 className="font-bold text-lg text-gray-900">{negotiation.cropId?.cropName || 'Unknown Crop'}</h4>
          <p className="text-sm text-gray-500">
            {isFarmer 
              ? `Offer from ${negotiation.buyerId?.name || negotiation.buyerId?.firstName || 'a buyer'}` 
              : `Offer to ${negotiation.farmerId?.name || negotiation.farmerId?.farmName || 'farmer'}`
            }
          </p>
        </div>
        <div className="flex gap-4">
          <div className="text-right">
            <p className="text-xs text-gray-500 mb-1">Asking Price</p>
            <p className="font-semibold line-through text-gray-400">₹{negotiation.originalPrice}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500 mb-1">Offered Price</p>
            <p className="font-bold text-green-600 text-lg">₹{negotiation.offeredPrice}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500 mb-1">Quantity</p>
            <p className="font-semibold text-gray-900">{negotiation.quantity} {negotiation.cropId?.unit || 'unit'}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500 mb-1">Status</p>
            <Badge label={negotiation.status.replace('_', ' ').toUpperCase()} variant={getStatusColor(negotiation.status)} />
          </div>
        </div>
      </div>

      <div className="mb-4">
        <h5 className="text-sm font-semibold text-gray-700 mb-2">Timeline</h5>
        <div className="space-y-2 bg-gray-50 p-3 rounded-lg max-h-40 overflow-y-auto">
          {negotiation.timeline?.map((event, idx) => (
            <div key={idx} className="text-sm">
              <span className="font-medium text-gray-900 capitalize">{event.status.replace('_', ' ')}: </span>
              <span className="text-gray-600">{event.message}</span>
              {event.offeredPrice && <span className="ml-1 text-green-600 font-semibold">(₹{event.offeredPrice})</span>}
              <span className="text-xs text-gray-400 ml-2">{new Date(event.timestamp).toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>

      {canAct && !showCounter && (
        <div className="flex gap-3 justify-end mt-4">
          <Button variant="danger" onClick={() => handleAction('reject')} disabled={loadingAction !== null}>
            {loadingAction === 'reject' ? <Loader className="animate-spin" size={16} /> : <XCircle size={16} className="mr-1 inline" />}
            Reject
          </Button>
          <Button variant="outline" onClick={() => setShowCounter(true)} disabled={loadingAction !== null}>
            <Edit3 size={16} className="mr-1 inline" />
            Counter
          </Button>
          <Button variant="success" onClick={() => handleAction('accept')} disabled={loadingAction !== null}>
            {loadingAction === 'accept' ? <Loader className="animate-spin" size={16} /> : <CheckCircle size={16} className="mr-1 inline" />}
            Accept Offer
          </Button>
        </div>
      )}

      {showCounter && (
        <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-100 animate-slide-in-down">
          <h5 className="font-semibold text-blue-900 mb-3">Make a Counter Offer</h5>
          <div className="flex gap-4 mb-3">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-gray-700 mb-1">Counter Price (₹)</label>
              <input 
                type="number" 
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 outline-none"
                value={counterPrice}
                onChange={(e) => setCounterPrice(e.target.value)}
              />
            </div>
            <div className="flex-2">
              <label className="block text-xs font-semibold text-gray-700 mb-1">Message (Optional)</label>
              <input 
                type="text" 
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 outline-none"
                placeholder="E.g., This is my final offer."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" size="sm" onClick={() => setShowCounter(false)}>Cancel</Button>
            <Button variant="primary" size="sm" onClick={() => handleAction('counter')} disabled={loadingAction === 'counter'}>
              {loadingAction === 'counter' ? <Loader className="animate-spin" size={16} /> : 'Send Counter Offer'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
