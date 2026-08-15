import api from './api';

const contactService = {
  
  submitQuery: async (data) => {
    try {
      return await api.post('/contact/submit', data);
    } catch (error) {
      throw error.response?.data || { 
        success: false, 
        message: 'Error submitting contact query' 
      };
    }
  },

  getAllQueries: async (params = {}) => {
    try {
      return await api.get('/contact', { params });
    } catch (error) {
      throw error.response?.data || { 
        success: false, 
        message: 'Error fetching contact queries' 
      };
    }
  },

  getQuery: async (id) => {
    try {
      return await api.get(`/contact/${id}`);
    } catch (error) {
      throw error.response?.data || { 
        success: false, 
        message: 'Error fetching query details' 
      };
    }
  },

  updateQuery: async (id, data) => {
    try {
      return await api.patch(`/contact/${id}`, data);
    } catch (error) {
      throw error.response?.data || { 
        success: false, 
        message: 'Error updating query' 
      };
    }
  },

  deleteQuery: async (id) => {
    try {
      return await api.delete(`/contact/${id}`);
    } catch (error) {
      throw error.response?.data || { 
        success: false, 
        message: 'Error deleting query' 
      };
    }
  },

  searchQueries: async (q, type = '') => {
    try {
      return await api.get('/contact/search', { params: { q, type } });
    } catch (error) {
      throw error.response?.data || { 
        success: false, 
        message: 'Error searching queries' 
      };
    }
  },

  getStats: async () => {
    try {
      return await api.get('/contact/stats');
    } catch (error) {
      throw error.response?.data || { 
        success: false, 
        message: 'Error fetching statistics' 
      };
    }
  },
};

export default contactService;
