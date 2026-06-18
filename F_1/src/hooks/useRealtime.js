import { useEffect, useState, useCallback } from 'react';
import { useSocket } from '../context/SocketContext';

export const useRealtimeOrder = (orderId) => {
  const { subscribe, joinOrder, leaveOrder, connected } = useSocket();
  const [order, setOrder] = useState(null);
  const [lastEvent, setLastEvent] = useState(null);

  useEffect(() => {
    if (!orderId || !connected) return;

    joinOrder(orderId);

    const unsubCreated = subscribe('order:created', (data) => {
      if (data.orderId === orderId || data.orderId?._id === orderId) {
        setLastEvent({ type: 'created', data });
      }
    });

    const unsubUpdated = subscribe('order:updated', (data) => {
      const matchId = data.orderId === orderId || data.orderId?._id === orderId;
      if (matchId) {
        setOrder((prev) => ({ ...prev, ...data }));
        setLastEvent({ type: 'updated', data });
      }
    });

    const unsubStatus = subscribe('order:statusUpdated', (data) => {
      const matchId = data.orderId === orderId || data.orderId?._id === orderId;
      if (matchId) {
        setOrder((prev) => ({ ...prev, ...data, orderStatus: data.orderStatus }));
        setLastEvent({ type: 'statusUpdated', data });
      }
    });

    const unsubCancelled = subscribe('order:cancelled', (data) => {
      const matchId = data.orderId === orderId || data.orderId?._id === orderId;
      if (matchId) {
        setOrder((prev) => ({ ...prev, ...data, orderStatus: 'cancelled' }));
        setLastEvent({ type: 'cancelled', data });
      }
    });

    return () => {
      leaveOrder(orderId);
      unsubCreated();
      unsubUpdated();
      unsubStatus();
      unsubCancelled();
    };
  }, [orderId, connected, subscribe, joinOrder, leaveOrder]);

  const clearLastEvent = useCallback(() => setLastEvent(null), []);

  return { order, lastEvent, clearLastEvent, connected };
};

export const useRealtimeNotifications = () => {
  const { subscribe, connected } = useSocket();
  const [newNotifications, setNewNotifications] = useState([]);
  const [unreadIncrement, setUnreadIncrement] = useState(0);

  useEffect(() => {
    if (!connected) return;

    const unsubNew = subscribe('notification:new', (notification) => {
      setNewNotifications((prev) => [notification, ...prev].slice(0, 50));
      setUnreadIncrement((prev) => prev + 1);
    });

    const unsubKYC = subscribe('kyc:updated', (data) => {
      setNewNotifications((prev) => [
        {
          id: `kyc-${Date.now()}`,
          title: data.kycStatus === 'verified' ? 'KYC Approved ✅' : 'KYC Rejected ❌',
          message: data.kycStatus === 'verified'
            ? 'Your KYC has been verified!'
            : `Your KYC was rejected. Reason: ${data.rejectionReason || 'Not specified'}`,
          type: 'kyc',
          priority: 'high',
          createdAt: new Date(),
        },
        ...prev,
      ].slice(0, 50));
    });

    const unsubStatus = subscribe('user:statusChanged', (data) => {
      setNewNotifications((prev) => [
        {
          id: `status-${Date.now()}`,
          title: `Account ${data.status === 'suspended' ? 'Suspended ⚠️' : data.status === 'banned' ? 'Banned 🚫' : 'Reactivated ✅'}`,
          message: data.reason || `Your account status has been changed to ${data.status}.`,
          type: 'system',
          priority: 'high',
          createdAt: new Date(),
        },
        ...prev,
      ].slice(0, 50));
    });

    return () => {
      unsubNew();
      unsubKYC();
      unsubStatus();
    };
  }, [connected, subscribe]);

  const clearUnreadIncrement = useCallback(() => {
    setUnreadIncrement(0);
  }, []);

  const clearNewNotifications = useCallback(() => {
    setNewNotifications([]);
  }, []);

  return {
    newNotifications,
    unreadIncrement,
    clearUnreadIncrement,
    clearNewNotifications,
    connected,
  };
};