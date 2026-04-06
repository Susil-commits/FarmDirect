import React from 'react';
import { X, LogIn, UserPlus } from 'lucide-react';
import Button from '../common/Button';
import Card from '../common/Card';
import '../styles/LoginPrompt.css';

export default function LoginPrompt({ isOpen, onClose, onLogin, onRegister, message }) {
  if (!isOpen) return null;

  return (
    <div className="login-prompt-overlay" onClick={onClose}>
      <Card variant="deep" className="login-prompt-modal animate-scale-in" onClick={e => e.stopPropagation()}>
        <div className="login-prompt-header">
          <h2 className="text-2xl font-bold text-gray-900">Login Required</h2>
          <button
            onClick={onClose}
            className="close-button hover:bg-gray-200 rounded-full p-2 transition cursor-pointer"
            aria-label="Close"
          >
            <X size={24} className="text-gray-600" />
          </button>
        </div>

        <div className="login-prompt-content">
          <div className="prompt-icon mb-6">🔐</div>
          
          <p className="text-gray-700 text-center mb-6 text-lg">
            {message || "Login to your account to proceed with your order"}
          </p>

          <p className="text-gray-600 text-center text-sm mb-8 leading-relaxed">
            👉 Our secure login ensures your personal information and payments are protected. 
            It only takes a moment!
          </p>

          <div className="login-prompt-buttons space-y-3">
            <Button
              onClick={onLogin}
              variant="primary"
              size="md"
              className="w-full flex items-center justify-center gap-2"
            >
              <LogIn size={20} />
              Login to Your Account
            </Button>

            <div className="divider text-gray-600 text-sm">or</div>

            <Button
              onClick={onRegister}
              variant="secondary"
              size="md"
              className="w-full flex items-center justify-center gap-2"
            >
              <UserPlus size={20} />
              Create New Account
            </Button>
          </div>

          <button
            onClick={onClose}
            className="mt-6 w-full py-2 text-gray-600 hover:text-gray-900 font-medium transition text-sm cursor-pointer"
          >
            Continue Browsing
          </button>
        </div>

        <div className="login-prompt-footer">
          <p className="text-xs text-gray-500 text-center">
            ✅ Trusted by farmers and buyers across India
          </p>
        </div>
      </Card>
    </div>
  );
}
