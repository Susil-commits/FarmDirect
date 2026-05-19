import api from './api';

const contactService = {
  /**
   * Submit a new contact form query
   * @param {Object} data - Contact form data
   * @param {string} data.name - Sender's name
   * @param {string} data.email - Sender's email
   * @param {string} data.phone - Sender's phone (optional)
   * @param {string} data.inquiryType - Type of inquiry
   * @param {string} data.message - Message content
   * @returns {Promise<Object>} Response with submission status
   */
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

  /**
   * Get all contact queries (Admin only)
   * @param {Object} params - Query parameters
   * @param {string} params.status - Filter by status (optional)
   * @param {string} params.inquiryType - Filter by inquiry type (optional)
   * @param {string} params.sortBy - Sort field (default: 'createdAt')
   * @param {number} params.order - Sort order (-1 or 1) (default: -1)
   * @param {number} params.page - Page number (default: 1)
   * @param {number} params.limit - Items per page (default: 20)
   * @returns {Promise<Object>} Paginated list of queries
   */
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

  /**
   * Get a single contact query detail (Admin only)
   * @param {string} id - Query ID
   * @returns {Promise<Object>} Query details
   */
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

  /**
   * Update a contact query with response (Admin only)
   * @param {string} id - Query ID
   * @param {Object} data - Update data
   * @param {string} data.status - New status (optional)
   * @param {string} data.adminResponse - Response message from admin
   * @param {string} data.internalNotes - Internal notes (optional)
   * @param {string} data.priority - Priority level (optional)
   * @returns {Promise<Object>} Updated query
   */
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

  /**
   * Delete a contact query (soft delete - Admin only)
   * @param {string} id - Query ID
   * @returns {Promise<Object>} Response status
   */
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

  /**
   * Search contact queries (Admin only)
   * @param {string} q - Search query string
   * @param {string} type - Filter by inquiry type (optional)
   * @returns {Promise<Object>} Search results
   */
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

  /**
   * Get contact query statistics (Admin only)
   * @returns {Promise<Object>} Statistics including counts by status and type
   */
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
