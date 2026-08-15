import React, { useState, useEffect, useCallback } from 'react';
import { Wifi, WifiOff, X } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export default function NetworkStatusBanner() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [dismissed, setDismissed] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);
  const toast = useToast();

  const handleOnline = useCallback(() => {
    setIsOnline(true);
    setDismissed(false);
    if (wasOffline) {
      toast?.success?.('Connection restored. You\'re back online!', 4000);
    }
    setWasOffline(false);
  }, [wasOffline, toast]);

  const handleOffline = useCallback(() => {
    setIsOnline(false);
    setDismissed(false);
    setWasOffline(true);
  }, []);

  useEffect(() => {
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [handleOnline, handleOffline]);

  if (isOnline || dismissed) return null;

  return (
    <div
      role="alert"
      aria-live="assertive"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 99999,
        background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
        color: 'white',
        padding: '10px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        boxShadow: '0 2px 12px rgba(0,0,0,0.25)',
        fontSize: '14px',
        fontWeight: '500',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        animation: 'slideDown 0.3s ease',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <WifiOff size={18} style={{ flexShrink: 0 }} />
        <span>
          You&apos;re offline. Some features may not work until your connection is restored.
        </span>
      </div>
      <button
        onClick={() => setDismissed(true)}
        aria-label="Dismiss offline notice"
        style={{
          background: 'rgba(255,255,255,0.2)',
          border: 'none',
          borderRadius: '50%',
          width: '26px',
          height: '26px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: 'white',
          flexShrink: 0,
          transition: 'background 0.2s',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.35)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.2)'; }}
      >
        <X size={14} />
      </button>

      <style>{`
        @keyframes slideDown {
          from { transform: translateY(-100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
