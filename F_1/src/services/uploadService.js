/**
 * Frontend Service for File Uploads
 * This service handles file uploads to your backend
 * which stores files locally on disk.
 *
 * IMPORTANT: File uploads use directApi (bypassing Vite proxy)
 * because the Vite proxy can interfere with multipart/form-data boundaries,
 * causing multer to see req.files as empty.
 */

import directApi from './directApi.js';

export const uploadService = {
  /**
   * Upload crop images
   * @param {File[]} files - Array of image files
   * @returns {Promise<Object>} - Upload result with file URLs
   */
  uploadCropImages: async (files) => {
    try {
      const formData = new FormData();
      files.forEach(file => {
        formData.append('files', file);
      });

      const response = await directApi.post('/crops/with-images', formData);
      return response.data;
    } catch (error) {
      console.error('Crop image upload error:', error);
      throw error;
    }
  },

  /**
   * Upload profile picture
   * @param {File} file - Image file
   * @returns {Promise<Object>} - Upload result with file URL
   */
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

  /**
   * Upload KYC documents with proper field names for document type mapping
   * @param {Object} fileMap - Object mapping document type to File (e.g., { governmentId: File, addressProof: File })
   * @param {String} documentType - Type of KYC document ('buyer_kyc' or 'farmer_kyc')
   * @returns {Promise<Object>} - Upload result
   */
  uploadKYCDocuments: async (fileMap, documentType) => {
    try {
      const formData = new FormData();
      
      // Append each file with its document type as the field name
      // This allows the backend to map files to document types via fieldName
      Object.entries(fileMap).forEach(([docType, file]) => {
        if (file) {
          formData.append(docType, file);
          console.log(`📎 [uploadService] Appended: ${docType} = ${file.name} (${file.size} bytes, ${file.type})`);
        }
      });
      formData.append('documentType', documentType);

      console.log(`📤 [uploadService] Sending ${Object.keys(fileMap).length} files to /auth/kyc/submit (type: ${documentType})`);
      
      const response = await directApi.post('/auth/kyc/submit', formData);
      
      console.log('✅ [uploadService] Upload response:', response.data);
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

  /**
   * Upload order invoice
   * @param {String} orderId - Order ID
   * @param {File} file - Invoice file
   * @returns {Promise<Object>} - Upload result
   */
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
