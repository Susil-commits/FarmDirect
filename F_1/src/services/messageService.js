import api from './api';

const messageService = {
  
  sendMessage: async (receiverId, content, cropId = null, orderId = null) => {
    return api.post('/messages', {
      receiverId,
      content,
      cropId,
      orderId,
      type: 'text',
    });
  },

  getConversations: async (page = 1, limit = 20) => {
    return api.get('/messages/conversations', {
      params: { page, limit },
    });
  },

  getConversation: async (receiverId, page = 1, limit = 50) => {
    return api.get(`/messages/conversation/${receiverId}`, {
      params: { page, limit },
    });
  },

  markMessageAsRead: async (messageId) => {
    return api.patch(`/messages/${messageId}/read`);
  },

  markConversationAsRead: async (receiverId) => {
    return api.patch(`/messages/conversation/${receiverId}/read-all`);
  },

  getUnreadCount: async () => {
    return api.get('/messages/unread/count');
  },

  deleteMessage: async (messageId) => {
    return api.delete(`/messages/${messageId}`);
  },

  searchMessages: async (query, receiverId) => {
    return api.get('/messages/search', {
      params: { q: query, receiverId },
    });
  },

  toggleBlockUser: async (userId) => {
    return api.post(`/messages/${userId}/block`);
  },
};

export default messageService;
