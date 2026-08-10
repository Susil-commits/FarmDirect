import { useState } from 'react';
import { AlertTriangle, Edit2, Check, X } from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Badge from '../../components/common/Badge';
import farmerService from '../../services/farmerService';

export default function InventoryManager({ items = [], onRefresh }) {
  const [editingId, setEditingId] = useState(null);
  const [newThreshold, setNewThreshold] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const handleEditThreshold = (cropId, currentThreshold) => {
    setEditingId(cropId);
    setNewThreshold(currentThreshold);
    setMessage(null);
  };

  const handleSaveThreshold = async (cropId) => {
    try {
      setSaving(true);
      
      const thresholdValue = parseInt(newThreshold);
      if (isNaN(thresholdValue) || thresholdValue < 0) {
        setMessage({ type: 'error', text: 'Please enter a valid threshold value' });
        return;
      }

      await farmerService.updateLowStockThreshold(cropId, thresholdValue);
      setMessage({ type: 'success', text: 'Threshold updated successfully' });
      setEditingId(null);
      
      // Refresh data after 2 seconds
      setTimeout(() => {
        onRefresh();
      }, 1500);
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.message || 'Failed to update threshold' 
      });
    } finally {
      setSaving(false);
    }
  };

  if (!items || items.length === 0) {
    return (
      <div className="bg-white/95 backdrop-blur-xl border border-stone-200/90 rounded-[28px] p-12 text-center shadow-xl font-sans-body">
        <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto mb-3">
          <AlertTriangle size={24} />
        </div>
        <h3 className="font-serif-display text-2xl font-normal text-[#132E20]">Inventory Fully Stocked</h3>
        <p className="text-stone-500 text-xs mt-1">All your active crop listings are operating safely above your low-stock thresholds.</p>
      </div>
    );
  }

  const criticalItems = items.filter(item => item.quantity === 0);
  const warningItems = items.filter(item => item.quantity > 0);

  return (
    <div className="space-y-6 font-sans-body text-[#132E20]">
      {message && (
        <div className={`p-4 rounded-2xl text-xs font-bold ${
          message.type === 'success' 
            ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          {message.text}
        </div>
      )}

      {/* Critical (Out of Stock) */}
      {criticalItems.length > 0 && (
        <div className="bg-white/95 backdrop-blur-xl border border-red-200 rounded-[28px] overflow-hidden shadow-xl">
          <div className="p-6 border-b border-red-100 bg-red-50/50">
            <h3 className="flex items-center gap-2 font-serif-display text-2xl text-red-900">
              <AlertTriangle size={20} />
              Out of Stock ({criticalItems.length})
            </h3>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              {criticalItems.map(item => (
                <InventoryItem 
                  key={item._id}
                  item={item}
                  isEditing={editingId === item._id}
                  editValue={newThreshold}
                  onEdit={() => handleEditThreshold(item._id, item.lowStockThreshold)}
                  onCancel={() => setEditingId(null)}
                  onSave={() => handleSaveThreshold(item._id)}
                  onThresholdChange={setNewThreshold}
                  saving={saving}
                  isCritical={true}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Warning (Low Stock) */}
      {warningItems.length > 0 && (
        <div className="bg-white/95 backdrop-blur-xl border border-amber-200 rounded-[28px] overflow-hidden shadow-xl">
          <div className="p-6 border-b border-amber-100 bg-amber-50/50">
            <h3 className="flex items-center gap-2 font-serif-display text-2xl text-amber-900">
              <AlertTriangle size={20} />
              Low Stock ({warningItems.length})
            </h3>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              {warningItems.map(item => (
                <InventoryItem 
                  key={item._id}
                  item={item}
                  isEditing={editingId === item._id}
                  editValue={newThreshold}
                  onEdit={() => handleEditThreshold(item._id, item.lowStockThreshold)}
                  onCancel={() => setEditingId(null)}
                  onSave={() => handleSaveThreshold(item._id)}
                  onThresholdChange={setNewThreshold}
                  saving={saving}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* About Low Stock Threshold */}
      <div className="bg-white/95 backdrop-blur-xl border border-stone-200/90 rounded-[28px] p-6 shadow-xl">
        <h4 className="font-serif-display text-2xl font-normal text-[#132E20] mb-2">About Low-Stock Thresholds</h4>
        <ul className="text-stone-600 text-xs space-y-1.5 pl-1">
          <li className="flex items-center gap-2">✓ <strong>Threshold:</strong> Automated notifications trigger when crop stock drops below threshold</li>
          <li className="flex items-center gap-2">✓ <strong>Edit Threshold:</strong> Click edit to configure custom safety stock levels per crop</li>
          <li className="flex items-center gap-2">✓ <strong>Notifications:</strong> Real-time SMS & email alerts dispatched to farmer phone</li>
        </ul>
      </div>
    </div>
  );
}

function InventoryItem({ 
  item, 
  isEditing, 
  editValue, 
  onEdit, 
  onCancel, 
  onSave, 
  onThresholdChange,
  saving,
  isCritical 
}) {
  const percentage = (item.quantity / item.lowStockThreshold) * 100;
  const statusColor = isCritical ? 'text-red-600' : percentage < 50 ? 'text-red-600' : 'text-yellow-600';

  return (
    <div className={`p-4 border rounded-lg ${isCritical ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200'}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900">{item.cropName}</h4>
          <p className="text-sm text-gray-600">{item.category}</p>
        </div>
        <Badge 
          variant={isCritical ? 'danger' : (percentage < 50 ? 'danger' : 'warning')}
        >
          {isCritical ? 'Out of Stock' : 'Low Stock'}
        </Badge>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-4">
        <div>
          <p className="text-xs text-gray-600 uppercase font-semibold">Current Qty</p>
          <p className={`text-xl font-bold ${statusColor}`}>{item.quantity} {item.unit || 'kg'}</p>
        </div>
        <div>
          <p className="text-xs text-gray-600 uppercase font-semibold">Price</p>
          <p className="text-lg font-bold text-gray-900">₹{item.price}</p>
        </div>
        <div>
          <p className="text-xs text-gray-600 uppercase font-semibold">Threshold</p>
          {isEditing ? (
            <Input
              type="number"
              value={editValue}
              onChange={(e) => onThresholdChange(e.target.value)}
              className="mt-1 w-full"
              min="0"
            />
          ) : (
            <p className="text-lg font-bold text-gray-900">{item.lowStockThreshold} {item.unit || 'kg'}</p>
          )}
        </div>
        <div>
          <p className="text-xs text-gray-600 uppercase font-semibold">Status</p>
          <p className="text-sm mt-1">
            <span className={`font-semibold ${statusColor}`}>
              {percentage < 25 ? 'Critical' : percentage < 75 ? 'Warning' : 'Low'}
            </span>
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-3">
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all ${
              isCritical ? 'bg-red-500' : 
              percentage < 50 ? 'bg-red-500' : 
              'bg-yellow-500'
            }`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
        <p className="text-xs text-gray-600 mt-1">
          {isCritical ? 'Out of stock' : `${percentage.toFixed(0)}% of threshold`}
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-2 justify-end">
        {isEditing ? (
          <>
            <Button
              onClick={onCancel}
              variant="secondary"
              size="sm"
              disabled={saving}
            >
              <X size={16} />
            </Button>
            <Button
              onClick={onSave}
              variant="primary"
              size="sm"
              disabled={saving}
            >
              <Check size={16} />
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </>
        ) : (
          <Button
            onClick={onEdit}
            variant="secondary"
            size="sm"
          >
            <Edit2 size={16} />
            Edit Threshold
          </Button>
        )}
      </div>
    </div>
  );
}
