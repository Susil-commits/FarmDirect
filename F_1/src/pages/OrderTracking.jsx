import { useEffect, useState } from 'react';
import { Package, Truck, CheckCircle, Clock, MapPin, Phone } from 'lucide-react';
import { orderTrackingService } from '../services/orderTrackingService.js';
import { useToast } from '../context/ToastContext';
import PageTransition from '../components/common/PageTransition';

export default function OrderTracking() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const { addToast } = useToast();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await orderTrackingService.getUserOrders();
      setOrders(response.data || []);
    } catch (error) {
      addToast('Failed to load orders', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'confirmed':
        return <CheckCircle className="w-5 h-5 text-blue-500" />;
      case 'shipped':
        return <Truck className="w-5 h-5 text-purple-500" />;
      case 'delivered':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      default:
        return <Package className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-50 border-yellow-200 text-yellow-700';
      case 'confirmed':
        return 'bg-blue-50 border-blue-200 text-blue-700';
      case 'shipped':
        return 'bg-purple-50 border-purple-200 text-purple-700';
      case 'delivered':
        return 'bg-green-50 border-green-200 text-green-700';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-700';
    }
  };

  if (loading) {
    return (
      <PageTransition>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4 animate-pulse" />
            <p className="text-gray-600">Loading your orders...</p>
          </div>
        </div>
      </PageTransition>
    );
  }

  if (orders.length === 0) {
    return (
      <PageTransition>
        <div className="min-h-screen py-20 px-4">
          <div className="max-w-2xl mx-auto text-center">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No Orders Yet</h2>
            <p className="text-gray-600 mb-6">You haven't placed any orders. Start shopping now!</p>
            <a href="/marketplace" className="inline-block px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">
              Go to Marketplace
            </a>
          </div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Tracking</h1>
          <p className="text-gray-600 mb-8">Monitor the status of your orders</p>

          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order._id}
                className="bg-white rounded-lg shadow hover:shadow-lg transition border-l-4 border-green-500"
              >
                <div
                  className="p-6 cursor-pointer"
                  onClick={() => setExpandedOrder(expandedOrder === order._id ? null : order._id)}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(order.status)}
                      <div>
                        <p className="font-semibold text-gray-900">Order #{order.orderNumber}</p>
                        <p className="text-sm text-gray-500">
                          Placed on {new Date(order.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900">₹{order.totalAmount}</p>
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                    </div>
                  </div>

                  {expandedOrder === order._id && (
                    <div className="border-t pt-4 space-y-4">
                      {/* Order Timeline */}
                      <div className="space-y-3">
                        <h4 className="font-semibold text-gray-900">Order Timeline</h4>
                        <div className="space-y-2">
                          {order.timeline && order.timeline.map((event, idx) => (
                            <div key={idx} className="flex gap-3">
                              <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                              <div>
                                <p className="text-sm font-medium text-gray-900">{event.status}</p>
                                <p className="text-xs text-gray-500">
                                  {new Date(event.timestamp).toLocaleString()}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Items */}
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Items</h4>
                        <div className="space-y-2">
                          {order.items && order.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center text-sm bg-gray-50 p-2 rounded">
                              <span className="text-gray-700">{item.name} x{item.quantity}</span>
                              <span className="text-gray-900 font-medium">₹{item.price * item.quantity}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Delivery Address */}
                      {order.deliveryAddress && (
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                            <MapPin size={16} />
                            Delivery Address
                          </h4>
                          <p className="text-sm text-gray-700">{order.deliveryAddress}</p>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2 pt-2">
                        {order.status !== 'delivered' && (
                          <button className="flex-1 px-3 py-2 bg-red-50 text-red-600 rounded hover:bg-red-100 transition text-sm font-medium">
                            Cancel Order
                          </button>
                        )}
                        {order.status === 'delivered' && (
                          <button className="flex-1 px-3 py-2 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition text-sm font-medium">
                            Return Item
                          </button>
                        )}
                        <button className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition text-sm font-medium">
                          Download Invoice
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
