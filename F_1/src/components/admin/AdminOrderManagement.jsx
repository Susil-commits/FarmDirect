import React from 'react';
import { MapPin, Phone, Package, Clock, IndianRupee, User, CheckCircle, XCircle } from 'lucide-react';

const STATUS_LABELS = {
  confirmed: 'Confirmed',
  preparing: 'Preparing',
  ready_for_pickup: 'Ready for Pickup',
  picked_up: 'Picked Up',
  completed: 'Completed',
  cancelled: 'Cancelled'
};

const STATUS_COLORS = {
  confirmed: 'bg-blue-100 text-blue-800',
  preparing: 'bg-yellow-100 text-yellow-800',
  ready_for_pickup: 'bg-green-100 text-green-800',
  picked_up: 'bg-purple-100 text-purple-800',
  completed: 'bg-emerald-100 text-emerald-800',
  cancelled: 'bg-red-100 text-red-800'
};

export default function AdminOrderManagement({ order }) {
  if (!order) {
    return (
      <div className="bg-white rounded-xl border-2 border-gray-200 p-8 text-center">
        <Package size={48} className="text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">No order selected</p>
      </div>
    );
  }

  const timeline = order.timeline || [];
  const isCancelled = order.orderStatus === 'cancelled';
  const isCompleted = order.orderStatus === 'completed';

  return (
    <div className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
        <h3 className="text-white font-bold text-lg">
          Order #{order.orderNumber || (order._id || '').slice(-8).toUpperCase()}
        </h3>
        <div className="flex items-center gap-2 mt-1">
          <span className={`px-3 py-1 rounded-full text-xs font-bold ${STATUS_COLORS[order.orderStatus] || 'bg-gray-100 text-gray-800'}`}>
            {STATUS_LABELS[order.orderStatus] || order.orderStatus}
          </span>
          {isCancelled && <XCircle size={16} className="text-red-600" />}
          {isCompleted && <CheckCircle size={16} className="text-emerald-600" />}
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Order Item */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-gray-600 mb-3 flex items-center gap-2">
            <Package size={16} /> Order Item
          </h4>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold text-gray-900 text-lg">{order.cropName || 'Crop Item'}</p>
              <p className="text-sm text-gray-600">
                {order.quantity} kg × ₹{(order.unitPrice || 0).toLocaleString('en-IN')}/kg
              </p>
            </div>
            <p className="text-xl font-bold text-green-600">
              ₹{(order.totalAmount || 0).toLocaleString('en-IN')}
            </p>
          </div>
        </div>

        {/* Pickup Location */}
        <div>
          <h4 className="text-sm font-semibold text-gray-600 mb-3 flex items-center gap-2">
            <MapPin size={16} /> Pickup Location
          </h4>
          <p className="text-gray-900 font-medium">{order.pickupLocation || 'Not specified'}</p>
        </div>

        {/* Contact Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-gray-600 mb-2 flex items-center gap-2">
              <User size={16} /> Farmer Contact
            </h4>
            <p className="text-gray-900 font-medium">
              {order.farmerContact ? (
                <a href={`tel:${order.farmerContact}`} className="text-blue-600 hover:underline">
                  {order.farmerContact}
                </a>
              ) : 'N/A'}
            </p>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-gray-600 mb-2 flex items-center gap-2">
              <Phone size={16} /> Buyer Contact
            </h4>
            <p className="text-gray-900 font-medium">
              {order.buyerContact ? (
                <a href={`tel:${order.buyerContact}`} className="text-blue-600 hover:underline">
                  {order.buyerContact}
                </a>
              ) : 'N/A'}
            </p>
          </div>
        </div>

        {/* Payment Info */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-gray-600 mb-3 flex items-center gap-2">
            <IndianRupee size={16} /> Payment
          </h4>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Method</p>
              <p className="font-semibold text-gray-900">
                {order.paymentMethod === 'razorpay'
                  ? 'Online (Razorpay)'
                  : order.paymentMethod === 'cod'
                  ? 'Cash on Delivery (COD)'
                  : order.paymentMethod || 'COD'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Status</p>
              <p className={`font-semibold ${
                order.paymentStatus === 'completed' || order.paymentStatus === 'paid'
                  ? 'text-green-600'
                  : order.paymentStatus === 'failed'
                  ? 'text-red-600'
                  : 'text-yellow-600'
              }`}>
                {order.paymentStatus === 'completed' || order.paymentStatus === 'paid'
                  ? 'Paid'
                  : order.paymentStatus === 'failed'
                  ? 'Failed'
                  : 'Pending'}
              </p>
            </div>
          </div>
        </div>

        {/* Order Timeline */}
        <div>
          <h4 className="text-sm font-semibold text-gray-600 mb-4 flex items-center gap-2">
            <Clock size={16} /> Order Timeline
          </h4>
          {timeline.length > 0 ? (
            <div className="space-y-3">
              {timeline.map((entry, idx) => (
                <div key={idx} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`w-3 h-3 rounded-full ${
                      entry.status === 'cancelled' ? 'bg-red-500' : 'bg-green-500'
                    }`} />
                    {idx < timeline.length - 1 && (
                      <div className="w-0.5 h-6 bg-gray-300" />
                    )}
                  </div>
                  <div className="pb-4">
                    <p className="text-sm font-semibold text-gray-900">
                      {STATUS_LABELS[entry.status] || entry.status}
                    </p>
                    {entry.description && (
                      <p className="text-xs text-gray-600">{entry.description}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(entry.timestamp).toLocaleString('en-IN', {
                        day: 'numeric', month: 'short', year: 'numeric',
                        hour: '2-digit', minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No timeline entries yet</p>
          )}
        </div>

        {/* Order Dates */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          <div>
            <p className="text-xs text-gray-600">Created</p>
            <p className="text-sm font-semibold text-gray-900">
              {new Date(order.createdAt).toLocaleString('en-IN')}
            </p>
          </div>
          {order.completedAt && (
            <div>
              <p className="text-xs text-gray-600">Completed</p>
              <p className="text-sm font-semibold text-gray-900">
                {new Date(order.completedAt).toLocaleString('en-IN')}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
