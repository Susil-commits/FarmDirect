import axios from 'axios';

const API_BASE = '/api/farmer';

const farmerService = {
  // Dashboard
  getDashboardStats: async () => {
    try {
      const response = await axios.get(`${API_BASE}/dashboard/stats`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Analytics
  getCropAnalytics: async (period = 'month') => {
    try {
      const response = await axios.get(`${API_BASE}/analytics/crops`, {
        params: { period }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  getRevenueAnalytics: async (period = 'month') => {
    try {
      const response = await axios.get(`${API_BASE}/analytics/revenue`, {
        params: { period }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  getCategoryBreakdown: async (period = 'month') => {
    try {
      const response = await axios.get(`${API_BASE}/crops/categories-breakdown`, {
        params: { period }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  getTopPerformingCrops: async (limit = 10) => {
    try {
      const response = await axios.get(`${API_BASE}/crops/top-performing`, {
        params: { limit }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Inventory
  getLowStockItems: async () => {
    try {
      const response = await axios.get(`${API_BASE}/inventory/low-stock`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  updateLowStockThreshold: async (cropId, threshold) => {
    try {
      const response = await axios.post(`${API_BASE}/inventory/update-threshold`, {
        cropId,
        threshold
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Bulk Operations
  bulkUploadCrops: async (file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await axios.post(`${API_BASE}/crops/bulk-upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  getExportTemplate: async () => {
    try {
      const response = await axios.get(`${API_BASE}/crops/export-template`, {
        responseType: 'blob'
      });
      
      // Create download link
      const url = window.URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'crop-upload-template.csv');
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      return { success: true, message: 'Template downloaded' };
    } catch (error) {
      throw error.response?.data || error;
    }
  }
};

export default farmerService;
