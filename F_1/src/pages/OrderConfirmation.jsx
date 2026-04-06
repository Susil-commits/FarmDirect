import React, { useEffect } from 'react';
import { useRouter } from '../context/RouterContext';
import PageTransition from '../components/common/PageTransition.jsx';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import ScrollAnimation from '../components/common/ScrollAnimation';
import { CheckCircle, Package, Truck, MapPin, Clock } from 'lucide-react';
import '../styles/OrderConfirmation.css';

export default function OrderConfirmation() {
  const { navigate } = useRouter();

  const steps = [
    {
      number: 1,
      title: 'Order Confirmed',
      description: 'Your order has been successfully placed',
      icon: '✓',
      time: 'Just now',
      completed: true,
    },
    {
      number: 2,
      title: 'Farmer Notified',
      description: 'The farmer is preparing your fresh crops',
      icon: '👨‍🌾',
      time: 'In 2-3 hours',
      completed: false,
    },
    {
      number: 3,
      title: 'Packed & Ready',
      description: 'Your order will be packed with care',
      icon: '📦',
      time: 'Tomorrow morning',
      completed: false,
    },
    {
      number: 4,
      title: 'Out for Delivery',
      description: 'On its way to your doorstep',
      icon: '🚚',
      time: 'In 3-5 days',
      completed: false,
    },
    {
      number: 5,
      title: 'Delivered!',
      description: 'Fresh crops arrive at your home',
      icon: '🏠',
      time: 'Expected delivery date',
      completed: false,
    },
  ];

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
                Your fresh crops are being carefully prepared by the farmer and will be delivered to your doorstep soon. 
                You'll receive updates via email and SMS.
              </p>
            </div>
          </ScrollAnimation>

          {/* Order Details Card */}
          <Card className="mb-8 animate-slide-in-down" style={{ animationDelay: '0.3s' }}>
            <div className="p-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <p className="text-gray-600 text-sm mb-2">Order ID</p>
                  <p className="text-xl font-bold text-gray-900 wrap-break-word">ORD#2026031001</p>
                </div>
                <div className="text-center">
                  <p className="text-gray-600 text-sm mb-2">Order Date</p>
                  <p className="text-xl font-bold text-gray-900">Today, 2:30 PM</p>
                </div>
                <div className="text-center">
                  <p className="text-gray-600 text-sm mb-2">Estimated Delivery</p>
                  <p className="text-xl font-bold text-gray-900">3-5 Days</p>
                </div>
                <div className="text-center">
                  <p className="text-gray-600 text-sm mb-2">Total Amount</p>
                  <p className="text-xl font-bold text-green-600">₹1,245</p>
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
                    {/* Timeline Line */}
                    {idx < steps.length - 1 && (
                      <div className={`absolute left-12 top-20 w-1 h-16 ${
                        step.completed ? 'bg-green-600' : 'bg-gray-300'
                      }`} />
                    )}

                    {/* Step Circle */}
                    <div className={`relative z-10 shrink-0 w-24 h-24 rounded-full flex flex-col items-center justify-center text-3xl ${
                      step.completed
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-200 text-gray-600'
                    } transition-smooth`}>
                      <span>{step.icon}</span>
                    </div>

                    {/* Step Content */}
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

          {/* Delivery Info */}
          <Card className="mb-8 animate-slide-in-down" style={{ animationDelay: '0.5s' }}>
            <div className="p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">🚚 Delivery Details</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <MapPin className="text-green-600 shrink-0 mt-1" />
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Delivery Address</p>
                      <p className="font-semibold text-gray-900">
                        123 Farm Road, Apt 4B<br/>
                        Delhi, Delhi 110001<br/>
                        India
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <Clock className="text-green-600 shrink-0 mt-1" />
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Typical Delivery Window</p>
                      <p className="font-semibold text-gray-900">
                        10:00 AM - 6:00 PM<br/>
                        (Tuesday - Saturday)
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-blue-50 border-l-4 border-blue-400 rounded">
                <p className="text-sm text-blue-800">
                  💡 <strong>Tip:</strong> Keep your phone handy. The delivery partner will call 30 minutes before arrival.
                </p>
              </div>
            </div>
          </Card>

          {/* What's Included */}
          <Card className="mb-8 animate-slide-in-down" style={{ animationDelay: '0.6s' }}>
            <div className="p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">📦 Your Order Items</h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-4">
                    <span className="text-4xl">🍅</span>
                    <div>
                      <p className="font-bold text-gray-900">Fresh Organic Tomatoes</p>
                      <p className="text-sm text-gray-600">2 kg from Rajesh Kumar's Farm</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">₹90</p>
                    <p className="text-sm text-gray-600">₹45/kg × 2</p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-4">
                    <span className="text-4xl">🥕</span>
                    <div>
                      <p className="font-bold text-gray-900">Fresh Carrots</p>
                      <p className="text-sm text-gray-600">1 kg from Arjun Desai's Farm</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">₹50</p>
                    <p className="text-sm text-gray-600">₹50/kg × 1</p>
                  </div>
                </div>

                <div className="pt-4 border-t flex items-center justify-between">
                  <p className="font-semibold text-gray-900">Subtotal</p>
                  <p className="font-semibold text-gray-900">₹140</p>
                </div>

                <div className="flex items-center justify-between">
                  <p className="text-gray-600">Delivery</p>
                  <p className="text-gray-600">FREE (Standard)</p>
                </div>

                <div className="pt-2 border-t flex items-center justify-between text-lg">
                  <p className="font-bold text-gray-900">Total</p>
                  <p className="font-bold text-green-600">₹140</p>
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
                  <div className="text-2xl">📧</div>
                  <div>
                    <p className="font-semibold text-gray-900">Confirmation Email</p>
                    <p className="text-gray-600">Check your inbox for order details and farmer info</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="text-2xl">📱</div>
                  <div>
                    <p className="font-semibold text-gray-900">Real-time Updates</p>
                    <p className="text-gray-600">SMS updates as your order progresses through each stage</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="text-2xl">⭐</div>
                  <div>
                    <p className="font-semibold text-gray-900">Rate & Review</p>
                    <p className="text-gray-600">After delivery, share your experience to help other buyers</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="text-2xl">💬</div>
                  <div>
                    <p className="font-semibold text-gray-900">Message Farmer</p>
                    <p className="text-gray-600">Questions? Message the farmer directly through our app</p>
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
              📞 Call us at 1800-FRESH-01 or email support@farmfresh.com
            </p>
            <Button variant="outline" size="sm" className="inline-block">
              Contact Support
            </Button>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
