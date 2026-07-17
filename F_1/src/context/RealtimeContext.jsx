/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useCallback } from 'react';
import { useSocket } from './SocketContext';
import { useToast } from './ToastContext';
import { useAuth } from './AuthContext';
import {
  requestNotificationPermission,
  notifyIfBackground,
} from '../hooks/useBrowserNotifications';

/**
 * RealtimeProvider
 * ---------------
 * Central listener for all socket events that the backend emits but the rest
 * of the app previously ignored (orders, crop interest, KYC, user status).
 *
 * Responsibilities:
 *  1. Subscribe once to every server-pushed event.
 *  2. Show an in-app toast for each meaningful event (foreground).
 *  3. Fire an OS-level browser notification when the tab is hidden.
 *  4. Expose "signals" (latest event objects) as state so pages can react
 *     instantly — e.g. OrderTrackingNew / OrderDetails refresh when an
 *     order:updated arrives.
 *
 * Note: `notification:new` and chat `message:new` are handled by their own
 * contexts (NotificationContext / ChatContext). This provider covers the rest.
 */
export const RealtimeContext = createContext(null);

export const RealtimeProvider = ({ children }) => {
  const { subscribe, connected } = useSocket();
  const { addToast } = useToast();
  const { user } = useAuth();

  // Latest event signals held as state. Each is replaced with a fresh object
  // on every event so consumers' useEffect deps change and they react instantly.
  const [orderEvent, setOrderEvent] = React.useState(null);
  const [cropInterestEvent, setCropInterestEvent] = React.useState(null);
  const [kycEvent, setKycEvent] = React.useState(null);
  const [userStatusEvent, setUserStatusEvent] = React.useState(null);

  // Request browser-notification permission once, after the user authenticates.
  // We don't prompt on public pages or before login.
  useEffect(() => {
    if (!user) return;
    requestNotificationPermission();
  }, [user]);

  // ---- Toast + browser-push helper ----
  const announce = useCallback(
    (toastType, message, browserTitle, browserBody, browserTag) => {
      // Foreground: in-app toast
      addToast(message, toastType);
      // Background: OS notification (no-op when tab is visible)
      notifyIfBackground(browserTitle, browserBody, { tag: browserTag });
    },
    [addToast]
  );

  // ---- Order events ----
  // Backend `notifyOrderUpdate` emits per-user as `order:updated` (covers
  // created / statusUpdated / cancelled). data: { orderId, orderNumber,
  // orderStatus, cropName, totalAmount, role, updatedAt }
  useEffect(() => {
    if (!connected) return;

    const unsub = subscribe('order:updated', (data) => {
      if (!data) return;
      setOrderEvent({ ...data, _ts: Date.now() });

      const statusLabel = data.orderStatus?.replace(/_/g, ' ') || 'updated';
      const roleLabel = data.role ? ` (${data.role})` : '';
      const message = `Order #${data.orderNumber || data.orderId} for "${data.cropName || 'item'}" is now ${statusLabel}${roleLabel}.`;
      const tone = data.orderStatus === 'cancelled' ? 'warning' : 'success';

      announce(
        tone,
        message,
        `Order ${statusLabel}`,
        `#${data.orderNumber || ''} ${data.cropName || ''} — ${statusLabel}`,
        `order-${data.orderId}`
      );
    });

    return () => unsub();
  }, [connected, subscribe, announce]);

  // ---- Crop interest events (farmer notified when a buyer marks interest) ----
  useEffect(() => {
    if (!connected) return;
    const unsub = subscribe('crop:interest', (data) => {
      if (!data) return;
      setCropInterestEvent({ ...data, _ts: Date.now() });
      announce(
        'info',
        `${data.buyerName || 'A buyer'} is interested in your "${data.cropName || 'crop'}".`,
        'New crop interest',
        `${data.buyerName || 'Buyer'} interested in ${data.cropName || 'your crop'}`,
        `crop-${data.cropId}`
      );
    });
    return () => unsub();
  }, [connected, subscribe, announce]);

  // ---- KYC status updates (verified / rejected) ----
  useEffect(() => {
    if (!connected) return;
    const unsub = subscribe('kyc:updated', (data) => {
      if (!data) return;
      setKycEvent({ ...data, _ts: Date.now() });
      const ok = data.kycStatus === 'verified';
      announce(
        ok ? 'success' : 'warning',
        ok
          ? 'Your KYC has been verified! You now have full access.'
          : `KYC update: ${data.kycStatus || 'rejected'}${data.rejectionReason ? ` — ${data.rejectionReason}` : ''}`,
        'KYC ' + (data.kycStatus || 'updated'),
        data.rejectionReason || data.kycStatus || '',
        'kyc'
      );
    });
    return () => unsub();
  }, [connected, subscribe, announce]);

  // ---- User status changes (frozen/suspended by admin) ----
  useEffect(() => {
    if (!connected) return;
    const unsub = subscribe('user:statusChanged', (data) => {
      if (!data) return;
      setUserStatusEvent({ ...data, _ts: Date.now() });
      announce(
        'warning',
        `Your account status changed to "${data.status}"${data.reason ? ` — ${data.reason}` : ''}.`,
        'Account ' + (data.status || 'updated'),
        data.reason || data.status || '',
        'user-status'
      );
    });
    return () => unsub();
  }, [connected, subscribe, announce]);

  const value = {
    connected,
    orderEvent,
    cropInterestEvent,
    kycEvent,
    userStatusEvent,
  };

  return (
    <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>
  );
};

export function useRealtime() {
  const context = useContext(RealtimeContext);
  if (!context) {
    throw new Error('useRealtime must be used within RealtimeProvider');
  }
  return context;
}

export default RealtimeContext;
