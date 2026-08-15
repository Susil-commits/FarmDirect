
import directApi from './directApi.js';

export const uploadService = {
  
  uploadCropImages: async (files) => {
    try {
      const formData = new FormData();
      files.forEach(file => {
        formData.append('images', file);
        formData.append('files', file);
      });

      const response = await directApi.post('/crops/upload-images', formData);
      return response.data;
    } catch (error) {
      console.error('Crop image upload error:', error);
      throw error;
    }
  },

  uploadProfilePicture: async (file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await directApi.put('/users/profile-picture', formData);
      return response.data;
    } catch (error) {
      console.error('Profile picture upload error:', error);
      throw error;
    }
  },

  uploadKYCDocuments: async (fileMap, documentType) => {
    try {
      const formData = new FormData();
      
      Object.entries(fileMap).forEach(([docType, file]) => {
        if (file) {
          formData.append(docType, file);
        }
      });
      formData.append('documentType', documentType);

      const response = await directApi.post('/auth/kyc/submit', formData);
      
      return response.data;
    } catch (error) {
      console.error('❌ [uploadService] KYC upload error:', error);
      if (error.response) {
        console.error('  Status:', error.response.status);
        console.error('  Data:', error.response.data);
      } else if (error.request) {
        console.error('  No response received — network error or CORS issue');
      }
      throw error;
    }
  },

  uploadOrderInvoice: async (orderId, file) => {
    try {
      const formData = new FormData();
      formData.append('files', file);

      const response = await directApi.post(`/orders/${orderId}/invoice`, formData);
      return response.data;
    } catch (error) {
      console.error('Invoice upload error:', error);
      throw error;
    }
  }
};

export default uploadService;
