
import { createContext, useState, useContext, useEffect, useCallback, useRef } from 'react';
import messageService from '../services/messageService';
import { AuthContext } from './AuthContext';
import { useSocket } from './SocketContext';

const ChatContext = createContext();

export function ChatProvider({ children }) {
  const [conversations, setConversations] = useState([]);
  const [currentChat, setCurrentChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const fetchUnreadCountRef = useRef(() => {});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const lastMessageIdRef = useRef(null);

  const pollingUnreadRef = useRef(false);
  const pollingMessagesRef = useRef(false);

  const unwrapData = (response) => {
    if (!response) return response;
    if (response.data !== undefined && response.success !== undefined) {
      return response.data;
    }
    return response;
  };

  const fetchConversations = useCallback(async () => {
    try {
      setLoading(true);
      const response = await messageService.getConversations();
      const data = unwrapData(response);
      setConversations(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
      console.error('Failed to fetch conversations:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMessages = useCallback(async (receiverId, page = 1) => {
    try {
      setLoading(true);
      const response = await messageService.getConversation(receiverId, page);
      const data = unwrapData(response);
      const msgs = Array.isArray(data) ? data : [];
      setMessages(msgs);
      setCurrentChat(receiverId);
      
      if (msgs.length > 0) {
        lastMessageIdRef.current = msgs[msgs.length - 1]._id;
      } else {
        lastMessageIdRef.current = null;
      }
    } catch (err) {
      setError(err.message);
      console.error('Failed to fetch messages:', err);
    } finally {
       
      setLoading(false);
    }
       
  }, []);

  const sendMessage = useCallback(async (receiverId, content, cropId = null) => {
    try {
      const response = await messageService.sendMessage(receiverId, content, cropId);
      const messageData = unwrapData(response);
      setMessages((prev) => {
        const updated = [...prev, messageData];
        if (messageData._id) {
          lastMessageIdRef.current = messageData._id;
        }
        return updated;
      });

      await fetchConversations();

      return messageData;
    } catch (err) {
      setError(err.message);
       
      console.error('Failed to send message:', err);
      throw err;
    }
       
  }, [fetchConversations]);

  const markAsRead = useCallback(async (messageId) => {
    try {
      await messageService.markMessageAsRead(messageId);
      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === messageId ? { ...msg, isRead: true } : msg
        )
      );
      fetchUnreadCountRef.current();
    } catch (err) {
      console.error('Failed to mark message as read:', err);
    }
  }, []);

  const markConversationAsRead = useCallback(async (receiverId) => {
    try {
      await messageService.markConversationAsRead(receiverId);
      setMessages((prev) =>
        prev.map((msg) => ({
          ...msg,
          isRead: true,
        }))
      );
      
      setConversations((prev) =>
        prev.map((conv) =>
          conv.otherUser?._id === receiverId ? { ...conv, unreadCount: 0 } : conv
        )
      );
      fetchUnreadCountRef.current();
    } catch (err) {
      console.error('Failed to mark conversation as read:', err);
       
    }
  }, []);
       
  const fetchUnreadCount = useCallback(async () => {
    if (pollingUnreadRef.current) return; 
    pollingUnreadRef.current = true;
    try {
      const response = await messageService.getUnreadCount();
      const data = unwrapData(response);
      setUnreadCount(data?.totalUnread || data?.totalUnread === 0 ? data.totalUnread : 0);
    } catch (err) {
      console.error('Failed to fetch unread count:', err);
    } finally {
      pollingUnreadRef.current = false;
    }
  }, []);

  useEffect(() => { fetchUnreadCountRef.current = fetchUnreadCount; }, [fetchUnreadCount]);

  const deleteMessage = useCallback(async (messageId) => {
    try {
      await messageService.deleteMessage(messageId);
      setMessages((prev) => prev.filter((msg) => msg._id !== messageId));
    } catch (err) {
      setError(err.message);
      console.error('Failed to delete message:', err);
      throw err;
    }
  }, []);

  const searchMessages = useCallback(async (query, receiverId) => {
    try {
      const data = await messageService.searchMessages(query, receiverId);
      return Array.isArray(data) ? data : [];
    } catch (err) {
      console.error('Failed to search messages:', err);
      return [];
    }
  }, []);

  const blockUser = useCallback(async (userId) => {
    try {
      const response = await messageService.toggleBlockUser(userId);
      return response.blocked;
    } catch (err) {
      console.error('Failed to block user:', err);
      throw err;
    }
  }, []);

  const { user } = useContext(AuthContext);
  const isAuthenticated = Boolean(user);

  const { subscribe: subscribeSocket, connected: socketConnected } = useSocket();

  const normalizeSocketMessage = useCallback(
    (msg) => ({
      _id: msg.id,
      senderId: { _id: msg.senderId },
      receiverId: { _id: user?._id },
      content: msg.content,
      type: msg.type || 'text',
      isRead: false,
      createdAt: msg.createdAt,
      conversationId: msg.conversationId,
      cropId: msg.cropId || null,
      orderId: msg.orderId || null,
    }),
    [user?._id]
  );

  const convRefreshTimer = useRef(null);
  const scheduleConversationRefresh = useCallback(() => {
    if (convRefreshTimer.current) clearTimeout(convRefreshTimer.current);
    convRefreshTimer.current = setTimeout(() => {
      fetchConversations();
      fetchUnreadCountRef.current();
    }, 1500);
  }, [fetchConversations]);

  useEffect(() => {
    if (!socketConnected || !isAuthenticated) return;

    const unsub = subscribeSocket('message:new', (msg) => {
      if (!msg || !msg.id) return;
      const incomingSenderId = String(msg.senderId);

      if (currentChat && incomingSenderId === String(currentChat)) {
        
        setMessages((prev) => {
          if (prev.some((m) => m._id === msg.id)) return prev;
          lastMessageIdRef.current = msg.id;
          return [...prev, normalizeSocketMessage(msg)];
        });
        
        messageService.markConversationAsRead(currentChat).catch(() => {});
       
      } else {
        
        setUnreadCount((prev) => prev + 1);
        scheduleConversationRefresh();
      }
    });

    return () => unsub();
       
  }, [
    socketConnected,
    isAuthenticated,
       
    currentChat,
    subscribeSocket,
    normalizeSocketMessage,
    scheduleConversationRefresh,
  ]);

  useEffect(() => {
    if (!isAuthenticated) {
       
      setCurrentChat(null);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;
    let interval;
    let active = true;

    const poll = () => { if (active) fetchUnreadCountRef.current(); };
    poll(); 
    interval = setInterval(poll, 30000);

    const onVis = () => {
      active = !document.hidden;
      if (active) poll();
    };
    document.addEventListener('visibilitychange', onVis);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [fetchUnreadCount, isAuthenticated]);

  useEffect(() => {
    if (!currentChat || !isAuthenticated) return;

    let interval;
    let active = true;

    const poll = async () => {
      if (!active || !currentChat || pollingMessagesRef.current) return;
      pollingMessagesRef.current = true;
      try {
        const response = await messageService.getConversation(currentChat, 1);
        const data = unwrapData(response);
        const serverMessages = Array.isArray(data) ? data : [];

        if (serverMessages.length > 0) {
          const lastServerId = serverMessages[serverMessages.length - 1]._id;
          if (lastServerId !== lastMessageIdRef.current) {
            
            setMessages((prev) => {
              const localIds = new Set(prev.map((m) => m._id));
              const merged = [
                ...prev,
                ...serverMessages.filter((m) => !localIds.has(m._id)),
              ];
              merged.sort(
                (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
              );
              return merged;
            });
            lastMessageIdRef.current = lastServerId;
            
            fetchConversations();
          }
        }
      } catch {
        
      } finally {
        pollingMessagesRef.current = false;
      }
    };

    interval = setInterval(poll, 30000);
       
    const onVis = () => {
      active = !document.hidden;
      if (active) poll();
    };
    document.addEventListener('visibilitychange', onVis);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVis);
       
    };
  }, [currentChat, fetchConversations, isAuthenticated]);

  const value = {
    conversations,
    currentChat,
    messages,
    unreadCount,
    loading,
    error,
    fetchConversations,
    fetchMessages,
    sendMessage,
    markAsRead,
    markConversationAsRead,
    deleteMessage,
    searchMessages,
    blockUser,
    setCurrentChat,
    fetchUnreadCount,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within ChatProvider');
  }
  return context;
}

export default ChatContext;
