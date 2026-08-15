import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from '../context/RouterContext';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../context/ToastContext';
import { useRealtime } from '../context/RealtimeContext';
import PageTransition from '../components/common/PageTransition';
import Card from '../components/common/Card';
import ScrollAnimation from '../components/common/ScrollAnimation';
import Button from '../components/common/Button';
import { orderService } from '../services/appService';
import paymentService from '../services/paymentService';
import {
  Package, Truck, CheckCircle, Clock, MapPin, Phone,
  Calendar, IndianRupee, AlertCircle, Leaf, ThumbsUp, Loader
} from 'lucide-react';
import '../styles/OrderDetails.css';
import { getImageUrl } from '../utils/formatters';
import SkeletonLoader from '../components/common/SkeletonLoader';
import ErrorBoundary from '../components/common/ErrorBoundary';
const ORDER_STATUS_FLOW = ['confirmed', 'preparing', 'ready_for_pickup', 'picked_up', 'completed'];

const STATUS_LABELS = {
  confirmed: 'Confirmed',
  preparing: 'Preparing',
  ready_for_pickup: 'Ready for Pickup',
  picked_up: 'Picked Up',
  completed: 'Completed',
  cancelled: 'Cancelled'
};

const STATUS_COLORS = {
  confirmed: 'bg-blue-100 text-blue-800 border-blue-300',
  preparing: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  ready_for_pickup: 'bg-orange-100 text-orange-800 border-orange-300',
  picked_up: 'bg-purple-100 text-purple-800 border-purple-300',
  completed: 'bg-green-100 text-green-800 border-green-300',
  cancelled: 'bg-red-100 text-red-800 border-red-300'
};

export default function OrderDetails() {
  const { navigate, params } = useRouter();
  const { user } = useAuth();
  const orderId = params.id;
  const { addToast } = useToast();
  const { orderEvent } = useRealtime();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchOrderDetails = useCallback(async () => {
    try {
      setLoading(true);
      
      const response = await orderService.getOrderDetails(orderId);
      setOrder(response.order);
    } catch {
      addToast('Failed to load order details', 'error');
    } finally {
      setLoading(false);
    }
  }, [orderId, addToast]);

  useEffect(() => {
    window.scrollTo(0, 0);
     
    fetchOrderDetails();
  }, [orderId, fetchOrderDetails]);

  useEffect(() => {
    if (!orderEvent) return;
    if (String(orderEvent.orderId) !== String(orderId)) return;
    
    setOrder((prev) =>
      prev
        ? {
            ...prev,
            orderStatus: orderEvent.orderStatus,
            updatedAt: orderEvent.updatedAt,
          }
        : prev
    );
    const t = setTimeout(() => fetchOrderDetails(), 400);
    return () => clearTimeout(t);
  }, [orderEvent, orderId, fetchOrderDetails]);

  const isBuyer = user?.role === 'buyer';

  const handleMarkPickedUp = async () => {
    setActionLoading(true);
    try {
      await orderService.updateOrderStatus(orderId, 'picked_up');
      addToast('Order marked as picked up! Complete by marking as received.', 'success');
      await fetchOrderDetails();
    } catch (err) {
      addToast(err?.message || 'Failed to mark as picked up', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkReceived = async () => {
    setActionLoading(true);
    try {
      await orderService.markOrderReceived(orderId);
      addToast('Order marked as completed! Thank you for your purchase.', 'success');
      await fetchOrderDetails();
    } catch (err) {
      addToast(err?.message || 'Failed to mark as received', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const isRazorpayPending =
    order?.paymentMethod === 'razorpay' &&
    order?.paymentStatus !== 'completed' &&
    order?.orderStatus !== 'cancelled';

  const handlePayNow = async () => {
    setActionLoading(true);
    try {
      const init = await paymentService.initializeRazorpayPayment(order._id);

      await paymentService.openRazorpayCheckout({
        keyId: init.keyId,
        razorpayOrderId: init.razorpayOrderId,
        amount: init.amount,
        name: 'FarmDirect',
        description: `Payment for ${order.cropName || 'order'}`,
        prefill: {
          name: `${user?.firstName || ''} ${user?.lastName || ''}`.trim(),
          email: user?.email || '',
          contact: user?.phone || '',
        },
        onSuccess: async (response) => {
          try {
            await paymentService.verifyRazorpayPayment({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            addToast('Payment successful! Order is now confirmed.', 'success');
            await fetchOrderDetails();
          } catch (verr) {
            addToast(verr?.message || 'Payment verification failed.', 'error');
          } finally {
            setActionLoading(false);
          }
        },
        onDismiss: () => {
          addToast('Payment cancelled. You can retry anytime.', 'warning');
          setActionLoading(false);
        },
        onFailure: (err) => {
          if (err?.metadata?.order_id) {
            paymentService.reportRazorpayFailure(err.metadata.order_id, err.description).catch(() => {});
          }
          addToast(err?.description || 'Payment failed. Please try again.', 'error');
          setActionLoading(false);
        },
      });
    } catch (err) {
      addToast(err?.message || 'Failed to start payment.', 'error');
      setActionLoading(false);
    }
  };

  const getStatusStep = (orderStatus) => {
    if (orderStatus === 'cancelled') return -1;
    const idx = ORDER_STATUS_FLOW.indexOf(orderStatus);
    return idx >= 0 ? idx : 0;
  };

  if (loading) {
    return (
      <PageTransition>
        <SkeletonLoader variant="detail" />
      </PageTransition>
    );
  }

  if (!order) {
    return (
      <PageTransition>
        <div className="min-h-screen bg-gradient-to-br from-white via-green-50 to-white px-4 pt-28 pb-12">
          <div className="max-w-4xl mx-auto">
            <Card className="p-12 text-center">
              <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Not Found</h2>
              <p className="text-gray-600 mb-6">The order doesn't exist or has been deleted.</p>
              <Button onClick={() => navigate('/orders')} variant="primary">
                View My Orders
              </Button>
            </Card>
          </div>
        </div>
      </PageTransition>
    );
  }

  const isCancelled = order.orderStatus === 'cancelled';
  const isCompleted = order.orderStatus === 'completed';

  return (
    <ErrorBoundary>
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-br from-white via-green-50 to-white px-4 pt-28 pb-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <ScrollAnimation className="scroll-slide mb-8">
            <button
              onClick={() => {
                const userRole = JSON.parse(localStorage.getItem('userData') || '{}').role;
                if (userRole === 'farmer') navigate('/farmer/dashboard');
                else if (userRole === 'buyer') navigate('/buyer/dashboard');
                else navigate('/orders');
              }}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 transition mb-4 cursor-pointer"
            >
              ← Back
            </button>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Order Details</h1>
            <p className="text-gray-600">
              Order #{order.orderNumber || order._id?.slice(-6)}
            </p>
          </ScrollAnimation>

          {/* Order Summary */}
          <ScrollAnimation className="scroll-slide mb-8">
            <Card className="p-6 md:p-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6 pb-6 border-b border-gray-200">
                <div>
                  <h3 className="text-sm font-semibold text-gray-600 mb-2">Order Status</h3>
                  <span className={`inline-block px-4 py-2 rounded-lg font-semibold text-sm border ${STATUS_COLORS[order.orderStatus] || 'bg-gray-100 text-gray-800'}`}>
                    {STATUS_LABELS[order.orderStatus] || order.orderStatus}
                  </span>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-600 mb-2">Payment Method</h3>
                  <div className="flex items-center gap-2">
                    <IndianRupee className="w-5 h-5 text-green-600" />
                    <span className="font-semibold text-gray-900">
                      {order.paymentMethod === 'razorpay' ? 'Online (Razorpay)' : (order.paymentMethod || 'Cash on Delivery')}
                    </span>
                    {order.paymentStatus === 'completed' ? (
                      <span className="ml-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700 border border-green-200">Paid</span>
                    ) : order.paymentStatus === 'failed' ? (
                      <span className="ml-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700 border border-red-200">Failed</span>
                    ) : (
                      <span className="ml-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700 border border-yellow-200">Pending</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Order Date</p>
                  <p className="font-semibold text-gray-900 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    {new Date(order.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Crop</p>
                  <p className="font-semibold text-gray-900 flex items-center gap-2">
                    <Leaf className="w-4 h-4 text-green-600" />
                    {order.cropName || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Amount</p>
                  <p className="font-semibold text-gray-900 flex items-center gap-1 text-lg">
                    <IndianRupee className="w-5 h-5" />
                    {order.totalAmount?.toLocaleString()}
                  </p>
                </div>
              </div>
            </Card>
          </ScrollAnimation>

          {/* Pending Online Payment - Pay Now */}
          {isBuyer && isRazorpayPending && (
            <ScrollAnimation className="scroll-slide mb-8">
              <Card className="p-6 md:p-8 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200">
                <h2 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <IndianRupee className="w-5 h-5 text-blue-600" />
                  Payment Pending
                </h2>
                <p className="text-sm text-gray-600 mb-4">
                  Your order is placed but payment is pending. Complete payment now to confirm your order.
                </p>
                <Button
                  onClick={handlePayNow}
                  variant="primary"
                  disabled={actionLoading}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                >
                  {actionLoading ? (
                    <Loader className="w-4 h-4 animate-spin" />
                  ) : (
                    <IndianRupee className="w-4 h-4" />
                  )}
                  Pay ₹{order.totalAmount?.toLocaleString()} Now
                </Button>
              </Card>
            </ScrollAnimation>
          )}

          {/* Status Progress Bar */}
          {!isCancelled && (
            <ScrollAnimation className="scroll-slide mb-8">
              <Card className="p-6 md:p-8">
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <Truck className="w-5 h-5" />
                  Order Progress
                </h2>
                <div className="flex items-center gap-1">
                  {ORDER_STATUS_FLOW.map((status, idx) => {
                    const currentStep = getStatusStep(order.orderStatus);
                    const stepCompleted = idx <= currentStep;
                    const isCurrent = idx === currentStep;
                    return (
                      <React.Fragment key={status}>
                        <div className="flex flex-col items-center flex-1">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                              stepCompleted
                                ? 'bg-green-500 text-white'
                                : 'bg-gray-200 text-gray-500'
                            } ${isCurrent ? 'ring-2 ring-green-300 ring-offset-2' : ''}`}
                            title={STATUS_LABELS[status]}
                          >
                            {stepCompleted ? '✓' : idx + 1}
                          </div>
                          <span className="hidden sm:block text-xs text-gray-500 mt-2 text-center leading-tight">
                            {STATUS_LABELS[status]}
                          </span>
                        </div>
                        {idx < ORDER_STATUS_FLOW.length - 1 && (
                          <div
                            className={`h-0.5 flex-1 mt-5 ${
                              idx < currentStep ? 'bg-green-500' : 'bg-gray-200'
                            }`}
                          />
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              </Card>
            </ScrollAnimation>
          )}

          {/* Order Item Details */}
          <ScrollAnimation className="scroll-slide mb-8">
            <Card className="p-6 md:p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Package className="w-6 h-6" />
                Order Item
              </h2>
              
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-6">
                <div className="flex items-start gap-4">
                  <div className="w-20 h-20 bg-gradient-to-br from-green-200 to-emerald-200 rounded-lg flex items-center justify-center shrink-0 text-3xl overflow-hidden">
                    {order.cropId?.images?.[0] ? (
                      <img
                        src={getImageUrl(order.cropId.images[0])}
                        alt={order.cropName || 'Crop'}
                        className="w-full h-full object-cover"
                        onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                      />
                    ) : null}
                    <span style={{ display: order.cropId?.images?.[0] ? 'none' : 'flex' }} className="w-full h-full items-center justify-center">🌾</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900">{order.cropName || 'Crop'}</h3>
                    <div className="grid grid-cols-2 gap-4 mt-3">
                      <div>
                        <p className="text-sm text-gray-500">Quantity</p>
                        <p className="font-semibold text-gray-900">{order.quantity} {order.unit || 'kg'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Rate</p>
                        <p className="font-semibold text-gray-900">₹{order.unitPrice}/{order.unit || 'kg'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-green-200">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700 font-semibold">Total Amount</span>
                    <span className="text-2xl font-bold text-green-700 flex items-center gap-1">
                      <IndianRupee className="w-5 h-5" />
                      {order.totalAmount?.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          </ScrollAnimation>

          {/* Pickup Location & Contact */}
          <ScrollAnimation className="scroll-slide mb-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Pickup Location */}
              <Card className="p-6 md:p-8">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-blue-600" />
                  Pickup Location
                </h2>
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="font-semibold text-gray-900">{order.pickupLocation || 'Location not specified'}</p>
                  <p className="text-sm text-gray-600 mt-2">
                    📍 Pickup from farmer's location. Coordinate with the farmer for pickup timing.
                  </p>
                </div>
              </Card>

              {}
              <Card className="p-6 md:p-8">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Phone className="w-5 h-5 text-green-600" />
                  Contact Information
                </h2>
                <div className="space-y-3">
                  {order.farmerContact && (
                    <div className="bg-green-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500 mb-1">Farmer Contact</p>
                      <a
                        href={`tel:${order.farmerContact}`}
                        className="font-semibold text-green-700 flex items-center gap-2 hover:text-green-800"
                      >
                        <Phone className="w-4 h-4" /> {order.farmerContact}
                      </a>
                    </div>
                  )}
                  {order.buyerContact && (
                    <div className="bg-blue-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500 mb-1">Buyer Contact</p>
                      <a
                        href={`tel:${order.buyerContact}`}
                        className="font-semibold text-blue-700 flex items-center gap-2 hover:text-blue-800"
                      >
                        <Phone className="w-4 h-4" /> {order.buyerContact}
                      </a>
                    </div>
                  )}
                  {!order.farmerContact && !order.buyerContact && (
                    <p className="text-gray-500 text-sm">Contact information not available</p>
                  )}
                </div>
              </Card>
            </div>
          </ScrollAnimation>

          {}
          {isBuyer && !isCancelled && !isCompleted && (
            <ScrollAnimation className="scroll-slide mb-8">
              <Card className="p-6 md:p-8 bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Truck className="w-5 h-5 text-orange-600" />
                  Update Order Status
                </h2>
                <div className="flex gap-4 flex-wrap">
                  {order.orderStatus === 'ready_for_pickup' && (
                    <Button
                      onClick={handleMarkPickedUp}
                      variant="primary"
                      disabled={actionLoading}
                      className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700"
                    >
                      {actionLoading ? (
                        <Loader className="w-4 h-4 animate-spin" />
                      ) : (
                        <ThumbsUp className="w-4 h-4" />
                      )}
                      Mark as Picked Up
                    </Button>
                  )}
                  {order.orderStatus === 'picked_up' && (
                    <Button
                      onClick={handleMarkReceived}
                      variant="primary"
                      disabled={actionLoading}
                      className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                    >
                      {actionLoading ? (
                        <Loader className="w-4 h-4 animate-spin" />
                      ) : (
                        <CheckCircle className="w-4 h-4" />
                      )}
                      Mark as Completed
                    </Button>
                  )}
                  {order.orderStatus !== 'ready_for_pickup' && order.orderStatus !== 'picked_up' && (
                    <p className="text-gray-600 text-sm">
                      Action buttons will appear when the farmer updates the order status to "Ready for Pickup".
                    </p>
                  )}
                </div>
              </Card>
            </ScrollAnimation>
          )}

          {}
          {isCancelled && (
            <ScrollAnimation className="scroll-slide mb-8">
              <Card className="p-6 md:p-8 bg-red-50 border-2 border-red-200">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-6 h-6 text-red-600 shrink-0" />
                  <div>
                    <h3 className="font-bold text-red-900">Order Cancelled</h3>
                    <p className="text-sm text-red-700">
                      This order was cancelled on {new Date(order.updatedAt).toLocaleDateString()}.
                    </p>
                  </div>
                </div>
              </Card>
            </ScrollAnimation>
          )}

          {}
          {isCompleted && (
            <ScrollAnimation className="scroll-slide mb-8">
              <Card className="p-6 md:p-8 bg-green-50 border-2 border-green-200">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-6 h-6 text-green-600 shrink-0" />
                  <div>
                    <h3 className="font-bold text-green-900">Order Completed</h3>
                    <p className="text-sm text-green-700">
                      This order was completed on {new Date(order.completedAt || order.updatedAt).toLocaleDateString()}.
                    </p>
                  </div>
                </div>
              </Card>
            </ScrollAnimation>
          )}

          {}
          <ScrollAnimation className="scroll-slide">
            <Card className="p-6 md:p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Clock className="w-6 h-6" />
                Order Timeline
              </h2>

              {order.timeline && order.timeline.length > 0 ? (
                <div className="space-y-4">
                  {order.timeline.map((event, idx) => (
                    <div key={idx} className="flex gap-4">
                      <div className="w-3 h-3 rounded-full bg-green-600 mt-2 shrink-0"></div>
                      <div className="pb-4 flex-1 border-b border-gray-200 last:border-0">
                        <p className="font-semibold text-gray-900 capitalize">
                          {(event.event || event.status)?.replace(/_/g, ' ')}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                        <p className="text-xs text-gray-500 mt-2">
                          {new Date(event.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No timeline events yet</p>
                </div>
              )}
            </Card>
          </ScrollAnimation>
        </div>
      </div>
    </PageTransition>
    </ErrorBoundary>
  );
}
