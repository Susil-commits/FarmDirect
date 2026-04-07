import React, { useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useRouter } from '../context/RouterContext';
import { useToast } from '../context/ToastContext';
import PageTransition from '../components/common/PageTransition.jsx';
import Button from '../components/common/Button';
import '../styles/ShoppingCart.css';

export default function ShoppingCart() {
  const { cart, removeFromCart, updateQuantity, clearCart, getTotalPrice } = useCart();
  const { navigate } = useRouter();
  const { addToast } = useToast();

  // Reset scroll position to top on page load
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleQuantityChange = (productId, quantity) => {
    const newQty = Math.max(1, parseInt(quantity) || 1);
    updateQuantity(productId, newQty);
  };

  const handleRemove = (productId, productName) => {
    removeFromCart(productId);
    addToast(`${productName} removed from cart`, 'info');
  };

  const handleCheckout = () => {
    if (cart.length === 0) {
      addToast('Cart is empty', 'warning');
      return;
    }
    navigate('/checkout');
  };

  const totalPrice = getTotalPrice();
  const discountPercent = 5;
  const discountAmount = (totalPrice * discountPercent) / 100;
  const finalTotal = totalPrice - discountAmount;
  const taxAmount = (finalTotal * 18) / 100;
  const grandTotal = finalTotal + taxAmount;

  return (
    <PageTransition>
      <div className="shopping-cart-page">
        <div className="container p-xl">
          <div className="cart-header animate-slide-in-down">
            <h1>Shopping Cart</h1>
            <p className="text-gray-500">
              {cart.length} item{cart.length !== 1 ? 's' : ''} in your cart
            </p>
          </div>

          <div className="cart-content">
            {/* Cart Items */}
            <div className="cart-items">
              {cart.length === 0 ? (
                <div className="empty-cart">
                  <div className="empty-icon animate-float">🛒</div>
                  <h2>Your cart is empty</h2>
                  <p>Browse our products and add items to your cart</p>
                  <Button
                    onClick={() => navigate('/marketplace')}
                    className="btn btn-primary"
                  >
                    Continue Shopping
                  </Button>
                </div>
              ) : (
                <div className="items-list">
                  {cart.map((item, idx) => (
                    <div
                      key={item.id}
                      className="cart-item card-glass stagger-item"
                      style={{ animationDelay: `${idx * 0.1}s` }}
                    >
                      <div className="item-image">
                        <div className="image-placeholder">
                          {item.icon || '🌾'}
                        </div>
                      </div>

                      <div className="item-details">
                        <h3 className="item-name">{item.name}</h3>
                        <p className="item-description">{item.description}</p>
                        <div className="item-meta">
                          <span className="badge badge-success">Fresh</span>
                          <span className="badge badge-info">Premium</span>
                        </div>
                      </div>

                      <div className="item-quantity">
                        <label htmlFor={`qty-${item.id}`} className="sr-only">
                          Quantity
                        </label>
                        <input
                          id={`qty-${item.id}`}
                          type="number"
                          min="1"
                          max="999"
                          value={item.quantity}
                          onChange={e => handleQuantityChange(item.id, e.target.value)}
                          className="qty-input"
                        />
                      </div>

                      <div className="item-price">
                        <div className="price-label">Unit</div>
                        <div className="price-value">₹{item.price}</div>
                      </div>

                      <div className="item-subtotal">
                        <div className="price-label">Subtotal</div>
                        <div className="price-value">
                          ₹{(item.price * item.quantity).toFixed(2)}
                        </div>
                      </div>

                      <button
                        className="item-remove hover-scale cursor-pointer"
                        onClick={() => handleRemove(item.id, item.name)}
                        title="Remove item"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Cart Summary */}
            {cart.length > 0 && (
              <div className="cart-summary card-glass animate-slide-in-right">
                <h2>Order Summary</h2>

                <div className="divider-subtle"></div>

                <div className="summary-row">
                  <span>Subtotal</span>
                  <span>₹{totalPrice.toFixed(2)}</span>
                </div>

                <div className="summary-row discount">
                  <span>Discount ({discountPercent}%)</span>
                  <span>- ₹{discountAmount.toFixed(2)}</span>
                </div>

                <div className="divider-subtle"></div>

                <div className="summary-row">
                  <span>Subtotal after discount</span>
                  <span>₹{finalTotal.toFixed(2)}</span>
                </div>

                <div className="summary-row tax">
                  <span>GST (18%)</span>
                  <span>+ ₹{taxAmount.toFixed(2)}</span>
                </div>

                <div className="divider-subtle"></div>

                <div className="summary-row total">
                  <span>Total Amount</span>
                  <span>₹{grandTotal.toFixed(2)}</span>
                </div>

                <button
                  onClick={handleCheckout}
                  className="btn btn-primary btn-lg w-full"
                >
                  Proceed to Checkout
                </button>

                <button
                  onClick={() => navigate('/marketplace')}
                  className="btn btn-ghost w-full"
                >
                  Continue Shopping
                </button>

                <button
                  onClick={() => {
                    if (window.confirm('Clear entire cart?')) {
                      clearCart();
                      addToast('Cart cleared', 'info');
                    }
                  }}
                  className="btn-text"
                >
                  Clear Cart
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
