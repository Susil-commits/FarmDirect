import React, { useState, useEffect } from 'react';
import { useRouter } from '../context/RouterContext';
import PageTransition from '../components/common/PageTransition.jsx';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import ScrollAnimation from '../components/common/ScrollAnimation';
import { CheckCircle, Package, Truck, MapPin, Clock, Loader, AlertCircle, Phone } from 'lucide-react';
import { orderService } from '../services/appService';
import '../styles/OrderConfirmation.css';

const STATUS_LABELS = {
  confirmed: 'Confirmed',
  preparing: 'Preparing',
  ready_for_pickup: 'Ready for Pickup',
  picked_up: 'Picked Up',
  completed: 'Completed',
  cancelled: 'Cancelled'
};

export default function OrderConfirmation() {
  const { navigate } = useRouter();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchOrderData();
  }, []);

  const fetchOrderData = async () => {
    try {
      const orderId = localStorage.getItem('lastOrderId');
      if (!orderId) {
        setError('No recent order found. Please place an order first.');
        setLoading(false);
        return;
      }

      // api.js interceptor unwraps to response.data, so response = { order: {...} }
      const response = await orderService.getOrderById(orderId);
      const orderData = response.order;
      setOrder(orderData);
      localStorage.removeItem('lastOrderId');
    } catch (err) {
      console.error('Failed to fetch order:', err);
      setError('Could not load order details. Your order has been placed successfully.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getOrderTimeline = () => {
    const steps = [
      {
        number: 1,
        title: 'Order Confirmed',
        description: 'Your order has been successfully placed',
        icon: '✓',
        time: order?.createdAt ? `${formatDate(order.createdAt)}, ${formatTime(order.createdAt)}` : 'Just now',
        completed: true,
        status: 'confirmed',
      },
      {
        number: 2,
        title: 'Farmer Preparing',
        description: 'The farmer is preparing your fresh crops',
        icon: '👨‍🌾',
        time: 'After confirmation',
        completed: order?.timeline?.some(t => t.status === 'preparing'),
        status: 'preparing',
      },
      {
        number: 3,
        title: 'Ready for Pickup',
        description: 'Your order is packed and ready for pickup',
        icon: '📦',
        time: 'At the pickup location',
        completed: order?.timeline?.some(t => t.status === 'ready_for_pickup'),
        status: 'ready_for_pickup',
      },
      {
        number: 4,
        title: 'Picked Up',
        description: 'Order has been picked up by the buyer',
        icon: '🚚',
        time: order?.timeline?.find(t => t.status === 'picked_up')?.timestamp
          ? formatDate(order.timeline.find(t => t.status === 'picked_up').timestamp)
          : 'After pickup',
        completed: order?.timeline?.some(t => t.status === 'picked_up'),
        status: 'picked_up',
      },
      {
        number: 5,
        title: 'Completed!',
        description: 'Order successfully completed',
        icon: '✅',
        time: order?.completedAt ? formatDate(order.completedAt) : 'After delivery',
        completed: order?.orderStatus === 'completed',
        status: 'completed',
      },
    ];
    return steps;
  };

  const getItemEmoji = (cropName) => {
    const name = (cropName || '').toLowerCase();
    if (name.includes('tomato')) return '🍅';
    if (name.includes('carrot')) return '🥕';
    if (name.includes('potato')) return '🥔';
    if (name.includes('onion')) return '🧅';
    if (name.includes('rice')) return '🍚';
    if (name.includes('wheat')) return '🌾';
    if (name.includes('mango')) return '🥭';
    if (name.includes('banana')) return '🍌';
    if (name.includes('apple')) return '🍎';
    if (name.includes('corn') || name.includes('maize')) return '🌽';
    if (name.includes('chili') || name.includes('chilli')) return '🌶️';
    if (name.includes('leaf') || name.includes('spinach') || name.includes('green')) return '🥬';
    if (name.includes('cucumber')) return '🥒';
    if (name.includes('eggplant') || name.includes('brinjal')) return '🍆';
    return '🌱';
  };

  if (loading) {
    return (
      <PageTransition>
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-green-100 py-12 px-4 flex items-center justify-center">
          <div className="text-center">
            <Loader size={48} className="animate-spin text-green-600 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">Loading your order details...</p>
          </div>
        </div>
      </PageTransition>
    );
  }

  if (error || !order) {
    return (
      <PageTransition>
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-green-100 py-12 px-4">
          <div className="max-w-2xl mx-auto text-center">
            <div className="mb-6 flex justify-center">
              <div className="bg-amber-100 text-amber-600 w-24 h-24 rounded-full flex items-center justify-center">
                <AlertCircle size={56} />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Order Not Found</h1>
            <p className="text-gray-600 mb-8">{error || 'No order details available.'}</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="primary" size="lg" onClick={() => navigate('/marketplace')}>
                Browse Marketplace
              </Button>
              <Button variant="secondary" size="lg" onClick={() => navigate('/orders')}>
                View My Orders
              </Button>
            </div>
          </div>
        </div>
      </PageTransition>
    );
  }

  const steps = getOrderTimeline();
  const currentStatus = order.orderStatus || 'confirmed';

  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-green-100 py-12 px-4 relative">
        <div className="max-w-4xl mx-auto relative z-10">
          
          {/* Success Message */}
          <ScrollAnimation className="scroll-slide mb-12">
            <div className="text-center">
              <div className="mb-6 flex justify-center">
                <div className="relative">
                  <div className="absolute inset-0 bg-green-400 rounded-full animate-ping opacity-75"></div>
                  <div className="relative bg-green-600 text-white w-24 h-24 rounded-full flex items-center justify-center">
                    <CheckCircle size={56} />
                  </div>
                </div>
              </div>
              
              <h1 className="text-4xl font-bold text-gray-900 mb-3 animate-slide-in-down">
                🎉 Order Confirmed!
              </h1>
              <p className="text-xl text-gray-700 mb-2 animate-slide-in-down" style={{ animationDelay: '0.1s' }}>
                Thank you for your order
              </p>
              <p className="text-gray-600 max-w-2xl mx-auto animate-slide-in-down" style={{ animationDelay: '0.2s' }}>
                The farmer will prepare your fresh crops. You can pick them up from the farm location.
                Coordinate with the farmer for pickup timing.
              </p>
            </div>
          </ScrollAnimation>

          {/* Order Details Card */}
          <Card className="mb-8 animate-slide-in-down" style={{ animationDelay: '0.3s' }}>
            <div className="p-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <p className="text-gray-600 text-sm mb-2">Order ID</p>
                  <p className="text-xl font-bold text-gray-900 wrap-break-word">
                    {order.orderNumber || `ORD-${(order._id || '').slice(-8).toUpperCase()}`}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-gray-600 text-sm mb-2">Order Date</p>
                  <p className="text-xl font-bold text-gray-900">
                    {formatDate(order.createdAt)}<br />
                    <span className="text-sm text-gray-500">{formatTime(order.createdAt)}</span>
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-gray-600 text-sm mb-2">Status</p>
                  <p className="text-xl font-bold text-blue-600">
                    {STATUS_LABELS[currentStatus] || currentStatus}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-gray-600 text-sm mb-2">Total Amount</p>
                  <p className="text-xl font-bold text-green-600">
                    ₹{(order.totalAmount || 0).toLocaleString('en-IN')}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Timeline */}
          <Card className="mb-8 animate-slide-in-down" style={{ animationDelay: '0.4s' }}>
            <div className="p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-8">📍 Tracking Your Order</h2>
              
              <div className="space-y-6">
                {steps.map((step, idx) => (
                  <div key={idx} className="flex gap-6 relative stagger-item" style={{ animationDelay: `${idx * 0.1}s` }}>
                    {idx < steps.length - 1 && (
                      <div className={`absolute left-12 top-20 w-1 h-16 ${
                        step.completed ? 'bg-green-600' : 'bg-gray-300'
                      }`} />
                    )}

                    <div className={`relative z-10 shrink-0 w-24 h-24 rounded-full flex flex-col items-center justify-center text-3xl ${
                      step.completed
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-200 text-gray-600'
                    } transition-smooth`}>
                      <span>{step.icon}</span>
                    </div>

                    <div className="pt-4 flex-1">
                      <h3 className="text-xl font-bold text-gray-900 mb-1">{step.title}</h3>
                      <p className="text-gray-600 mb-3">{step.description}</p>
                      <p className={`text-sm font-semibold ${
                        step.completed ? 'text-green-600' : 'text-gray-500'
                      }`}>
                        ⏱️ {step.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Pickup & Order Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            {/* Pickup Location */}
            <Card className="animate-slide-in-down" style={{ animationDelay: '0.5s' }}>
              <div className="p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">📍 Pickup Location</h2>
                
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <MapPin className="text-green-600 shrink-0 mt-1" />
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Farm Pickup Address</p>
                      <p className="font-semibold text-gray-900">
                        {order.pickupLocation || 'Location not specified'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <Phone className="text-green-600 shrink-0 mt-1" />
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Farmer Contact</p>
                      <p className="font-semibold text-gray-900">
                        {order.farmerContact ? (
                          <a href={`tel:${order.farmerContact}`} className="text-blue-600 hover:underline">
                            {order.farmerContact}
                          </a>
                        ) : 'Contact not available'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-blue-50 border-l-4 border-blue-400 rounded">
                  <p className="text-sm text-blue-800">
                    💡 <strong>Tip:</strong> Contact the farmer directly to coordinate your pickup time. The farmer's contact number is provided above.
                  </p>
                </div>
              </div>
            </Card>

            {/* Buyer Contact Info */}
            <Card className="animate-slide-in-down" style={{ animationDelay: '0.55s' }}>
              <div className="p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">👤 Your Information</h2>
                
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <Phone className="text-green-600 shrink-0 mt-1" />
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Your Contact Number</p>
                      <p className="font-semibold text-gray-900">
                        {order.buyerContact || 'Not provided'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Order Item */}
          <Card className="mb-8 animate-slide-in-down" style={{ animationDelay: '0.6s' }}>
            <div className="p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">📦 Your Order Item</h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-6 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-green-100 flex items-center justify-center shrink-0">
                      {order.cropId?.images?.[0] ? (
                        <img
                          src={order.cropId.images[0]}
                          alt={order.cropName || 'Crop Item'}
                          className="w-full h-full object-cover"
                          onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                        />
                      ) : null}
                      <span
                        className="text-3xl"
                        style={{ display: order.cropId?.images?.[0] ? 'none' : 'flex' }}
                      >
                        {getItemEmoji(order.cropName)}
                      </span>
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 text-lg">{order.cropName || 'Crop Item'}</p>
                      <p className="text-sm text-gray-600">
                        {order.quantity} kg
                        {order.pickupLocation && ` • ${order.pickupLocation}`}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900 text-lg">
                      ₹{(order.totalAmount || 0).toLocaleString('en-IN')}
                    </p>
                    <p className="text-sm text-gray-600">
                      ₹{(order.unitPrice || 0).toLocaleString('en-IN')}/kg × {order.quantity} kg
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Next Steps */}
          <Card className="mb-8 animate-slide-in-down" style={{ animationDelay: '0.7s' }}>
            <div className="p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">What Happens Next?</h2>
              
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="text-2xl">📱</div>
                  <div>
                    <p className="font-semibold text-gray-900">Contact the Farmer</p>
                    <p className="text-gray-600">Call the farmer to coordinate pickup timing and details</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="text-2xl">📦</div>
                  <div>
                    <p className="font-semibold text-gray-900">Farmer Prepares Order</p>
                    <p className="text-gray-600">The farmer will prepare your fresh crops and update the order status</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="text-2xl">🚗</div>
                  <div>
                    <p className="font-semibold text-gray-900">Pick Up Your Order</p>
                    <p className="text-gray-600">Visit the farm pickup location and collect your fresh crops</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="text-2xl">⭐</div>
                  <div>
                    <p className="font-semibold text-gray-900">Rate & Review</p>
                    <p className="text-gray-600">After completing the order, share your experience to help other buyers</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Action Buttons */}
          <ScrollAnimation className="scroll-slide">
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                variant="secondary"
                size="lg"
                onClick={() => navigate('/marketplace')}
                className="flex-1"
              >
                Continue Shopping
              </Button>
              <Button
                variant="primary"
                size="lg"
                onClick={() => navigate('/orders')}
                className="flex-1"
              >
                View My Orders
              </Button>
            </div>
          </ScrollAnimation>

          {/* Help Section */}
          <div className="mt-12 p-6 bg-amber-50 border border-amber-200 rounded-lg text-center animate-slide-in-down" style={{ animationDelay: '0.8s' }}>
            <p className="text-amber-900 font-medium mb-2">Have questions?</p>
            <p className="text-amber-800 text-sm mb-4">
              📞 Contact the farmer directly using the phone number provided above
            </p>
            <Button variant="outline" size="sm" onClick={() => navigate('/support')}>
              Contact Support
            </Button>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
