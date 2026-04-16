import { X, ShoppingCart, Trash2 } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useRouter } from '../context/RouterContext';
import QuantitySelector from './QuantitySelector';
import './MiniCart.css';

export default function MiniCart({ isOpen, onClose }) {
  const { cart, removeFromCart, updateQuantity, getTotalPrice } = useCart();
  const { navigate } = useRouter();

  if (!isOpen) return null;

  const handleViewCart = () => {
    navigate('/cart');
    onClose();
  };

  const handleContinueShopping = () => {
    navigate('/marketplace');
    onClose();
  };

  const subtotal = getTotalPrice();
  const discount = subtotal * 0.05; // 5% discount
  const tax = (subtotal - discount) * 0.18; // 18% tax
  const total = subtotal - discount + tax;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Mini Cart Dropdown */}
      <div className="mini-cart-dropdown">
        {/* Header */}
        <div className="mini-cart-header">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <ShoppingCart size={20} /> Shopping Cart
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close cart"
          >
            <X size={20} className="text-gray-600" />
          </button>
        </div>

        {/* Items List */}
        <div className="mini-cart-items">
          {cart.length === 0 ? (
            <div className="empty-state">
              <div className="text-4xl mb-2">🛒</div>
              <p className="text-gray-600 font-medium">Your cart is empty</p>
              <p className="text-sm text-gray-500 mt-1">Start adding fresh produce!</p>
            </div>
          ) : (
            <div className="items-list">
              {cart.map((item) => (
                <div key={item.id} className="cart-item">
                  {/* Item Image */}
                  <div className="item-image">
                    {item.icon && item.icon.startsWith('http') ? (
                      <img src={item.icon} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-2xl">{item.icon || '🥬'}</span>
                    )}
                  </div>

                  {/* Item Info */}
                  <div className="item-info">
                    <h4 className="font-semibold text-gray-900 text-sm">{item.name}</h4>
                    <p className="text-xs text-gray-600">
                      ₹{item.price}/kg · Farmer: {item.farmer || 'Unknown'}
                    </p>
                  </div>

                  {/* Price */}
                  <div className="item-price">
                    <p className="text-green-600 font-bold">₹{(item.price * item.quantity).toFixed(2)}</p>
                  </div>

                  {/* Quantity Controls */}
                  <div className="item-qty">
                    <QuantitySelector
                      quantity={item.quantity}
                      onQuantityChange={(qty) => updateQuantity(item.id, qty)}
                      min={1}
                      max={100}
                      size="sm"
                    />
                  </div>

                  {/* Remove Button */}
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="item-remove"
                    title="Remove from cart"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {cart.length > 0 && (
          <div className="mini-cart-footer">
            {/* Price Breakdown */}
            <div className="price-summary">
              <div className="summary-row">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-semibold">₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="summary-row text-green-600">
                <span>Discount (5%)</span>
                <span className="font-semibold">-₹{discount.toFixed(2)}</span>
              </div>
              <div className="summary-row">
                <span className="text-gray-600">Tax (18%)</span>
                <span className="font-semibold">₹{tax.toFixed(2)}</span>
              </div>
              <div className="summary-row summary-total">
                <span className="font-bold text-gray-900">Total</span>
                <span className="font-bold text-green-600 text-lg">₹{total.toFixed(2)}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="action-buttons">
              <button
                onClick={handleViewCart}
                className="btn-primary"
              >
                View Full Cart
              </button>
              <button
                onClick={handleContinueShopping}
                className="btn-secondary"
              >
                Continue Shopping
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
