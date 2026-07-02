import { useState } from 'react';
import { Tag, X, Loader, CheckCircle } from 'lucide-react';
import { couponService } from '../../services/appService';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';

/**
 * CouponInput — reusable promo-code field.
 * Validates against the backend (server is source of truth) and stores the
 * applied coupon in CartContext so both the cart and checkout see the discount.
 *
 * Props:
 *   amount  - subtotal to validate the coupon against (defaults to cart total)
 *   onApplied - optional callback(coupon) when a coupon is successfully applied
 *   variant  - 'cart' | 'checkout' (visual tweak)
 */
export default function CouponInput({ amount, onApplied, variant = 'cart' }) {
  const { appliedCoupon, applyCoupon, removeCoupon, getTotalPrice } = useCart();
  const { addToast } = useToast();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const subtotal = amount !== undefined ? amount : getTotalPrice();

  const handleApply = async () => {
    const trimmed = code.trim();
    if (!trimmed) {
      addToast('Please enter a coupon code', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await couponService.validate(trimmed, subtotal);
      const coupon = res?.coupon || res;
      const discountAmount = res?.discountAmount ?? coupon?.discountAmount ?? 0;

      applyCoupon({
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
        description: coupon.description,
        discountAmount,
      });
      addToast(`Coupon "${coupon.code}" applied! You saved ₹${discountAmount}`, 'success');
      setCode('');
      if (onApplied) onApplied(coupon);
    } catch (err) {
      addToast(err?.response?.data?.message || err?.message || 'Invalid coupon code', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = () => {
    removeCoupon();
    addToast('Coupon removed', 'info');
  };

  if (appliedCoupon) {
    return (
      <div
        className={`flex items-center justify-between gap-3 rounded-xl border-2 border-green-200 bg-green-50 px-4 py-3 ${
          variant === 'checkout' ? 'my-2' : ''
        }`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-bold text-green-800 truncate">
              {appliedCoupon.code} applied
            </p>
            <p className="text-xs text-green-600">
              {appliedCoupon.type === 'percentage'
                ? `${appliedCoupon.value}% off`
                : `₹${appliedCoupon.value} off`}{' '}
              · You save ₹{appliedCoupon.discountAmount}
            </p>
          </div>
        </div>
        <button
          onClick={handleRemove}
          className="flex-shrink-0 p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition"
          aria-label="Remove coupon"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div className="relative flex-1">
        <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          onKeyDown={(e) => e.key === 'Enter' && handleApply()}
          placeholder="Enter promo code"
          className="w-full pl-9 pr-3 py-2.5 text-sm border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none transition uppercase placeholder:normal-case"
        />
      </div>
      <button
        onClick={handleApply}
        disabled={loading || !code.trim()}
        className="flex-shrink-0 px-4 py-2.5 text-sm font-semibold text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-300 rounded-xl transition flex items-center gap-1.5"
      >
        {loading ? <Loader className="w-4 h-4 animate-spin" /> : null}
        Apply
      </button>
    </div>
  );
}
