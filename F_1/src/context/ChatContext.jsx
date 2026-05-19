import { createContext, useState, useContext, useEffect, useCallback } from 'react';
import messageService from '../services/messageService';

const ChatContext = createContext();

export function ChatProvider({ children }) {
  const [conversations, setConversations] = useState([]);
  const [currentChat, setCurrentChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch all conversations
  const fetchConversations = useCallback(async () => {
    try {
      setLoading(true);
      const data = await messageService.getConversations();
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
      const data = await messageService.getConversation(receiverId, page);
      setMessages(Array.isArray(data) ? data : []);
      setCurrentChat(receiverId);
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
      const messageData = await messageService.sendMessage(receiverId, content, cropId);
      setMessages((prev) => [...prev, messageData]);

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
      fetchUnreadCount();
    } catch (err) {
      console.error('Failed to mark conversation as read:', err);
    }
  }, []);

  // Get unread count
  const fetchUnreadCount = useCallback(async () => {
    try {
      const data = await messageService.getUnreadCount();
      setUnreadCount(data?.totalUnread || 0);
    } catch (err) {
      console.error('Failed to fetch unread count:', err);
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

  // Polling for new messages (30s, pauses when tab inactive)
  useEffect(() => {
    if (!currentChat) return;

    let interval;
    let active = true;

    const poll = () => { if (active) fetchMessages(currentChat); };
    poll();
    interval = setInterval(poll, 30000);

    const onVis = () => { active = !document.hidden; if (active) poll(); };
    document.addEventListener('visibilitychange', onVis);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [currentChat]);

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
