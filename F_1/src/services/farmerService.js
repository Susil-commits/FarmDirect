import api from './api.js';
import directApi from './directApi.js';

const farmerService = {
  
  getDashboardStats: () => api.get('/farmer/dashboard/stats'),

  getCropAnalytics: (period = 'month') => api.get('/farmer/analytics/crops', { params: { period } }),
  getRevenueAnalytics: (period = 'month') => api.get('/farmer/analytics/revenue', { params: { period } }),
  getCategoryBreakdown: (period = 'month') => api.get('/farmer/crops/categories-breakdown', { params: { period } }),
  getTopPerformingCrops: (limit = 10) => api.get('/farmer/crops/top-performing', { params: { limit } }),

  getLowStockItems: () => api.get('/farmer/inventory/low-stock'),
  updateLowStockThreshold: (cropId, threshold) => api.post('/farmer/inventory/update-threshold', { cropId, threshold }),

  bulkUploadCrops: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return directApi.post('/farmer/crops/bulk-upload', formData).then(r => r.data);
  },

  getExportTemplate: async () => {
    const response = await api.get('/farmer/crops/export-template', { responseType: 'blob' });
    const url = window.URL.createObjectURL(response);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'crop-upload-template.csv');
    document.body.appendChild(link);
    link.click();
    link.parentNode.removeChild(link);
    window.URL.revokeObjectURL(url);
    return { success: true, message: 'Template downloaded' };
  }
};

export default farmerService;
