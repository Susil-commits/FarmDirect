import React, { useState, useEffect, useMemo } from 'react';
import { MapPin, Star, Trash2, Minus, Plus, ShoppingBag, ArrowLeft, Check, Leaf, Calendar, Heart, Package, Loader, ShieldCheck, Lock } from 'lucide-react';
import { useCart } from '../hooks/useCart';
import { useRouter } from '../hooks/useRouter';
import { useToast } from '../hooks/useToast';
import { useAuth } from '../context/AuthContext';
import { orderService } from '../services/appService';
import paymentService from '../services/paymentService';
import PageTransition from '../components/common/PageTransition.jsx';
import Button from '../components/common/Button';
import CouponInput from '../components/common/CouponInput';
import '../styles/ShoppingCart.css';
import { getImageUrl } from '../utils/formatters';

export default function ShoppingCart() {
  const { cart, removeFromCart, updateQuantity, clearCart, getTotalPrice, appliedCoupon, _getDiscountedTotal } = useCart();
  const { navigate } = useRouter();
  const { addToast } = useToast();
  const { isAuthenticated, user } = useAuth();
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cod');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleQuantityChange = (productId, quantity) => {
    const newQty = Math.max(1, parseInt(quantity) || 1);
    updateQuantity(productId, newQty);
  };

  const handleIncrement = (productId, currentQty) => {
    updateQuantity(productId, currentQty + 1);
  };

  const handleDecrement = (productId, currentQty) => {
    if (currentQty > 1) {
      updateQuantity(productId, currentQty - 1);
    }
  };

  const handleRemove = (productId, productName) => {
    removeFromCart(productId);
    addToast(`${productName || 'Item'} removed from cart`, 'info');
  };

  const processCartRazorpayPayment = async (orderIds) => {
    try {
      const init = await paymentService.initializeRazorpayPayment(orderIds);

      await paymentService.openRazorpayCheckout({
        keyId: init.keyId,
        razorpayOrderId: init.razorpayOrderId,
        amount: init.amount,
        name: 'FarmDirect',
        description: `Payment for ${orderIds.length} order(s)`,
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
            clearCart();
            addToast('Payment successful! Orders confirmed.', 'success');
            navigate('/order-confirmation');
          } catch (verr) {
            addToast(verr?.message || 'Payment verification failed. You can retry from your orders.', 'error');
            navigate('/order-confirmation');
          } finally {
            setCheckoutLoading(false);
          }
        },
        onDismiss: () => {
          addToast('Payment cancelled. You can retry payment from your orders.', 'warning');
          clearCart();
          navigate('/order-confirmation');
          setCheckoutLoading(false);
        },
        onFailure: (err) => {
          if (err?.metadata?.order_id) {
            paymentService.reportRazorpayFailure(err.metadata.order_id, err.description).catch(() => {});
          }
          addToast(err?.description || 'Payment failed. You can retry from your orders.', 'error');
          clearCart();
          navigate('/order-confirmation');
          setCheckoutLoading(false);
        },
      });
    } catch (err) {
      addToast(err?.message || 'Failed to start payment. Your orders are placed but unpaid.', 'error');
      clearCart();
      navigate('/order-confirmation');
      setCheckoutLoading(false);
    }
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      addToast('Cart is empty', 'warning');
      return;
    }

    if (!isAuthenticated) {
      addToast('Please login to place your order', 'warning');
      navigate('/login');
      return;
    }

    if (user?.role !== 'buyer') {
      addToast('Only buyers can place orders', 'warning');
      return;
    }

    if (user?.kycStatus !== 'verified') {
      addToast('Please complete your KYC verification before placing orders', 'warning');
      return;
    }

    setCheckoutLoading(true);

    try {
      const items = cart.map(item => ({
        cropId: item._id || item.id,
        quantity: item.quantity || 1,
        unitPrice: item.price
      }));

      const payload = {
        items,
        paymentMethod,
        couponCode: appliedCoupon?.code || undefined,
      };

      // Generate a unique idempotency key for this checkout attempt
      const idempotencyKey = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

      const result = await orderService.checkoutCart(payload, idempotencyKey);
      const createdOrderIds = result.orderIds || [];
      const successCount = createdOrderIds.length;

      // Save the last successfully created order ID for OrderConfirmation page
      if (createdOrderIds.length > 0) {
        localStorage.setItem('lastOrderId', createdOrderIds[createdOrderIds.length - 1]);
      }

      // Online payment: collect payment for all created orders at once.
      if (paymentMethod === 'razorpay' && createdOrderIds.length > 0) {
        if (successCount > 0) {
          addToast(
            `${successCount} order(s) placed. Complete payment to confirm.`,
            'info'
          );
        }
        await processCartRazorpayPayment(createdOrderIds);
        return;
      }

      // COD path
      if (successCount > 0) {
        addToast(
          `${successCount} order(s) placed successfully! The farmer(s) will be notified.`,
          'success'
        );
        clearCart();
        navigate('/order-confirmation');
      }
    } catch (err) {
      console.error('Checkout error:', err);
      addToast('Failed to place order. Please try again.', 'error');
    } finally {
      if (paymentMethod !== 'razorpay') {
        setCheckoutLoading(false);
      }
    }
  };

  const totalPrice = getTotalPrice();
  const couponDiscount = appliedCoupon?.discountAmount || 0;
  const discountPercent = cart.length >= 3 ? 10 : cart.length >= 2 ? 5 : 0;
  const discountAmount = (totalPrice * discountPercent) / 100;
  const finalTotal = Math.max(0, totalPrice - discountAmount - couponDiscount);
  const taxAmount = (finalTotal * 5) / 100;
  const grandTotal = finalTotal + taxAmount;
  const deliveryCharge = grandTotal >= 500 ? 0 : 40;
  const finalGrandTotal = grandTotal + deliveryCharge;

  return (
    <PageTransition>
      <div className="cart-page">
        <div className="cart-bg-gradient"></div>
        <div className="cart-container">
          {/* Header */}
          <div className="cart-header-section">
            <div className="cart-header-content">
              <div className="cart-title-row">
                <span className="cart-header-icon">🛒</span>
                <h1>Shopping Cart</h1>
              </div>
              <p className="cart-subtitle">
                {cart.length} {cart.length === 1 ? 'item' : 'items'} in your cart
              </p>
            </div>
            {cart.length > 0 && (
              <button
                onClick={() => navigate('/marketplace')}
                className="cart-browse-btn"
              >
                <ShoppingBag size={18} />
                Continue Shopping
              </button>
            )}
          </div>

          {/* Empty State */}
          {cart.length === 0 && (
            <div className="cart-empty">
              <div className="cart-empty-icon">
                <ShoppingBag size={64} strokeWidth={1.5} />
              </div>
              <h2>Your cart is empty</h2>
              <p>Browse our products and add items to your cart</p>
              <Button
                onClick={() => navigate('/marketplace')}
                className="btn btn-primary btn-lg"
              >
                Browse Marketplace
              </Button>
            </div>
          )}

          {/* Cart Content */}
          {cart.length > 0 && (
            <div className="cart-content-grid">
              {/* Cart Items List - Left Column */}
              <div className="cart-items-column">
                {cart.map((item, idx) => (
                  <CartItemCard
                    key={item.id || item._id}
                    item={item}
                    index={idx}
                    onRemove={handleRemove}
                    onIncrement={handleIncrement}
                    onDecrement={handleDecrement}
                    onQuantityChange={handleQuantityChange}
                    onNavigate={navigate}
                  />
                ))}

                {/* Clear Cart */}
                <div className="cart-clear-row">
                  <button
                    onClick={() => {
                      if (window.confirm('Clear entire cart? This action cannot be undone.')) {
                        clearCart();
                        addToast('Cart cleared', 'info');
                      }
                    }}
                    className="cart-clear-btn"
                  >
                    <Trash2 size={16} />
                    Clear Cart
                  </button>
                </div>
              </div>

              {/* Order Summary - Right Column */}
              <div className="cart-summary-column">
                <div className="cart-summary-card">
                  <h2>Order Summary</h2>

                  <div className="cart-summary-divider"></div>

                  <div className="cart-summary-row">
                    <span>Subtotal ({cart.reduce((t, i) => t + (i.quantity || 0), 0)} items)</span>
                    <span>₹{totalPrice.toFixed(2)}</span>
                  </div>

                  {/* Promo code */}
                  <div className="cart-coupon-section">
                    <CouponInput amount={totalPrice} />
                  </div>

                  {appliedCoupon && (
                    <div className="cart-summary-row cart-summary-discount">
                      <span>
                        <span className="cart-discount-badge">{appliedCoupon.code}</span>
                        Coupon discount
                      </span>
                      <span>- ₹{appliedCoupon.discountAmount.toFixed(2)}</span>
                    </div>
                  )}

                  {discountPercent > 0 && (
                    <div className="cart-summary-row cart-summary-discount">
                      <span>
                        <span className="cart-discount-badge">{discountPercent}% OFF</span>
                        Bulk discount
                      </span>
                      <span>- ₹{discountAmount.toFixed(2)}</span>
                    </div>
                  )}

                  <div className="cart-summary-divider"></div>

                  <div className="cart-summary-row">
                    <span>Subtotal after discount</span>
                    <span>₹{(finalTotal - (appliedCoupon?.discountAmount || 0)).toFixed(2)}</span>
                  </div>

                  <div className="cart-summary-row cart-summary-tax">
                    <span>GST (5%)</span>
                    <span>+ ₹{taxAmount.toFixed(2)}</span>
                  </div>

                  {deliveryCharge > 0 ? (
                    <div className="cart-summary-row cart-summary-delivery">
                      <span>Delivery charge</span>
                      <span>+ ₹{deliveryCharge.toFixed(2)}</span>
                    </div>
                  ) : (
                    <div className="cart-summary-row cart-summary-free-delivery">
                      <span>Delivery</span>
                      <span className="cart-free-badge">FREE</span>
                    </div>
                  )}

                  <div className="cart-summary-divider"></div>

                  <div className="cart-summary-row cart-summary-total">
                    <span>Total Amount</span>
                    <span>₹{finalGrandTotal.toFixed(2)}</span>
                  </div>

                  {grandTotal < 500 && (
                    <p className="cart-delivery-note">
                      Add items worth ₹{(500 - grandTotal).toFixed(0)} more for free delivery
                    </p>
                  )}

                  {/* Payment Method Selector */}
                  <div className="cart-payment-selector">
                    <p className="cart-payment-label">Payment Method</p>
                    <div className="cart-payment-options">
                      <button
                        type="button"
                        className={`cart-payment-option ${paymentMethod === 'cod' ? 'active' : ''}`}
                        onClick={() => setPaymentMethod('cod')}
                      >
                        <span className="cart-payment-icon">💵</span>
                        <span className="cart-payment-text">
                          <strong>Cash on Delivery</strong>
                          <small>Pay at pickup</small>
                        </span>
                      </button>
                      <button
                        type="button"
                        className={`cart-payment-option ${paymentMethod === 'razorpay' ? 'active' : ''}`}
                        onClick={() => setPaymentMethod('razorpay')}
                      >
                        <span className="cart-payment-icon">💳</span>
                        <span className="cart-payment-text">
                          <strong>Online Payment</strong>
                          <small>UPI / Card / NetBanking</small>
                        </span>
                      </button>
                    </div>
                  </div>
                  {/* Secure Checkout Banner */}
                  <div className="mt-6 mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-center gap-2">
                    <Lock size={16} className="text-emerald-700" />
                    <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-widest">End-to-End Encrypted</span>
                  </div>

                  <button
                    onClick={handleCheckout}
                    className="cart-checkout-btn relative overflow-hidden group"
                    disabled={checkoutLoading}
                  >
                    {checkoutLoading ? (
                      <span className="flex items-center justify-center gap-2 relative z-10">
                        <Loader size={18} className="animate-spin" /> Processing Securely...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2 relative z-10">
                        <ShieldCheck size={18} /> Proceed to Secure Checkout
                      </span>
                    )}
                  </button>

                  <button
                    onClick={() => navigate('/marketplace')}
                    className="cart-continue-btn mt-4"
                  >
                    <ArrowLeft size={16} />
                    Continue Shopping
                  </button>

                  {/* Trust Badges */}
                  <div className="cart-trust-row flex justify-center gap-4 mt-6 pt-32 border-t border-gray-100 text-xs text-slate-500 font-medium">
                    <span className="flex items-center gap-1"><Lock size={14} className="text-emerald-500"/> SSL Secured</span>
                    <span className="flex items-center gap-1"><Check size={14} className="text-emerald-500"/> Quality Assured</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Footer Navigation */}
          {cart.length > 0 && (
            <div className="cart-footer">
              <div className="cart-footer-inner">
                <button onClick={() => navigate('/')} className="cart-footer-back">
                  ← Back to Home
                </button>
                <div className="cart-footer-links">
                  <button onClick={() => navigate('/marketplace')}>Marketplace</button>
                  <button onClick={() => navigate('/wishlist')}>Wishlist</button>
                  <button onClick={() => navigate('/contact')}>Contact</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
}

// Individual Cart Item Card - Redesigned with Marketplace-level details
function CartItemCard({ item, index, onRemove, onIncrement, onDecrement, onQuantityChange, onNavigate }) {
  const staggerDelay = index * 0.08;
  const rawItemImage = item.image || item.images?.[0];
  const [imgError, setImgError] = useState(false);
  const showFallback = !rawItemImage || imgError;

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating || 0);
    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<Star key={i} size={12} fill="#f59e0b" className="star-filled" />);
      } else {
        stars.push(<Star key={i} size={12} className="star-empty" />);
      }
    }
    return stars;
  };

  const getCropEmoji = (cropType) => {
    const map = {
      vegetables: '🥬', fruits: '🍎', grains: '🌾',
      herbs: '🌿', pulses: '🫘', spices: '🌶️',
    };
    return map[cropType?.toLowerCase()] || '🌾';
  };

  // ---- Derived product flags ----
  const isOrganic = useMemo(() => {
    return !!(item.specifications?.organicCertified ||
      item.certifications?.includes?.('Organic') ||
      item.isOrganic);
  }, [item.specifications?.organicCertified, item.certifications, item.isOrganic]);

  const stockStatus = useMemo(() => {
    const qty = item.quantity ?? item.stock ?? 0;
    const threshold = item.lowStockThreshold ?? 5;
    if (item.status === 'soldOut' || item.availability === 'not_available' || qty <= 0) return 'out-of-stock';
    if (qty <= threshold) return 'low-stock';
    return 'in-stock';
  }, [item.quantity, item.stock, item.lowStockThreshold, item.status, item.availability]);

  const stockLabel = {
    'in-stock': 'In Stock',
    'low-stock': 'Low Stock',
    'out-of-stock': 'Out of Stock',
  };

  const harvestRelative = useMemo(() => {
    if (!item.harvestDate) return null;
    const harvest = new Date(item.harvestDate);
    const now = new Date();
    const diffMs = now - harvest;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return 'Upcoming harvest';
    if (diffDays === 0) return 'Harvested today';
    if (diffDays === 1) return 'Harvested yesterday';
    if (diffDays < 7) return `Harvested ${diffDays} days ago`;
    if (diffDays < 30) return `Harvested ${Math.floor(diffDays / 7)}w ago`;
    return `Harvested ${Math.floor(diffDays / 30)}mo ago`;
  }, [item.harvestDate]);

  const savingsPct = useMemo(() => {
    if (!item.originalPrice || item.originalPrice <= item.price) return null;
    return Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100);
  }, [item.originalPrice, item.price]);

  const freshnessLabel = useMemo(() => {
    if (item.harvestDate) {
      const harvest = new Date(item.harvestDate);
      const diffDays = Math.floor((new Date() - harvest) / (1000 * 60 * 60 * 24));
      if (diffDays <= 2) return 'Farm Fresh';
      if (diffDays <= 5) return 'Fresh';
    }
    return item.specifications?.ripeness || null;
  }, [item.harvestDate, item.specifications?.ripeness]);

  const isOutOfStock = stockStatus === 'out-of-stock';

  return (
    <div
      className={`cart-item-card ${staggerDelay > 0 ? 'cart-stagger-item' : ''} ${isOutOfStock ? 'cart-item-out-of-stock' : ''}`}
      style={{ animationDelay: `${staggerDelay}s`, '--card-delay': staggerDelay }}
    >
      {/* Image */}
      <div
        className="cart-item-image"
        onClick={() => onNavigate(`/crop/${item.id || item._id}`)}
      >
        {!showFallback && rawItemImage ? (
          <img
            src={getImageUrl(rawItemImage)}
            alt={item.name}
            className="cart-item-img"
            loading="lazy"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="cart-item-img-fallback">
            <span className="cart-item-emoji">
              {getCropEmoji(item.cropType || item.category)}
            </span>
          </div>
        )}

        {/* Top-left stacked badges */}
        <div className="cart-item-badges">
          {isOrganic && (
            <span className="cart-badge-organic">
              <Leaf size={9} /> Organic
            </span>
          )}
          {item.farmer_verified && (
            <span className="cart-badge-verified">
              <Check size={9} /> Verified
            </span>
          )}
        </div>

        {/* Stock overlay for out-of-stock */}
        {isOutOfStock && (
          <div className="cart-item-out-of-stock-overlay">Sold Out</div>
        )}
      </div>

      {/* Details */}
      <div className="cart-item-details">
        <div className="cart-item-name-row">
          <h3
            className="cart-item-name"
            onClick={() => onNavigate(`/crop/${item.id || item._id}`)}
          >
            {item.name}
          </h3>
          {(item.cropType || item.category) && (
            <span className="cart-badge-type cart-badge-type-inline">
              {item.cropType || item.category}
            </span>
          )}
        </div>

        {/* Farmer Info */}
        <div className="cart-item-farmer">
          <div className="cart-farmer-avatar">
            {item.farmerName?.[0]?.toUpperCase() || 'F'}
          </div>
          <div className="cart-farmer-info">
            <p className="cart-farmer-name">{item.farmerName || 'Farmer'}</p>
            <p className="cart-farmer-location">
              <MapPin size={10} />
              {item.pickupLocation || item.location || 'Location N/A'}
            </p>
          </div>
        </div>

        {/* Rating */}
        <div className="cart-item-rating">
          <div className="cart-item-stars">
            {renderStars(item.rating)}
          </div>
          <span className="cart-item-review-count">
            ({item.totalReviews || item.reviews || 0})
          </span>
        </div>

        {/* Stock badge */}
        <div className={`cart-stock-badge ${stockStatus}`}>
          <span className="cart-stock-dot"></span>
          {stockLabel[stockStatus]}
          {stockStatus === 'low-stock' && ` — only ${item.quantity ?? item.stock ?? 0} left`}
        </div>

        {/* Extra detail chips: harvest date, freshness, shelf life */}
        <div className="cart-item-extra-details">
          {harvestRelative && (
            <span className="cart-detail-chip">
              <Calendar size={10} />
              {harvestRelative}
            </span>
          )}
          {freshnessLabel && (
            <span className="cart-detail-chip cart-detail-chip-fresh">
              <Leaf size={10} />
              {freshnessLabel}
            </span>
          )}
          {item.specifications?.shelfLife && (
            <span className="cart-detail-chip">
              <Package size={10} />
              {item.specifications.shelfLife}
            </span>
          )}
        </div>
      </div>

      {/* Price per unit with original price & savings */}
      <div className="cart-item-unit-price">
        <span className="cart-unit-label">Price/{item.unit || 'kg'}</span>
        <span className="cart-unit-value">₹{Math.floor(item.price || 0)}</span>
        {item.originalPrice && item.originalPrice > item.price && (
          <>
            <span className="cart-unit-original">₹{Math.floor(item.originalPrice)}</span>
            {savingsPct && (
              <span className="cart-unit-savings">{savingsPct}% off</span>
            )}
          </>
        )}
      </div>

      {/* Quantity + Subtotal (grouped) */}
      <div className="cart-item-quantity-group">
        <div className="cart-item-quantity">
          <span className="cart-qty-label">Qty</span>
          <div className="cart-qty-controls">
            <button
              className="cart-qty-btn"
              onClick={() => onDecrement(item.id || item._id, item.quantity)}
              disabled={item.quantity <= 1 || isOutOfStock}
            >
              <Minus size={14} />
            </button>
            <input
              type="number"
              min="1"
              max={item.quantity ?? 999}
              value={item.quantity}
              onChange={e => onQuantityChange(item.id || item._id, e.target.value)}
              className="cart-qty-input"
              disabled={isOutOfStock}
            />
            <button
              className="cart-qty-btn"
              onClick={() => onIncrement(item.id || item._id, item.quantity)}
              disabled={isOutOfStock}
            >
              <Plus size={14} />
            </button>
          </div>
        </div>
        <div className="cart-item-subtotal">
          <span className="cart-subtotal-label">Subtotal</span>
          <span className="cart-subtotal-value">₹{((item.price || 0) * (item.quantity || 0)).toFixed(2)}</span>
        </div>
      </div>

      {/* Actions: Remove + Save for Later */}
      <div className="cart-item-actions">
        <button
          className="cart-item-remove"
          onClick={() => onRemove(item.id || item._id, item.name)}
          title="Remove item"
        >
          <Trash2 size={16} />
        </button>
        <button
          className="cart-item-save-later"
          onClick={() => {
            onRemove(item.id || item._id, item.name);
            // Could be extended to move to wishlist instead
          }}
          title="Save for later"
        >
          <Heart size={14} />
        </button>
      </div>
    </div>
  );
}
