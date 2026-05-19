import api from './api';

const messageService = {
  // Send a message
  sendMessage: async (receiverId, content, cropId = null, orderId = null) => {
    return api.post('/messages', {
      receiverId,
      content,
      cropId,
      orderId,
      type: 'text',
    });
  },

  // Get all conversations
  getConversations: async (page = 1, limit = 20) => {
    return api.get('/messages/conversations', {
      params: { page, limit },
    });
  },

  // Get conversation with specific user
  getConversation: async (receiverId, page = 1, limit = 50) => {
    return api.get(`/messages/conversation/${receiverId}`, {
      params: { page, limit },
    });
  },

  // Mark message as read
  markMessageAsRead: async (messageId) => {
    return api.patch(`/messages/${messageId}/read`);
  },

  // Mark entire conversation as read
  markConversationAsRead: async (receiverId) => {
    return api.patch(`/messages/conversation/${receiverId}/read-all`);
  },

  // Get unread count
  getUnreadCount: async () => {
    return api.get('/messages/unread/count');
  },

  // Delete message
  deleteMessage: async (messageId) => {
    return api.delete(`/messages/${messageId}`);
  },

  // Search messages in conversation
  searchMessages: async (query, receiverId) => {
    return api.get('/messages/search', {
      params: { q: query, receiverId },
    });
  },

  // Block/Unblock user
  toggleBlockUser: async (userId) => {
    return api.post(`/messages/${userId}/block`);
  },
};

export default messageService;
