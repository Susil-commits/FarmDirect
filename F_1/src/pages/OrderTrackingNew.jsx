import React, { useState, useEffect } from 'react';
import { useRouter } from '../context/RouterContext';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../context/ToastContext';
import { useRealtime } from '../context/RealtimeContext';
import { orderService } from '../services/appService';
import PageTransition from '../components/common/PageTransition';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import ScrollAnimation from '../components/common/ScrollAnimation';
import {
  MapPin, Phone, Truck, Package, CheckCircle, Clock,
  User, MessageCircle, ArrowLeft, IndianRupee, Leaf, ThumbsUp, Loader
} from 'lucide-react';
import '../styles/OrderTracking.css';

const STATUS_LABELS = {
  confirmed: 'Confirmed',
  preparing: 'Preparing',
  ready_for_pickup: 'Ready for Pickup',
  picked_up: 'Picked Up',
  completed: 'Completed',
  cancelled: 'Cancelled'
};

export default function OrderTrackingNew() {
  const { navigate } = useRouter();
  const { user } = useAuth();
  const { addToast } = useToast();
  const { orderEvent } = useRealtime();

  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showContactModal, setShowContactModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchOrders();
    let active = true;
    const interval = setInterval(() => { if (active) fetchOrders(); }, 30000);
    const onVis = () => { active = !document.hidden; if (active) fetchOrders(); };
    document.addEventListener('visibilitychange', onVis);
    return () => { clearInterval(interval); document.removeEventListener('visibilitychange', onVis); };
  }, [user]);

  // Live order updates via WebSocket: patch the selected order instantly and
  // reconcile the list (debounced). Toasts/browser-push are handled centrally
  // by RealtimeProvider; this just keeps the UI in sync without a full refresh.
  useEffect(() => {
    if (!orderEvent) return;
    setSelectedOrder((prev) => {
      if (prev && String(prev._id) === String(orderEvent.orderId)) {
        return {
          ...prev,
          orderStatus: orderEvent.orderStatus,
          updatedAt: orderEvent.updatedAt,
        };
      }
      return prev;
    });
    const t = setTimeout(() => fetchOrders(), 400);
    return () => clearTimeout(t);
  }, [orderEvent]);

  const fetchOrders = async () => {
    try {
      const data = await orderService.getOrders();
      const allOrders = data.data || [];

      // Filter out completed/cancelled for active tracking
      const activeOrders = allOrders.filter(o => !['completed', 'cancelled'].includes(o.orderStatus));
      setOrders(activeOrders);

      if (!selectedOrder && activeOrders.length > 0) {
        setSelectedOrder(activeOrders[0]);
      } else if (selectedOrder) {
        const updated = allOrders.find(o => o._id === selectedOrder._id);
        if (updated) setSelectedOrder(updated);
      }
    } catch {
      addToast('Failed to load orders', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkPickedUp = async () => {
    if (!selectedOrder) return;
    setActionLoading(true);
    try {
      await orderService.updateOrderStatus(selectedOrder._id, 'picked_up');
      addToast('Order marked as picked up! Complete by marking as received.', 'success');
      await fetchOrders();
    } catch (err) {
      addToast(err?.message || 'Failed to mark as picked up', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkReceived = async () => {
    if (!selectedOrder) return;
    setActionLoading(true);
    try {
      await orderService.markOrderReceived(selectedOrder._id);
      addToast('Order marked as completed! Thank you for your purchase.', 'success');
      await fetchOrders();
    } catch (err) {
      addToast(err?.message || 'Failed to mark as received', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusTimeline = (order) => {
    const statuses = [
      { label: 'Confirmed', status: 'confirmed', icon: '📋' },
      { label: 'Preparing', status: 'preparing', icon: '📦' },
      { label: 'Ready for Pickup', status: 'ready_for_pickup', icon: '📍' },
      { label: 'Picked Up', status: 'picked_up', icon: '🚚' },
      { label: 'Completed', status: 'completed', icon: '✅' }
    ];

    const currentStatusIndex = statuses.findIndex(s => s.status === order.orderStatus);
    return statuses.map((s, idx) => ({
      ...s,
      completed: idx < currentStatusIndex,
      current: idx === currentStatusIndex,
      pending: idx > currentStatusIndex
    }));
  };

  const getStatusDotColor = (orderStatus) => {
    switch (orderStatus) {
      case 'confirmed': return 'bg-blue-600';
      case 'preparing': return 'bg-yellow-600';
      case 'ready_for_pickup': return 'bg-orange-600';
      case 'picked_up': return 'bg-purple-600';
      default: return 'bg-gray-600';
    }
  };

  if (loading) {
    return (
      <PageTransition>
        <div className="min-h-screen bg-gradient-to-br from-white via-orange-50 to-white py-12 px-4">
          <div className="max-w-6xl mx-auto">
            <Card className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
              <p className="text-gray-600 mt-4">Loading your orders...</p>
            </Card>
          </div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-br from-white via-orange-50 to-white py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <ScrollAnimation className="scroll-slide mb-8">
            <button onClick={() => navigate(-1)} className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 transition mb-4">
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Track Your Orders</h1>
            <p className="text-gray-600">Real-time order status tracking and updates</p>
          </ScrollAnimation>

          {orders.length === 0 ? (
            <ScrollAnimation className="scroll-slide">
              <Card className="p-12 text-center">
                <Truck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">No active orders to track</p>
                <Button onClick={() => navigate('/marketplace')} variant="primary">Browse Marketplace</Button>
              </Card>
            </ScrollAnimation>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Orders List */}
              <div className="lg:col-span-1">
                <ScrollAnimation className="scroll-slide">
                  <Card className="p-4">
                    <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <Package className="w-5 h-5" />Your Orders
                    </h3>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {orders.map(order => (
                        <button
                          key={order._id}
                          onClick={() => setSelectedOrder(order)}
                          className={`w-full p-3 text-left rounded-lg transition border-2 ${
                            selectedOrder?._id === order._id
                              ? 'border-orange-600 bg-orange-50'
                              : 'border-gray-200 hover:border-gray-300 bg-white'
                          }`}
                        >
                          <p className="font-semibold text-gray-900 text-sm">
                            #{order.orderNumber || order._id.slice(-6)}
                          </p>
                          <p className="text-xs text-gray-600 mt-0.5">
                            {order.cropName || 'Crop'}
                          </p>
                          <p className="text-xs text-gray-600">
                            ₹{order.totalAmount?.toLocaleString()}
                          </p>
                          <div className="flex items-center gap-1 mt-1">
                            <div className={`w-2 h-2 rounded-full ${getStatusDotColor(order.orderStatus)}`} />
                            <span className="text-xs text-gray-600 capitalize">
                              {STATUS_LABELS[order.orderStatus] || order.orderStatus?.replace(/_/g, ' ')}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </Card>
                </ScrollAnimation>
              </div>

              {/* Order Details */}
              <div className="lg:col-span-3">
                <ScrollAnimation className="scroll-slide space-y-6">
                  {selectedOrder && (
                    <>
                      {/* Status Timeline */}
                      <Card className="p-8">
                        <h3 className="font-bold text-gray-900 mb-6 text-lg">Order Status</h3>
                        <div className="space-y-8">
                          {getStatusTimeline(selectedOrder).map((status, idx, arr) => (
                            <div key={status.status} className="relative">
                              <div className="flex items-start gap-4">
                                {/* Status Indicator */}
                                <div className="relative z-10">
                                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition ${
                                    status.completed ? 'bg-green-600 text-white' :
                                    status.current ? 'bg-orange-600 text-white' :
                                    'bg-gray-200 text-gray-600'
                                  }`}>
                                    {status.icon}
                                  </div>
                                  {/* Timeline Line */}
                                  {idx < arr.length - 1 && (
                                    <div className={`absolute left-6 top-12 w-0.5 h-20 transition ${
                                      status.completed ? 'bg-green-600' : 'bg-gray-300'
                                    }`} />
                                  )}
                                </div>

                                {/* Status Info */}
                                <div className="flex-1 pt-1">
                                  <h4 className={`font-bold ${
                                    status.completed ? 'text-green-600' :
                                    status.current ? 'text-orange-600' :
                                    'text-gray-600'
                                  }`}>
                                    {status.label}
                                  </h4>
                                  {status.current && (
                                    <p className="text-sm text-gray-600 mt-1">
                                      Current status — {STATUS_LABELS[selectedOrder.orderStatus]}
                                    </p>
                                  )}
                                  {status.completed && selectedOrder.orderStatus === 'completed' && status.status === 'completed' && (
                                    <p className="text-sm text-gray-600 mt-1">
                                      Completed on {new Date(selectedOrder.completedAt || selectedOrder.updatedAt).toLocaleDateString()}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </Card>

                      {/* Order Summary */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {/* Crop Item */}
                        <Card className="p-6">
                          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <Leaf className="w-5 h-5 text-green-600" />Order Item
                          </h3>
                          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                              <div className="w-14 h-14 bg-gradient-to-br from-green-200 to-emerald-200 rounded-lg flex items-center justify-center shrink-0 text-2xl">
                                🌾
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900">{selectedOrder.cropName || 'Crop'}</p>
                                <p className="text-sm text-gray-600 mt-1">
                                  Qty: {selectedOrder.quantity} {selectedOrder.unit || 'kg'}
                                </p>
                                <p className="text-sm text-gray-600">
                                  Rate: ₹{selectedOrder.unitPrice}/{selectedOrder.unit || 'kg'}
                                </p>
                              </div>
                            </div>
                          </div>
                        </Card>

                        {/* Pricing */}
                        <Card className="p-6">
                          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <IndianRupee className="w-5 h-5 text-green-600" />Price Details
                          </h3>
                          <div className="space-y-3 text-sm">
                            <div className="flex justify-between text-gray-700">
                              <span>Quantity</span>
                              <span>{selectedOrder.quantity} {selectedOrder.unit || 'kg'}</span>
                            </div>
                            <div className="flex justify-between text-gray-700">
                              <span>Rate</span>
                              <span>₹{selectedOrder.unitPrice}/{selectedOrder.unit || 'kg'}</span>
                            </div>
                            <div className="flex justify-between text-gray-700">
                              <span>Payment Method</span>
                              <span>{selectedOrder.paymentMethod === 'razorpay' ? 'Online (Razorpay)' : (selectedOrder.paymentMethod || 'Cash on Delivery')}</span>
                            </div>
                            <div className="flex justify-between font-bold text-lg text-gray-900 pt-3 border-t border-gray-200">
                              <span>Total</span>
                              <span className="text-orange-600">₹{selectedOrder.totalAmount?.toLocaleString()}</span>
                            </div>
                          </div>
                        </Card>
                      </div>

                      {/* Pickup Location */}
                      <Card className="p-6">
                        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                          <MapPin className="w-5 h-5 text-blue-600" />Pickup Location
                        </h3>
                        <div className="bg-blue-50 p-4 rounded-lg">
                          <p className="font-semibold text-gray-900">
                            {selectedOrder.pickupLocation || 'Location not specified'}
                          </p>
                          <p className="text-sm text-gray-600 mt-2">
                            📍 Pickup from farmer's location. Coordinate with the farmer for pickup timing.
                          </p>
                        </div>
                      </Card>

                      {/* Contact Information */}
                      <Card className="p-6 bg-gradient-to-r from-blue-50 to-cyan-50">
                        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                          <User className="w-5 h-5" />Contact Information
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {selectedOrder.farmerContact && (
                            <div className="bg-white rounded-lg p-3 shadow-sm">
                              <p className="text-xs text-gray-500 mb-1">Farmer Contact</p>
                              <a
                                href={`tel:${selectedOrder.farmerContact}`}
                                className="font-semibold text-green-700 flex items-center gap-2 hover:text-green-800"
                              >
                                <Phone className="w-4 h-4" /> {selectedOrder.farmerContact}
                              </a>
                            </div>
                          )}
                          {selectedOrder.buyerContact && (
                            <div className="bg-white rounded-lg p-3 shadow-sm">
                              <p className="text-xs text-gray-500 mb-1">Buyer Contact</p>
                              <a
                                href={`tel:${selectedOrder.buyerContact}`}
                                className="font-semibold text-blue-700 flex items-center gap-2 hover:text-blue-800"
                              >
                                <Phone className="w-4 h-4" /> {selectedOrder.buyerContact}
                              </a>
                            </div>
                          )}
                        </div>
                        <div className="mt-4">
                          <Button
                            onClick={() => setShowContactModal(true)}
                            variant="outline"
                            className="flex items-center gap-2"
                          >
                            <MessageCircle className="w-4 h-4" />
                            Contact Farmer
                          </Button>
                        </div>
                      </Card>

                      {/* Actions */}
                      <div className="flex gap-3 flex-wrap">
                        {/* Mark as Picked Up - only when ready_for_pickup */}
                        {selectedOrder.orderStatus === 'ready_for_pickup' && (
                          <Button
                            onClick={handleMarkPickedUp}
                            variant="primary"
                            disabled={actionLoading}
                            className="flex-1 flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700"
                          >
                            {actionLoading ? (
                              <Loader className="w-4 h-4 animate-spin" />
                            ) : (
                              <ThumbsUp className="w-4 h-4" />
                            )}
                            Mark as Picked Up
                          </Button>
                        )}
                        {/* Mark as Completed - only when picked_up */}
                        {selectedOrder.orderStatus === 'picked_up' && (
                          <Button
                            onClick={handleMarkReceived}
                            variant="primary"
                            disabled={actionLoading}
                            className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700"
                          >
                            {actionLoading ? (
                              <Loader className="w-4 h-4 animate-spin" />
                            ) : (
                              <CheckCircle className="w-4 h-4" />
                            )}
                            Mark as Completed
                          </Button>
                        )}
                        {selectedOrder.orderStatus === 'completed' && (
                          <Button
                            onClick={() => navigate(`/order/${selectedOrder._id}`)}
                            variant="primary"
                            className="flex-1 flex items-center justify-center gap-2"
                          >
                            <CheckCircle className="w-4 h-4" />
                            View Details
                          </Button>
                        )}
                        <Button
                          onClick={() => fetchOrders()}
                          variant="outline"
                          className="flex-1 flex items-center justify-center gap-2"
                        >
                          🔄 Refresh
                        </Button>
                        <Button
                          onClick={() => navigate(`/order/${selectedOrder._id}`)}
                          variant="outline"
                          className="flex-1 flex items-center justify-center gap-2"
                        >
                          <Package className="w-4 h-4" />
                          Full Details
                        </Button>
                      </div>
                    </>
                  )}
                </ScrollAnimation>
              </div>
            </div>
          )}

          {/* Contact Modal */}
          {showContactModal && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <Card className="p-8 max-w-md w-full">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Contact Farmer</h3>
                <div className="space-y-4 mb-6">
                  {selectedOrder?.farmerContact && (
                    <a
                      href={`tel:${selectedOrder.farmerContact}`}
                      className="block w-full"
                    >
                      <Button variant="outline" className="w-full flex items-center justify-center gap-2">
                        <Phone className="w-4 h-4" /> Call {selectedOrder.farmerContact}
                      </Button>
                    </a>
                  )}
                  {selectedOrder?.farmerContact && (
                    <a
                      href={`https://wa.me/${selectedOrder.farmerContact.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full"
                    >
                      <Button variant="outline" className="w-full flex items-center justify-center gap-2">
                        <MessageCircle className="w-4 h-4" /> Send WhatsApp
                      </Button>
                    </a>
                  )}
                  {!selectedOrder?.farmerContact && (
                    <p className="text-gray-500 text-center">Farmer contact information not available</p>
                  )}
                </div>
                <Button onClick={() => setShowContactModal(false)} variant="primary" className="w-full">
                  Close
                </Button>
              </Card>
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
}
