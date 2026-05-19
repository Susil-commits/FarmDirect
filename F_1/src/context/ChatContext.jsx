import { createContext, useState, useContext, useEffect, useCallback } from 'react';
import messageService from '../services/messageService';
import { AuthContext } from './AuthContext';

const ChatContext = createContext();

export function ChatProvider({ children }) {
  const [conversations, setConversations] = useState([]);
  const [currentChat, setCurrentChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Track the latest message ID we've seen to detect new messages during polling
  const lastMessageIdRef = { current: null };

  // Guards to prevent overlapping polling requests (prevents request storms on slow networks)
  const pollingUnreadRef = { current: false };
  const pollingMessagesRef = { current: false };

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
      fetchUnreadCount();
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
      fetchUnreadCount();
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

  // Clear currentChat on logout to prevent stale IDs from triggering 401 polls
  useEffect(() => {
    if (!isAuthenticated) {
      setCurrentChat(null);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;
    let interval;
    let active = true;

    const poll = () => { if (active) fetchUnreadCount(); };
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
            // New messages arrived — update with full server state
            setMessages(serverMessages);
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
