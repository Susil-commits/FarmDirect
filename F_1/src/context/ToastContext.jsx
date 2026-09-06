
import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';

export const ToastContext = createContext();

export function ToastProvider({ children }) {
  const removeToastRef = useRef(null);
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 5000) => {
    if (!message) return null;
    const id = Date.now() + Math.random();
    const toast = { id, message, type, duration };

    setToasts(prev => [...prev, toast]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, duration);
    }

    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  useEffect(() => {
    removeToastRef.current = removeToast;
  }, [removeToast]);

  const wakingToastIdRef = useRef(null);

  useEffect(() => {
    const handleWaking = () => {
      // If server is already marked awake in session, never show waking toast again
      try {
        if (sessionStorage.getItem('farm_server_awake') === 'true') {
          return;
        }
      } catch {}

      if (!wakingToastIdRef.current) {
        wakingToastIdRef.current = addToast('Connecting to server…', 'info', 0);
      }
    };

    const handleReady = () => {
      try {
        sessionStorage.setItem('farm_server_awake', 'true');
      } catch {}

      if (wakingToastIdRef.current) {
        removeToast(wakingToastIdRef.current);
        wakingToastIdRef.current = null;
        addToast('Connected!', 'success', 2500);
      }
    };

    window.addEventListener('farm-server-waking', handleWaking);
    window.addEventListener('farm-server-ready', handleReady);

    return () => {
      window.removeEventListener('farm-server-waking', handleWaking);
      window.removeEventListener('farm-server-ready', handleReady);
    };
  }, [addToast, removeToast]);

  const success = useCallback((msg, duration) => addToast(msg, 'success', duration), [addToast]);
  const error = useCallback((msg, duration) => addToast(msg, 'error', duration ?? 6000), [addToast]);
  const warning = useCallback((msg, duration) => addToast(msg, 'warning', duration ?? 6000), [addToast]);
  const info = useCallback((msg, duration) => addToast(msg, 'info', duration), [addToast]);

  const networkError = useCallback(() => {
    addToast('You appear to be offline. Please check your connection.', 'error', 8000);
  }, [addToast]);

  const validationErrors = useCallback((errors) => {
    if (!errors) return;
    let messages;
    if (Array.isArray(errors)) {
      messages = errors.filter(Boolean);
    } else if (typeof errors === 'object') {
      messages = Object.values(errors).filter(Boolean);
    } else {
      messages = [String(errors)];
    }
    if (messages.length === 0) return;
    const text = messages.slice(0, 3).join(' • ');
    addToast(text, 'error', 7000);
  }, [addToast]);

  const value = {
    addToast,
    removeToast,
    toasts,
    success,
    error,
    warning,
    info,
    networkError,
    validationErrors,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToastContext() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToastContext must be used within ToastProvider');
  }
  return context;
}

function ToastContainer({ toasts, onRemove }) {
  return (
    <div className="toast-container">
      {toasts.map(toast => (
        <Toast key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
}

function Toast({ toast, onRemove }) {
  const getIcon = () => {
    switch (toast.type) {
      case 'success': return '✓';
      case 'error': return '✕';
      case 'warning': return '⚠';
      default: return 'ℹ';
    }
  };

  return (
    <div className={`toast toast-${toast.type} animate-slide-in-right`}>
      <div className="toast-content">
        <span className={`toast-icon toast-icon-${toast.type}`}>
          {getIcon()}
        </span>
        <span className="toast-message">{toast.message}</span>
      </div>
      <button
        className="toast-close"
        onClick={() => onRemove(toast.id)}
        aria-label="Close notification"
      >
        ×
      </button>
    </div>
  );
}

export const useToast = useToastContext;
