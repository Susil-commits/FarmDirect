import React from 'react';
import { LogIn } from 'lucide-react';
import { useRouter } from '../../hooks/useRouter';
import './EmptyCartWishlistModal.css';

export default function EmptyCartWishlistModal({ type = 'cart', onClose }) {
  const { navigate } = useRouter();
  const message = type === 'cart' ? 'Cart is Empty' : 'Wishlist is Empty';

  const handleLoginClick = () => {
    onClose();
    navigate('/auth/login');
  };

  return (
    <>
      <div className="fixed inset-0 z-[998] bg-transparent" onClick={onClose}></div>
      <div className="absolute top-full right-0 mt-3 z-[999]" onClick={(e) => e.stopPropagation()}>
        <div className="empty-modal-tooltip">
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
    </>
  );
}
