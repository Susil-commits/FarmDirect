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
      <Card>
        <div className="p-12 text-center">
          <AlertTriangle className="w-12 h-12 text-green-600 mx-auto mb-4 opacity-50" />
          <p className="text-gray-600 font-medium">No low-stock items</p>
          <p className="text-gray-500 text-sm mt-2">All your inventory is above the threshold</p>
        </div>
      </Card>
    );
  }

  const criticalItems = items.filter(item => item.quantity === 0);
  const warningItems = items.filter(item => item.quantity > 0);

  return (
    <div className="space-y-6">
      {message && (
        <div className={`p-4 rounded-lg ${
          message.type === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-700'
            : 'bg-red-50 border border-red-200 text-red-700'
        }`}>
          {message.text}
        </div>
      )}

      {/* Critical (Out of Stock) */}
      {criticalItems.length > 0 && (
        <Card>
          <div className="p-6 border-b border-red-200 bg-red-50">
            <h3 className="flex items-center gap-2 font-bold text-red-900">
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
        </Card>
      )}

      {/* Warning (Low Stock) */}
      {warningItems.length > 0 && (
        <Card>
          <div className="p-6 border-b border-yellow-200 bg-yellow-50">
            <h3 className="flex items-center gap-2 font-bold text-yellow-900">
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
        </Card>
      )}

      {/* About Low Stock Threshold */}
      <Card>
        <div className="p-6 bg-blue-50">
          <h4 className="font-semibold text-blue-900 mb-3">About Low-Stock Alerts</h4>
          <ul className="text-blue-800 text-sm space-y-2">
            <li>• <strong>Threshold:</strong> When inventory falls below this level, you'll receive alerts</li>
            <li>• <strong>Edit Threshold:</strong> Click the edit icon to adjust the threshold for each crop</li>
            <li>• <strong>Notifications:</strong> You'll receive real-time notifications when threshold is breached</li>
            <li>• <strong>Recommendations:</strong> Consider restocking when you see these alerts</li>
          </ul>
        </div>
      </Card>
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

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
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
