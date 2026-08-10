/* eslint-disable react-refresh/only-export-components */
/* eslint-disable no-unused-vars */
import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { getAccessToken } from '../utils/tokenStore.js';

export const SocketContext = createContext(null);

const SOCKET_URL = import.meta.env.VITE_API_BASE_URL
  ? import.meta.env.VITE_API_BASE_URL.replace('/api', '')
  : 'http://localhost:5000';

export const SocketProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [typingUsers, setTypingUsers] = useState({});

  const listenersRef = useRef({});

  useEffect(() => {
    if (!isAuthenticated || !user?.id) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setConnected(false);
      return;
    }

    let isMounted = true;
    let socket = null;

    const initSocket = async () => {
      const token = getAccessToken();
      if (!token) return;

      const { io } = await import('socket.io-client');
      if (!isMounted) return;

      socket = io(SOCKET_URL, {
        auth: { token, role: user.role },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 10000,
      });

      socketRef.current = socket;

      socket.on('connect', () => {
        setConnected(true);
      });

      socket.on('disconnect', (reason) => {
        setConnected(false);
      });

      socket.on('user:online', ({ userId }) => {
        setOnlineUsers((prev) => new Set([...prev, userId]));
      });

      socket.on('user:offline', ({ userId }) => {
        setOnlineUsers((prev) => {
          const next = new Set(prev);
          next.delete(userId);
          return next;
        });
      });

      socket.on('typing:start', ({ conversationId, userId }) => {
        setTypingUsers((prev) => ({ ...prev, [conversationId]: userId }));
      });

      socket.on('typing:stop', ({ conversationId }) => {
        setTypingUsers((prev) => {
          const next = { ...prev };
          delete next[conversationId];
          return next;
        });
      });

      socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error.message);
      });
    };

    initSocket();

    return () => {
      isMounted = false;
      if (socket) {
        socket.disconnect();
      } else if (socketRef.current) {
        socketRef.current.disconnect();
      }
      socketRef.current = null;
      setConnected(false);
    };
  }, [isAuthenticated, user?.id, user?.role]);

  const subscribe = useCallback((event, handler) => {
    if (!socketRef.current) return () => {};

    socketRef.current.on(event, handler);

    if (!listenersRef.current[event]) {
      listenersRef.current[event] = [];
    }
    listenersRef.current[event].push(handler);

    return () => {
      socketRef.current?.off(event, handler);
      if (listenersRef.current[event]) {
        listenersRef.current[event] = listenersRef.current[event].filter((h) => h !== handler);
      }
    };
  }, []);

  const joinOrder = useCallback((orderId) => {
    socketRef.current?.emit('join:order', orderId);
  }, []);

  const leaveOrder = useCallback((orderId) => {
    socketRef.current?.emit('leave:order', orderId);
  }, []);

  const joinConversation = useCallback((conversationId) => {
    socketRef.current?.emit('join:conversation', conversationId);
  }, []);

  const leaveConversation = useCallback((conversationId) => {
    socketRef.current?.emit('leave:conversation', conversationId);
  }, []);

  const sendTypingStart = useCallback((conversationId, receiverId) => {
    socketRef.current?.emit('typing:start', { conversationId, receiverId });
  }, []);

  const sendTypingStop = useCallback((conversationId, receiverId) => {
    socketRef.current?.emit('typing:stop', { conversationId, receiverId });
  }, []);

  const isUserOnline = useCallback(
    (userId) => onlineUsers.has(userId),
    [onlineUsers]
  );

  const isTyping = useCallback(
    (conversationId) => !!typingUsers[conversationId],
    [typingUsers]
  );

  const value = {
    socket: socketRef,
    connected,
    onlineUsers,
    typingUsers,
    subscribe,
    joinOrder,
    leaveOrder,
    joinConversation,
    leaveConversation,
    sendTypingStart,
    sendTypingStop,
    isUserOnline,
    isTyping,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export default SocketContext;