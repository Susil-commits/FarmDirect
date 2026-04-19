import React from 'react';
import { LogIn } from 'lucide-react';
import { useRouter } from '../../context/RouterContext';
import './EmptyCartWishlistModal.css';

export default function EmptyCartWishlistModal({ type = 'cart', onClose }) {
  const { navigate } = useRouter();
  const message = type === 'cart' ? 'Cart is Empty' : 'Wishlist is Empty';

  const handleLoginClick = () => {
    onClose();
    navigate('/auth/login');
  };

  return (
    <div className="empty-modal-overlay" onClick={onClose}>
      <div className="empty-modal-tooltip" onClick={(e) => e.stopPropagation()}>
        <div className="tooltip-arrow"></div>
        <div className="tooltip-content">
          <p className="tooltip-message">{message}</p>
          <button 
            className="tooltip-login-btn"
            onClick={handleLoginClick}
          >
            <LogIn size={16} /> Login
          </button>
        </div>
      </div>
    </div>
  );
}
