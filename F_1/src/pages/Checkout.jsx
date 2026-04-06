import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useRouter } from '../context/RouterContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import PageTransition from '../components/common/PageTransition.jsx';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import ScrollAnimation from '../components/common/ScrollAnimation';
import { MapPin, Truck, CreditCard, CheckCircle, AlertCircle } from 'lucide-react';
import '../styles/Checkout.css';

export default function Checkout() {
  const { cart, getTotalPrice, clearCart, completeOrder } = useCart();
  const { navigate } = useRouter();
  const { user } = useAuth();
  const { addToast } = useToast();

  const [step, setStep] = useState('address'); // address, delivery, payment, confirmation
  const [address, setAddress] = useState({
    street: '',
    city: '',
    state: '',
    zipcode: '',
    phone: '',
  });
  const [delivery, setDelivery] = useState('standard'); // standard, express
  const [payment, setPayment] = useState('cod'); // cod, card, upi
  const [errors, setErrors] = useState({});
  const [isProcessing, setIsProcessing] = useState(false);

  // Pre-fill user address if available
  useEffect(() => {
    if (user) {
      setAddress({
        street: user.address || '',
        city: user.city || '',
        state: user.state || '',
        zipcode: user.zipcode || '',
        phone: user.phone || '',
      });
    }
  }, [user]);

  const validateAddress = () => {
    const newErrors = {};
    if (!address.street.trim()) newErrors.street = 'Street address is required';
    if (!address.city.trim()) newErrors.city = 'City is required';
    if (!address.state.trim()) newErrors.state = 'State is required';
    if (!address.zipcode.match(/^\d{6}$/)) newErrors.zipcode = 'Valid 6-digit postal code is required';
    if (!address.phone.match(/^\d{10}$/)) newErrors.phone = 'Valid 10-digit phone number is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddressSubmit = () => {
    if (validateAddress()) {
      setStep('delivery');
      setErrors({});
      addToast('Delivery address saved', 'success');
    } else {
      addToast('Please fix the errors below', 'error');
    }
  };

  const deliveryOptions = [
    {
      id: 'standard',
      name: 'Standard Delivery',
      icon: '🚚',
      time: '3-5 business days',
      price: 40,
      description: 'Free for orders above ₹500',
    },
    {
      id: 'express',
      name: 'Express Delivery',
      icon: '⚡',
      time: '1-2 business days',
      price: 150,
      description: 'Faster delivery to your doorstep',
    },
  ];

  const paymentOptions = [
    {
      id: 'cod',
      name: 'Pay on Delivery',
      icon: '🏠',
      description: 'Pay when your order arrives',
    },
    {
      id: 'card',
      name: 'Credit/Debit Card',
      icon: '💳',
      description: 'Secure payment with card',
    },
    {
      id: 'upi',
      name: 'UPI Transfer',
      icon: '📱',
      description: 'Instant payment via UPI',
    },
  ];

  const selectedDelivery = deliveryOptions.find(d => d.id === delivery);
  const totalPrice = getTotalPrice();
  const deliveryCost = delivery === 'express' ? selectedDelivery.price : (totalPrice > 500 ? 0 : 40);
  const finalTotal = totalPrice + deliveryCost;

  const handlePlaceOrder = async () => {
    setIsProcessing(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      addToast('Order placed successfully! 🎉', 'success');
      completeOrder();
      
      // Redirect to order confirmation
      setTimeout(() => {
        navigate('/order-confirmation');
      }, 500);
    } catch (error) {
      addToast('Failed to place order. Please try again.', 'error');
      setIsProcessing(false);
    }
  };

  if (cart.length === 0) {
    return (
      <PageTransition>
        <div className="min-h-screen bg-linear-to-br from-white via-green-50 to-white py-12 px-4">
          <div className="max-w-2xl mx-auto">
            <Card animated={false}>
              <div className="p-12 text-center">
                <div className="text-6xl mb-4">🛒</div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h1>
                <p className="text-gray-600 mb-6">Add items to your cart before checking out</p>
                <Button onClick={() => navigate('/marketplace')} variant="primary">
                  Continue Shopping
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-linear-to-br from-white via-green-50 to-white py-12 px-4 relative">
        <div className="absolute inset-0 premium-gradient pointer-events-none"></div>
        <div className="max-w-6xl mx-auto relative z-10">
          
          {/* Header */}
          <ScrollAnimation className="scroll-slide mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Complete Your Order</h1>
            <p className="text-gray-600 text-lg">Simple checkout in 3 easy steps</p>
          </ScrollAnimation>

          {/* Step Indicator */}
          <div className="mb-8">
            <div className="flex items-center justify-between max-w-3xl">
              {['address', 'delivery', 'payment'].map((s, idx) => (
                <React.Fragment key={s}>
                  <div
                    className={`flex items-center justify-center w-10 h-10 rounded-full font-bold transition-smooth cursor-pointer ${
                      step === s
                        ? 'bg-green-600 text-white'
                        : ['address', 'delivery', 'payment'].indexOf(step) > idx
                        ? 'bg-green-100 text-green-600'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                    onClick={() => {
                      if (['address', 'delivery', 'payment'].indexOf(step) >= idx) {
                        setStep(s);
                      }
                    }}
                  >
                    {['address', 'delivery', 'payment'].indexOf(step) > idx ? '✓' : idx + 1}
                  </div>
                  {idx < 2 && (
                    <div
                      className={`flex-1 h-1 mx-2 rounded transition-smooth ${
                        ['address', 'delivery', 'payment'].indexOf(step) > idx
                          ? 'bg-green-600'
                          : 'bg-gray-300'
                      }`}
                    />
                  )}
                </React.Fragment>
              ))}
            </div>
            <div className="flex justify-between mt-2 max-w-3xl text-sm font-medium text-gray-600">
              <span>📍 Address</span>
              <span>🚚 Delivery</span>
              <span>💳 Payment</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              
              {/* STEP 1: Address */}
              {step === 'address' && (
                <ScrollAnimation className="scroll-slide">
                  <Card className="animate-slide-in-left">
                    <div className="p-8">
                      <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <MapPin size={28} className="text-green-600" />
                        Delivery Address
                      </h2>

                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Street Address</label>
                          <input
                            type="text"
                            value={address.street}
                            onChange={(e) => setAddress({ ...address, street: e.target.value })}
                            placeholder="e.g., 123 Farm Road"
                            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition ${
                              errors.street
                                ? 'border-red-500 focus:ring-red-400'
                                : 'border-gray-300 focus:ring-green-400'
                            }`}
                          />
                          {errors.street && <p className="text-red-600 text-sm mt-1">{errors.street}</p>}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">City</label>
                            <input
                              type="text"
                              value={address.city}
                              onChange={(e) => setAddress({ ...address, city: e.target.value })}
                              placeholder="e.g., Delhi"
                              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition ${
                                errors.city
                                  ? 'border-red-500 focus:ring-red-400'
                                  : 'border-gray-300 focus:ring-green-400'
                              }`}
                            />
                            {errors.city && <p className="text-red-600 text-sm mt-1">{errors.city}</p>}
                          </div>

                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">State</label>
                            <input
                              type="text"
                              value={address.state}
                              onChange={(e) => setAddress({ ...address, state: e.target.value })}
                              placeholder="e.g., Delhi"
                              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition ${
                                errors.state
                                  ? 'border-red-500 focus:ring-red-400'
                                  : 'border-gray-300 focus:ring-green-400'
                              }`}
                            />
                            {errors.state && <p className="text-red-600 text-sm mt-1">{errors.state}</p>}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Postal Code (PIN)</label>
                            <input
                              type="text"
                              value={address.zipcode}
                              onChange={(e) => setAddress({ ...address, zipcode: e.target.value })}
                              placeholder="e.g., 110001"
                              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition ${
                                errors.zipcode
                                  ? 'border-red-500 focus:ring-red-400'
                                  : 'border-gray-300 focus:ring-green-400'
                              }`}
                            />
                            {errors.zipcode && <p className="text-red-600 text-sm mt-1">{errors.zipcode}</p>}
                          </div>

                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
                            <input
                              type="text"
                              value={address.phone}
                              onChange={(e) => setAddress({ ...address, phone: e.target.value })}
                              placeholder="e.g., 9876543210"
                              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition ${
                                errors.phone
                                  ? 'border-red-500 focus:ring-red-400'
                                  : 'border-gray-300 focus:ring-green-400'
                              }`}
                            />
                            {errors.phone && <p className="text-red-600 text-sm mt-1">{errors.phone}</p>}
                          </div>
                        </div>

                        <Button
                          variant="primary"
                          size="lg"
                          className="w-full mt-6"
                          onClick={handleAddressSubmit}
                        >
                          Continue to Delivery →
                        </Button>
                      </div>
                    </div>
                  </Card>
                </ScrollAnimation>
              )}

              {/* STEP 2: Delivery */}
              {step === 'delivery' && (
                <ScrollAnimation className="scroll-slide">
                  <Card className="animate-slide-in-left">
                    <div className="p-8">
                      <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <Truck size={28} className="text-green-600" />
                        Select Delivery Option
                      </h2>

                      <div className="space-y-4 mb-6">
                        {deliveryOptions.map(option => (
                          <div
                            key={option.id}
                            onClick={() => setDelivery(option.id)}
                            className={`p-6 border-2 rounded-lg cursor-pointer transition-smooth ${
                              delivery === option.id
                                ? 'border-green-600 bg-green-50'
                                : 'border-gray-200 hover:border-green-400'
                            }`}
                          >
                            <div className="flex items-start gap-4">
                              <div className="text-3xl">{option.icon}</div>
                              <div className="flex-1">
                                <h3 className="font-bold text-lg text-gray-900">{option.name}</h3>
                                <p className="text-gray-600 text-sm">{option.time}</p>
                                <p className="text-gray-600 text-sm mt-1">{option.description}</p>
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-green-600">
                                  {option.price === 0 ? 'FREE' : `₹${option.price}`}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="flex gap-4">
                        <Button
                          variant="secondary"
                          size="lg"
                          className="flex-1"
                          onClick={() => setStep('address')}
                        >
                          ← Back
                        </Button>
                        <Button
                          variant="primary"
                          size="lg"
                          className="flex-1"
                          onClick={() => setStep('payment')}
                        >
                          Continue to Payment →
                        </Button>
                      </div>
                    </div>
                  </Card>
                </ScrollAnimation>
              )}

              {/* STEP 3: Payment */}
              {step === 'payment' && (
                <ScrollAnimation className="scroll-slide">
                  <Card className="animate-slide-in-left">
                    <div className="p-8">
                      <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <CreditCard size={28} className="text-green-600" />
                        Choose Payment Method
                      </h2>

                      <div className="space-y-4 mb-6">
                        {paymentOptions.map(option => (
                          <div
                            key={option.id}
                            onClick={() => setPayment(option.id)}
                            className={`p-6 border-2 rounded-lg cursor-pointer transition-smooth ${
                              payment === option.id
                                ? 'border-green-600 bg-green-50'
                                : 'border-gray-200 hover:border-green-400'
                            }`}
                          >
                            <div className="flex items-center gap-4">
                              <div className="text-3xl">{option.icon}</div>
                              <div className="flex-1">
                                <h3 className="font-bold text-lg text-gray-900">{option.name}</h3>
                                <p className="text-gray-600 text-sm">{option.description}</p>
                              </div>
                              <div className={`w-6 h-6 rounded-full border-2 ${
                                payment === option.id
                                  ? 'border-green-600 bg-green-600'
                                  : 'border-gray-300'
                              }`} />
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6 rounded">
                        <p className="text-sm text-blue-800">
                          ✅ <strong>All payments are secure</strong> and encrypted for your protection
                        </p>
                      </div>

                      <div className="flex gap-4">
                        <Button
                          variant="secondary"
                          size="lg"
                          className="flex-1"
                          onClick={() => setStep('delivery')}
                        >
                          ← Back
                        </Button>
                        <Button
                          variant="success"
                          size="lg"
                          className="flex-1"
                          onClick={handlePlaceOrder}
                          disabled={isProcessing}
                        >
                          {isProcessing ? 'Processing...' : '✓ Place Order'}
                        </Button>
                      </div>
                    </div>
                  </Card>
                </ScrollAnimation>
              )}
            </div>

            {/* Order Summary Sidebar */}
            <div className="lg:col-span-1">
              <Card variant="light" animated={false} className="sticky top-24 animate-slide-in-right">
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h3>

                  {/* Cart Items */}
                  <div className="space-y-4 mb-6 pb-6 border-b max-h-64 overflow-y-auto">
                    {cart.map((item) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <div>
                          <p className="font-medium text-gray-900">{item.name}</p>
                          <p className="text-gray-600">{item.quantity} kg</p>
                        </div>
                        <p className="font-semibold text-gray-900">₹{(item.price * item.quantity).toFixed(2)}</p>
                      </div>
                    ))}
                  </div>

                  {/* Price Breakdown */}
                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="font-semibold text-gray-900">₹{totalPrice.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">
                        Delivery {delivery === 'express' && '(Express)'}
                      </span>
                      <span className="font-semibold text-gray-900">
                        {deliveryCost === 0 ? 'FREE' : `₹${deliveryCost.toFixed(2)}`}
                      </span>
                    </div>
                    <div className="border-t pt-3 flex justify-between">
                      <span className="font-bold text-gray-900">Total Amount</span>
                      <span className="font-bold text-green-600 text-lg">₹{finalTotal.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Trust Signals */}
                  <div className="space-y-2 bg-green-50 p-4 rounded-lg">
                    <p className="text-xs text-green-800 flex items-center gap-2">
                      <CheckCircle size={14} /> <strong>Secure checkout</strong>
                    </p>
                    <p className="text-xs text-green-800 flex items-center gap-2">
                      <CheckCircle size={14} /> <strong>Direct from farmers</strong>
                    </p>
                    <p className="text-xs text-green-800 flex items-center gap-2">
                      <CheckCircle size={14} /> <strong>Fast delivery</strong>
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
