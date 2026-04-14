import React from 'react';
import { CheckCircle, Circle, Clock, AlertCircle, Phone, ShieldCheck, Truck, DollarSign } from 'lucide-react';

export default function OrderStatusTracker({ order }) {
  if (!order) return null;

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'text-green-600';
      case 'pending':
        return 'text-yellow-600';
      case 'rejected':
        return 'text-red-600';
      case 'hold':
        return 'text-orange-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusBgColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100';
      case 'pending':
        return 'bg-yellow-100';
      case 'rejected':
        return 'bg-red-100';
      case 'hold':
        return 'bg-orange-100';
      default:
        return 'bg-gray-100';
    }
  };

  const stages = [
    {
      id: 'order_placed',
      title: 'Order Placed',
      icon: '📦',
      status: order.orderStatus !== 'pending' ? 'completed' : 'completed',
      timestamp: order.createdAt,
    },
    {
      id: 'verification_call',
      title: 'Verification Call',
      icon: '📞',
      status: order.verificationCall?.status || 'pending',
      timestamp: order.verificationCall?.verifiedAt,
      details: order.verificationCall?.verificationNotes,
    },
    {
      id: 'admin_approval',
      title: 'Admin Approval',
      icon: '✓',
      status: order.adminApproval?.status || 'pending',
      timestamp: order.adminApproval?.approvedAt,
      details: order.adminApproval?.rejectionReason || order.adminApproval?.notes,
    },
    {
      id: 'ready_delivery',
      title: 'Ready for Delivery',
      icon: '🚚',
      status: order.orderStatus === 'ready_for_delivery' ? 'completed' : 
              (order.orderStatus === 'shipped' || order.orderStatus === 'delivered' ? 'completed' : 'pending'),
      timestamp: order.estimatedDeliveryDate,
    },
    {
      id: 'payment',
      title: 'Payment Collection',
      icon: '💰',
      status: order.paymentStatus,
      timestamp: order.paymentReceived?.receivedAt,
      amount: order.totalWithCharges,
    },
  ];

  return (
    <div className="w-full">
      <div className="bg-linear-to-r from-blue-50 to-cyan-50 rounded-xl p-6 border-2 border-blue-200">
        <h3 className="text-lg font-bold text-gray-900 mb-6">📊 Order Status & Timeline</h3>

        <div className="space-y-6">
          {stages.map((stage, idx) => {
            const isCompleted = stage.status === 'completed';
            const isPending = stage.status === 'pending';
            const isRejected = stage.status === 'rejected';
            const isHold = stage.status === 'hold';

            return (
              <div key={stage.id}>
                {/* Stage Item */}
                <div className="flex gap-4">
                  {/* Timeline Line and Icon */}
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold border-2 transition-all ${
                        isCompleted
                          ? 'bg-green-100 border-green-500 text-green-600'
                          : isRejected
                          ? 'bg-red-100 border-red-500 text-red-600'
                          : isHold
                          ? 'bg-orange-100 border-orange-500 text-orange-600'
                          : 'bg-gray-100 border-gray-300 text-gray-600'
                      }`}
                    >
                      {stage.icon}
                    </div>
                    {/* Vertical Line to next stage */}
                    {idx < stages.length - 1 && (
                      <div
                        className={`w-1 h-12 mt-2 transition-all ${
                          isCompleted ? 'bg-green-500' : 'bg-gray-300'
                        }`}
                      />
                    )}
                  </div>

                  {/* Stage Details */}
                  <div className="pb-6 flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-bold text-gray-900">{stage.title}</h4>
                        <p
                          className={`text-sm font-semibold mt-1 ${
                            isCompleted
                              ? 'text-green-600'
                              : isRejected
                              ? 'text-red-600'
                              : isHold
                              ? 'text-orange-600'
                              : 'text-yellow-600'
                          }`}
                        >
                          {isCompleted
                            ? '✓ Completed'
                            : isRejected
                            ? '✗ Rejected'
                            : isHold
                            ? '⏸ On Hold'
                            : '⏳ Pending'}
                        </p>
                      </div>
                    </div>

                    {/* Timestamp */}
                    {stage.timestamp && (
                      <p className="text-xs text-gray-600 mt-2">
                        {new Date(stage.timestamp).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    )}

                    {/* Details */}
                    {stage.details && (
                      <div className="mt-2 p-3 bg-white rounded-lg border border-gray-200">
                        <p className="text-sm text-gray-700">
                          <strong>Notes:</strong> {stage.details}
                        </p>
                      </div>
                    )}

                    {/* Amount for Payment Stage */}
                    {stage.id === 'payment' && stage.amount && (
                      <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
                        <p className="text-sm font-semibold text-green-900">
                          💰 Amount to Pay: ₹{stage.amount.toFixed(2)}
                        </p>
                        <div className="text-xs text-green-800 mt-1 space-y-1">
                          <p>Base Amount: ₹{order.totalAmount.toFixed(2)}</p>
                          {order.chargesAmount > 0 && (
                            <p className="text-orange-700">
                              + Additional Charges: ₹{order.chargesAmount.toFixed(2)}
                            </p>
                          )}
                          {order.fineAmount > 0 && (
                            <p className="text-red-700">
                              + Fine: ₹{order.fineAmount.toFixed(2)}
                              {order.issueFine?.ratingReduction && (
                                <span> (Rating reduced by {order.issueFine.ratingReduction} ⭐)</span>
                              )}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick Info Box */}
        <div className="mt-8 pt-6 border-t-2 border-blue-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-lg p-4 border border-blue-100">
              <p className="text-xs text-gray-600 font-semibold">Order Number</p>
              <p className="text-lg font-bold text-gray-900 mt-1">{order.orderNumber}</p>
            </div>
            <div className="bg-white rounded-lg p-4 border border-blue-100">
              <p className="text-xs text-gray-600 font-semibold">Order Date</p>
              <p className="text-lg font-bold text-gray-900 mt-1">
                {new Date(order.createdAt).toLocaleDateString('en-IN')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
