import React from 'react';
import { Bell } from 'lucide-react';
import './EmptyCartWishlistModal.css';

export default function NotificationEmptyModal({ onClose }) {
  return (
    <div className="empty-modal-overlay" onClick={onClose}>
      <div className="empty-modal-tooltip" onClick={(e) => e.stopPropagation()}>
        <div className="tooltip-arrow"></div>
        <div className="tooltip-content">
          <p className="tooltip-message">No New Messages</p>
          <div className="flex items-center justify-center gap-2 text-gray-500 text-sm mt-2">
            <Bell size={16} />
            <span>All caught up!</span>
          </div>
        </div>
      </div>
    </div>
  );
}
