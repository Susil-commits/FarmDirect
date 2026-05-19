import React, { useState, useEffect, useMemo } from 'react';
import { MapPin, Star, Trash2, Minus, Plus, ShoppingBag, ArrowLeft, Check, Leaf, Calendar, Heart, Package, Loader } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useRouter } from '../context/RouterContext';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { orderService } from '../services/appService';
import PageTransition from '../components/common/PageTransition.jsx';
import Button from '../components/common/Button';
import '../styles/ShoppingCart.css';

export default function ShoppingCart() {
  const { cart, removeFromCart, updateQuantity, clearCart, getTotalPrice } = useCart();
  const { navigate } = useRouter();
  const { addToast } = useToast();
  const { isAuthenticated, user } = useAuth();
  const [checkoutLoading, setCheckoutLoading] = useState(false);

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
      let successCount = 0;
      let failedItems = [];

      for (const item of cart) {
        try {
          const orderData = {
            cropId: item._id || item.id,
            quantity: item.quantity || 1,
            unitPrice: item.price,
            totalAmount: (item.price * (item.quantity || 1)),
            paymentMethod: 'cod',
          };
          await orderService.createOrder(orderData);
          successCount++;
        } catch (err) {
          console.error(`Failed to create order for ${item.cropName}:`, err);
          failedItems.push(item.cropName || 'Unknown item');
        }
      }

      if (successCount > 0) {
        addToast(
          `${successCount} order(s) placed successfully! The farmer(s) will be notified.${failedItems.length > 0 ? ` ${failedItems.length} failed.` : ''}`,
          successCount === cart.length ? 'success' : 'warning'
        );
      }

      if (failedItems.length > 0) {
        addToast(`Failed items: ${failedItems.join(', ')}. Please try again.`, 'error');
      }

      if (successCount > 0) {
        clearCart();
      }
    } catch (err) {
      console.error('Checkout error:', err);
      addToast('Failed to place order. Please try again.', 'error');
    } finally {
      setCheckoutLoading(false);
    }
  };

  const totalPrice = getTotalPrice();
  const discountPercent = cart.length >= 3 ? 10 : cart.length >= 2 ? 5 : 0;
  const discountAmount = (totalPrice * discountPercent) / 100;
  const finalTotal = totalPrice - discountAmount;
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
                    <span>₹{finalTotal.toFixed(2)}</span>
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

                  <button
                    onClick={handleCheckout}
                    className="cart-checkout-btn"
                    disabled={checkoutLoading}
                  >
                    {checkoutLoading ? (
                      <>
                        <Loader size={18} className="animate-spin" /> Placing Order...
                      </>
                    ) : (
                      'Proceed to Checkout'
                    )}
                  </button>

                  <button
                    onClick={() => navigate('/marketplace')}
                    className="cart-continue-btn"
                  >
                    <ArrowLeft size={16} />
                    Continue Shopping
                  </button>

                  {/* Trust Badges */}
                  <div className="cart-trust-row">
                    <span>🔒 Secure Checkout</span>
                    <span>🚚 Fast Delivery</span>
                    <span>✅ Quality Assured</span>
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
  const itemImage = item.image || item.images?.[0];
  const [imgError, setImgError] = useState(false);
  const showFallback = !itemImage || imgError || !(itemImage.startsWith?.('http') || itemImage.startsWith?.('/'));

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
        {!showFallback && itemImage ? (
          <img
            src={itemImage}
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
