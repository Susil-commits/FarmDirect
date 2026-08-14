/* eslint-disable react-refresh/only-export-components */
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

  // Track the latest message ID we've seen to detect new messages during polling
  const lastMessageIdRef = useRef(null);

  // Guards to prevent overlapping polling requests (prevents request storms on slow networks)
  const pollingUnreadRef = useRef(false);
  const pollingMessagesRef = useRef(false);

  // Helper to unwrap API responses that use { success, data } envelope
  const unwrapData = (response) => {
    if (!response) return response;
    if (response.data !== undefined && response.success !== undefined) {
      return response.data;
    }
    return response;
  };

  // Fetch all conversations
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

       
  // Fetch messages for a specific conversation
       
  const fetchMessages = useCallback(async (receiverId, page = 1) => {
    try {
      setLoading(true);
      const response = await messageService.getConversation(receiverId, page);
      const data = unwrapData(response);
      const msgs = Array.isArray(data) ? data : [];
      setMessages(msgs);
      setCurrentChat(receiverId);
      // Track latest message for poll detection
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

  // Send message
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

      // Update conversation list
      await fetchConversations();

      return messageData;
    } catch (err) {
      setError(err.message);
       
      console.error('Failed to send message:', err);
      throw err;
    }
       
  }, [fetchConversations]);

  // Mark message as read
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

  // Mark conversation as read
  const markConversationAsRead = useCallback(async (receiverId) => {
    try {
      await messageService.markConversationAsRead(receiverId);
      setMessages((prev) =>
        prev.map((msg) => ({
          ...msg,
          isRead: true,
        }))
      );
      // Update conversations list to reset unread count for this user
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
       

  // Get unread count (with in-flight guard to prevent overlapping requests)
  const fetchUnreadCount = useCallback(async () => {
    if (pollingUnreadRef.current) return; // skip if a request is already in-flight
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

  // Keep fetchUnreadCountRef always pointing to the latest fetchUnreadCount callback.
  // Without this, markAsRead / markConversationAsRead call the stale initial stub.
  useEffect(() => { fetchUnreadCountRef.current = fetchUnreadCount; }, [fetchUnreadCount]);

  // Delete message
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

  // Search messages
  const searchMessages = useCallback(async (query, receiverId) => {
    try {
      const data = await messageService.searchMessages(query, receiverId);
      return Array.isArray(data) ? data : [];
    } catch (err) {
      console.error('Failed to search messages:', err);
      return [];
    }
  }, []);

  // Block user
  const blockUser = useCallback(async (userId) => {
    try {
      const response = await messageService.toggleBlockUser(userId);
      return response.blocked;
    } catch (err) {
      console.error('Failed to block user:', err);
      throw err;
    }
  }, []);

  // Global unread count polling (every 30 seconds, pauses when tab is hidden)
  // Only polls when a user is authenticated — avoids 401/400 storms on public pages
  const { user } = useContext(AuthContext);
  const isAuthenticated = Boolean(user);

  // ---- Real-time delivery via WebSocket (instant incoming messages) ----
  // The backend emits `message:new` to the receiver. We append instantly to the
  // open chat for a snappy UI, and bump unread / refresh the list otherwise.
  // The 30s polling below stays as a fallback for when the socket drops.
  const { subscribe: subscribeSocket, connected: socketConnected } = useSocket();

  // Normalize a sparse socket payload into the shape ChatBubble expects
  // (senderId must be an object with _id; ChatBubble guards on !message.senderId).
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

  // Debounced refresh of the conversation list + unread count when messages
  // arrive in chats that aren't currently open.
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
        // Active conversation → append instantly, dedupe by id
        setMessages((prev) => {
          if (prev.some((m) => m._id === msg.id)) return prev;
          lastMessageIdRef.current = msg.id;
          return [...prev, normalizeSocketMessage(msg)];
        });
        // Best-effort: tell the server we've seen it (no UI churn)
        messageService.markConversationAsRead(currentChat).catch(() => {});
       
      } else {
        // Other conversation → bump unread + refresh list (debounced)
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

  // Clear currentChat on logout to prevent stale IDs from triggering 401 polls
  useEffect(() => {
    if (!isAuthenticated) {
       
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCurrentChat(null);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;
    let interval;
    let active = true;

    const poll = () => { if (active) fetchUnreadCountRef.current(); };
    poll(); // initial fetch
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

  // Gentle polling for new messages in current conversation (every 30s, with in-flight guard)
  // Only polls when authenticated — avoids 401 storms on public/unauthenticated pages
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

        // Only update if there are more messages than we have locally (new ones arrived)
        if (serverMessages.length > 0) {
          const lastServerId = serverMessages[serverMessages.length - 1]._id;
          if (lastServerId !== lastMessageIdRef.current) {
            // Merge: keep any locally-appended (not-yet-replicated) messages from
            // the real-time socket, then add server messages we don't have yet,
            // sorted chronologically. Avoids clobbering instant appends on lag.
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
            // Refresh conversations too (unread counts may have changed)
            fetchConversations();
          }
        }
      } catch {
        // silent fail on poll
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
