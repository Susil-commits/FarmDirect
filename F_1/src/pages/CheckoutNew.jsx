import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from '../context/RouterContext';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../context/ToastContext';
import { useCart } from '../context/CartContext';
import { cropService, orderService } from '../services/appService';
import paymentService from '../services/paymentService';
import PageTransition from '../components/common/PageTransition';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import CouponInput from '../components/common/CouponInput';
import ScrollAnimation from '../components/common/ScrollAnimation';
import PageLoader from '../components/common/PageLoader';
import {
  MapPin, Phone, DollarSign, CheckCircle, Package,
  ArrowLeft, AlertCircle, Sprout
} from 'lucide-react';
import '../styles/Checkout.css';
import { getImageUrl } from '../utils/formatters';

export default function CheckoutNew() {
  const { navigate } = useRouter();
  const { user } = useAuth();
  const { addToast } = useToast();
  const { appliedCoupon } = useCart();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [crop, setCrop] = useState(null);
  const [orderData, setOrderData] = useState(null);

  const [formData, setFormData] = useState({
    quantity: 1,
    paymentMethod: 'cod',
    termsAccepted: false
  });

  // Get cropId from URL params
  const params = new URLSearchParams(window.location.search);
  const cropId = params.get('cropId');



  const fetchCropDetails = useCallback(async () => {
    try {
      setLoading(true);
      const response = await cropService.getCropById(cropId);
      const cropData = response.crop || response.data?.crop || response.data;
      setCrop(cropData);
      if (cropData.availability === 'not_available') {
        addToast('This crop is no longer available', 'warning');
        navigate('/marketplace');
      }
    } catch {
      addToast('Failed to load crop details', 'error');
      navigate('/marketplace');
    } finally {
      setLoading(false);
    }
  }, [cropId, addToast, navigate]);

  useEffect(() => {
    if (!user) navigate('/login');
    if (!cropId) {
      addToast('No crop selected for checkout', 'error');
      navigate('/marketplace');
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchCropDetails();
  }, [user, cropId, addToast, navigate, fetchCropDetails]);

  const calculateTotal = () => {
    if (!crop) return 0;
    return (crop.price || 0) * formData.quantity;
  };

  const processRazorpayPayment = async (createdOrder) => {
    try {
      const init = await paymentService.initializeRazorpayPayment(createdOrder._id);

      await paymentService.openRazorpayCheckout({
        keyId: init.keyId,
        razorpayOrderId: init.razorpayOrderId,
        amount: init.amount,
        name: 'FarmDirect',
        description: `Order for ${crop.cropName}`,
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
            setOrderData((prev) => ({ ...prev, paymentStatus: 'completed' }));
            setStep(3);
            addToast('Payment successful! Order confirmed.', 'success');
          } catch (verr) {
            addToast(verr?.message || 'Payment verification failed. You can retry from order details.', 'error');
            navigate(`/order/${createdOrder._id}`);
          } finally {
            setLoading(false);
          }
        },
        onDismiss: () => {
          addToast('Payment cancelled. You can retry payment from your order details.', 'warning');
          navigate(`/order/${createdOrder._id}`);
          setLoading(false);
        },
        onFailure: (err) => {
          if (err?.metadata?.order_id) {
            paymentService.reportRazorpayFailure(err.metadata.order_id, err.description).catch(() => {});
          }
          addToast(err?.description || 'Payment failed. You can retry from order details.', 'error');
          navigate(`/order/${createdOrder._id}`);
          setLoading(false);
        },
      });
    } catch (err) {
      addToast(err?.message || 'Failed to start payment. You can retry from order details.', 'error');
      navigate(`/order/${createdOrder._id}`);
      setLoading(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!crop) return;

    setLoading(true);
    try {
      const total = calculateTotal();

      // api.js interceptor unwraps to response.data, so result = { message, order }
      const result = await orderService.createOrder({
        cropId: crop._id,
        quantity: formData.quantity,
        unitPrice: crop.price,
        totalAmount: total,
        paymentMethod: formData.paymentMethod,
        couponCode: appliedCoupon?.code || undefined,
      });

      const createdOrder = result.order;
      setOrderData(createdOrder);
      localStorage.setItem('lastOrderId', createdOrder._id);

      if (formData.paymentMethod === 'razorpay') {
        // Keep loading spinner visible while the payment modal is open.
        await processRazorpayPayment(createdOrder);
        return;
      }

      setStep(3); // Go to confirmation
      addToast(result.message || 'Order placed successfully!', 'success');
    } catch (err) {
      // Error is already unwrapped by api.js interceptor: err = { message: '...' }
      addToast(err?.message || 'Error placing order', 'error');
      setLoading(false);
    } finally {
      // Only clear loading for the COD path; Razorpay clears it inside callbacks.
      if (formData.paymentMethod !== 'razorpay') {
        setLoading(false);
      }
    }
  };

  const total = calculateTotal();

  if (loading && !crop) {
    return (
      <PageTransition>
        <PageLoader message="Loading crop details..." />
      </PageTransition>
    );
  }

  if (!crop) {
    return (
      <PageTransition>
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-green-100 py-12 px-4 flex items-center justify-center">
          <div className="text-center">
            <AlertCircle size={48} className="text-amber-600 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">Crop not found</p>
            <Button variant="primary" className="mt-4" onClick={() => navigate('/marketplace')}>
              Back to Marketplace
            </Button>
          </div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      {loading && <PageLoader message="Processing your order..." />}
      <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-white py-12 px-4">
        <div className="max-w-3xl mx-auto">
          {/* Step Indicator */}
          <ScrollAnimation className="scroll-slide mb-8">
            <div className="flex items-center justify-center gap-4 mb-12">
              {[
                { num: 1, label: 'Review' },
                { num: 2, label: 'Confirm' },
                { num: 3, label: 'Done' }
              ].map((s, idx) => (
                <React.Fragment key={s.num}>
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition ${
                        s.num < step
                          ? 'bg-green-600 text-white'
                          : s.num === step
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      {s.num < step ? '✓' : s.num}
                    </div>
                    <p className={`text-sm font-semibold ${s.num <= step ? 'text-gray-900' : 'text-gray-500'}`}>
                      {s.label}
                    </p>
                  </div>
                  {idx < 2 && <div className={`flex-1 h-1 max-w-[60px] transition ${s.num < step ? 'bg-green-600' : 'bg-gray-200'}`} />}
                </React.Fragment>
              ))}
            </div>
          </ScrollAnimation>

          {/* STEP 1: REVIEW CROP */}
          {step === 1 && (
            <ScrollAnimation className="scroll-slide">
              <Card className="p-8">
                <div className="flex items-center gap-3 mb-6">
                  <Sprout className="w-6 h-6 text-green-600" />
                  <h2 className="text-2xl font-bold text-gray-900">Review Your Order</h2>
                </div>

                {/* Crop Details */}
                <div className="bg-green-50 rounded-xl p-6 mb-6">
                  <div className="flex items-start gap-4">
                    {crop.images?.[0] && (
                      <img
                        src={getImageUrl(crop.images[0])}
                        alt={crop.cropName}
                        className="w-24 h-24 rounded-lg object-cover"
                      />
                    )}
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900">{crop.cropName}</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {crop.cropType === 'vegetables' ? '🥬 Vegetable' : '🌾 Crop'}
                        {crop.category && ` • ${crop.category}`}
                      </p>
                      <p className="text-2xl font-bold text-green-600 mt-2">
                        ₹{(crop.price || 0).toLocaleString('en-IN')}<span className="text-sm text-gray-600">/kg</span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Pickup Location */}
                <div className="mb-6">
                  <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-blue-600" /> Pickup Location
                  </h3>
                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-gray-900 font-medium">{crop.pickupLocation || 'Location not specified'}</p>
                    {crop.contactNumber && (
                      <p className="text-sm text-gray-600 mt-2 flex items-center gap-2">
                        <Phone size={14} />
                        <a href={`tel:${crop.contactNumber}`} className="text-blue-600 hover:underline">
                          {crop.contactNumber}
                        </a>
                      </p>
                    )}
                  </div>
                </div>

                {/* Quantity */}
                <div className="mb-6">
                  <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <Package className="w-5 h-5 text-blue-600" /> Quantity
                  </h3>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setFormData(prev => ({ ...prev, quantity: Math.max(1, prev.quantity - 1) }))}
                      className="w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center font-bold text-lg transition"
                    >
                      −
                    </button>
                    <span className="text-2xl font-bold text-gray-900 min-w-[3rem] text-center">
                      {formData.quantity}
                    </span>
                    <button
                      onClick={() => setFormData(prev => ({ ...prev, quantity: Math.min(crop.quantity || 100, prev.quantity + 1) }))}
                      className="w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center font-bold text-lg transition"
                    >
                      +
                    </button>
                    <span className="text-gray-600 text-sm">kg</span>
                  </div>
                  {crop.quantity && (
                    <p className="text-xs text-gray-500 mt-2">
                      Available: {crop.quantity} kg
                    </p>
                  )}
                </div>

                {/* Price Summary */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <div className="flex justify-between text-gray-700 mb-2">
                    <span>Price per kg</span>
                    <span>₹{(crop.price || 0).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-gray-700 mb-2">
                    <span>Quantity</span>
                    <span>{formData.quantity} kg</span>
                  </div>
                  {appliedCoupon && (
                    <div className="flex justify-between text-green-700 mb-2">
                      <span>Coupon ({appliedCoupon.code})</span>
                      <span>- ₹{(appliedCoupon.discountAmount || 0).toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t">
                    <span>Total Amount</span>
                    <span className="text-green-600">
                      ₹{(total - (appliedCoupon?.discountAmount || 0)).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                {/* Promo code */}
                <div className="mb-6">
                  <CouponInput amount={total} variant="checkout" />
                </div>

                {/* Payment Method */}
                <div className="mb-6">
                  <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-blue-600" /> Payment Method
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, paymentMethod: 'cod' }))}
                      className={`payment-card ${formData.paymentMethod === 'cod' ? 'active' : ''}`}
                    >
                      <div className="text-3xl">💵</div>
                      <p className="font-bold text-gray-900 mt-1">Cash on Delivery</p>
                      <p className="text-sm text-gray-600">Pay at pickup</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, paymentMethod: 'razorpay' }))}
                      className={`payment-card ${formData.paymentMethod === 'razorpay' ? 'active' : ''}`}
                    >
                      <div className="text-3xl">💳</div>
                      <p className="font-bold text-gray-900 mt-1">Online Payment</p>
                      <p className="text-sm text-gray-600">UPI / Card / NetBanking</p>
                    </button>
                  </div>
                  {formData.paymentMethod === 'razorpay' && (
                    <p className="text-xs text-gray-500 mt-2">
                      You'll be redirected to a secure Razorpay checkout after placing the order.
                    </p>
                  )}
                </div>

                {/* Description */}
                {crop.description && (
                  <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm font-semibold text-gray-600 mb-1">Description</p>
                    <p className="text-gray-700">{crop.description}</p>
                  </div>
                )}

                <div className="flex gap-4">
                  <Button onClick={() => navigate(`/crop/${cropId}`)} variant="outline">
                    <ArrowLeft size={16} className="mr-1" /> Back
                  </Button>
                  <Button onClick={() => setStep(2)} variant="primary" className="flex-1">
                    Continue to Confirm →
                  </Button>
                </div>
              </Card>
            </ScrollAnimation>
          )}

          {/* STEP 2: CONFIRM */}
          {step === 2 && (
            <ScrollAnimation className="scroll-slide">
              <Card className="p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Confirm Your Order</h2>

                {/* Summary */}
                <div className="bg-gray-50 rounded-lg p-6 mb-6 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Crop</span>
                    <span className="font-semibold text-gray-900">{crop.cropName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Quantity</span>
                    <span className="font-semibold text-gray-900">{formData.quantity} kg</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Price</span>
                    <span className="font-semibold text-gray-900">₹{(crop.price || 0).toLocaleString('en-IN')}/kg</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Pickup Location</span>
                    <span className="font-semibold text-gray-900 text-right max-w-[200px]">{crop.pickupLocation || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Payment</span>
                    <span className="font-semibold text-gray-900">
                      {formData.paymentMethod === 'razorpay' ? 'Online (Razorpay)' : 'Cash on Delivery'}
                    </span>
                  </div>
                  <div className="flex justify-between text-lg font-bold pt-3 border-t">
                    <span>Total</span>
                    <span className="text-green-600">₹{total.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                {/* Terms */}
                <label className="flex items-start gap-3 mb-6 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.termsAccepted}
                    onChange={(e) => setFormData({ ...formData, termsAccepted: e.target.checked })}
                    className="w-5 h-5 text-blue-600 rounded mt-1"
                  />
                  <span className="text-sm text-gray-700">
                    {formData.paymentMethod === 'cod'
                      ? 'I confirm that I will pick up the order from the farm location and pay the farmer directly.'
                      : 'I confirm that I will pick up the order from the farm location. Payment will be made online now.'}
                    {' '}I agree to the <strong>Terms & Conditions</strong>.
                  </span>
                </label>

                <div className="flex gap-4">
                  <Button onClick={() => setStep(1)} variant="outline">
                    ← Back
                  </Button>
                  <Button
                    onClick={handlePlaceOrder}
                    variant="primary"
                    className="flex-1"
                    disabled={!formData.termsAccepted}
                  >
                    Place Order ✓
                  </Button>
                </div>
              </Card>
            </ScrollAnimation>
          )}

          {/* STEP 3: CONFIRMATION */}
          {step === 3 && orderData && (
            <ScrollAnimation className="scroll-slide">
              <Card className="p-8 text-center">
                <div className="flex justify-center mb-6">
                  <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center animate-pulse">
                    <CheckCircle className="w-10 h-10 text-green-600" />
                  </div>
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Order Confirmed!</h2>
                <p className="text-gray-600 mb-6">Your order has been successfully placed</p>

                <div className="bg-gray-50 p-6 rounded-lg mb-6 text-left">
                  <p className="text-sm text-gray-600 mb-2">Order Number</p>
                  <p className="text-2xl font-bold text-gray-900 mb-4">
                    #{orderData.orderNumber || (orderData._id || '').slice(-8).toUpperCase()}
                  </p>

                  <p className="text-sm text-gray-600 mb-2">Pickup Location</p>
                  <p className="font-semibold text-gray-900 mb-4">{crop.pickupLocation || 'N/A'}</p>

                  <p className="text-sm text-gray-600 mb-2">Total Amount</p>
                  <p className="text-2xl font-bold text-green-600">₹{total.toLocaleString('en-IN')}</p>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg mb-6 text-left">
                  <p className="text-sm text-blue-800">
                    💡 <strong>Next Step:</strong> Contact the farmer at{' '}
                    {crop.contactNumber ? (
                      <a href={`tel:${crop.contactNumber}`} className="text-blue-600 font-bold hover:underline">
                        {crop.contactNumber}
                      </a>
                    ) : 'the provided number'} to coordinate your pickup time.
                  </p>
                </div>

                <div className="space-y-3">
                  <Button onClick={() => navigate(`/order/${orderData._id}`)} variant="primary" className="w-full">
                    Track Your Order
                  </Button>
                  <Button onClick={() => navigate('/marketplace')} variant="outline" className="w-full">
                    Continue Shopping
                  </Button>
                </div>
              </Card>
            </ScrollAnimation>
          )}
        </div>
      </div>
    </PageTransition>
  );
}
