import React from 'react';
import { X, AlertTriangle } from 'lucide-react';
import Button from './Button';
import './LogoutConfirmationModal.css';

export default function LogoutConfirmationModal({ onConfirm, onCancel }) {
  return (
    <div className="logout-confirmation-overlay" onClick={onCancel}>
      <div className="logout-confirmation-modal" onClick={(e) => e.stopPropagation()}>
        {}
        <button
          onClick={onCancel}
          className="logout-close-btn"
          aria-label="Close modal"
        >
          <X size={20} />
        </button>

        {}
        <div className="logout-modal-content">
          {}
          <div className="logout-modal-icon">
            <AlertTriangle size={48} />
          </div>

          {}
          <h2 className="logout-modal-title">Confirm Logout</h2>

          {}
          <p className="logout-modal-description">
            Are you sure you want to logout? You will need to login again to access your account.
          </p>

          {}
          <div className="logout-modal-actions">
            <Button
              onClick={onConfirm}
              variant="danger"
              className="logout-btn-confirm"
            >
              Yes, Logout
            </Button>
            <Button
              onClick={onCancel}
              variant="secondary"
              className="logout-btn-cancel"
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
