import { Minus, Plus } from 'lucide-react';
import './QuantitySelector.css';

export default function QuantitySelector({ 
  quantity = 1, 
  onQuantityChange, 
  min = 1, 
  max = 100,
  size = 'md'
}) {
  const handleDecrement = () => {
    if (quantity > min) {
      onQuantityChange(quantity - 1);
    }
  };

  const handleIncrement = () => {
    if (quantity < max) {
      onQuantityChange(quantity + 1);
    }
  };

  const handleInputChange = (e) => {
    const value = parseInt(e.target.value) || 1;
    if (value >= min && value <= max) {
      onQuantityChange(value);
    }
  };

  const sizeClasses = {
    sm: 'qty-selector-sm',
    md: 'qty-selector-md',
    lg: 'qty-selector-lg'
  };

  return (
    <div className={`quantity-selector ${sizeClasses[size]}`}>
      <button
        onClick={handleDecrement}
        disabled={quantity <= min}
        className="qty-btn qty-btn-minus"
        title="Decrease quantity"
        aria-label="Decrease quantity"
      >
        <Minus size={16} />
      </button>
      
      <input
        type="number"
        min={min}
        max={max}
        value={quantity}
        onChange={handleInputChange}
        className="qty-input"
        aria-label="Quantity"
      />
      
      <button
        onClick={handleIncrement}
        disabled={quantity >= max}
        className="qty-btn qty-btn-plus"
        title="Increase quantity"
        aria-label="Increase quantity"
      >
        <Plus size={16} />
      </button>
    </div>
  );
}
