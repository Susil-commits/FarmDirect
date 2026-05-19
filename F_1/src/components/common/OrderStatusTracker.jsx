import React from 'react';

const ORDER_STATUS_FLOW = ['confirmed', 'preparing', 'ready_for_pickup', 'picked_up', 'completed'];

const STATUS_LABELS = {
  confirmed: 'Confirmed',
  preparing: 'Preparing',
  ready_for_pickup: 'Ready for Pickup',
  picked_up: 'Picked Up',
  completed: 'Completed',
  cancelled: 'Cancelled'
};

export default function OrderStatusTracker({ order }) {
  if (!order) return null;

  const currentStepIndex = ORDER_STATUS_FLOW.indexOf(order.orderStatus);

  const stages = [
    {
      id: 'confirmed',
      title: 'Order Confirmed',
      icon: '📋',
      status: currentStepIndex >= 0 ? 'completed' : 'pending',
      timestamp: order.createdAt,
    },
    {
      id: 'preparing',
      title: 'Farmer Preparing',
      icon: '📦',
      status: currentStepIndex >= 1 ? 'completed' : 'pending',
      timestamp: order.timeline?.find(t => t.status === 'preparing')?.timestamp,
    },
    {
      id: 'ready_for_pickup',
      title: 'Ready for Pickup',
      icon: '📍',
      status: currentStepIndex >= 2 ? 'completed' : 'pending',
      timestamp: order.timeline?.find(t => t.status === 'ready_for_pickup')?.timestamp,
    },
    {
      id: 'picked_up',
      title: 'Picked Up',
      icon: '🚚',
      status: currentStepIndex >= 3 ? 'completed' : 'pending',
      timestamp: order.timeline?.find(t => t.status === 'picked_up')?.timestamp,
    },
    {
      id: 'completed',
      title: 'Completed',
      icon: '✅',
      status: currentStepIndex >= 4 ? 'completed' : 'pending',
      timestamp: order.completedAt || order.timeline?.find(t => t.status === 'completed')?.timestamp,
    },
  ];

  // Handle cancelled orders
  if (order.orderStatus === 'cancelled') {
    stages.forEach(s => { s.status = 'completed'; });
    stages.push({
      id: 'cancelled',
      title: 'Cancelled',
      icon: '❌',
      status: 'rejected',
      timestamp: order.updatedAt,
    });
  }

  return (
    <div className="w-full">
      <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-6 border-2 border-blue-200">
        <h3 className="text-lg font-bold text-gray-900 mb-6">📊 Order Status & Timeline</h3>

        <div className="space-y-6">
          {stages.map((stage, idx) => {
            const isCompleted = stage.status === 'completed';
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
                            ? '✗ Cancelled'
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
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick Info Box */}
        <div className="mt-8 pt-6 border-t-2 border-blue-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg p-4 border border-blue-100">
              <p className="text-xs text-gray-600 font-semibold">Order Number</p>
              <p className="text-lg font-bold text-gray-900 mt-1">{order.orderNumber || order._id?.slice(-6)}</p>
            </div>
            <div className="bg-white rounded-lg p-4 border border-blue-100">
              <p className="text-xs text-gray-600 font-semibold">Order Date</p>
              <p className="text-lg font-bold text-gray-900 mt-1">
                {new Date(order.createdAt).toLocaleDateString('en-IN')}
              </p>
            </div>
            <div className="bg-white rounded-lg p-4 border border-blue-100">
              <p className="text-xs text-gray-600 font-semibold">Total Amount</p>
              <p className="text-lg font-bold text-green-600 mt-1">
                ₹{order.totalAmount?.toLocaleString('en-IN')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
