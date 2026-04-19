/**
 * Frontend Service for Cloudinary Uploads
 * This service handles file uploads to your backend
 * which then uploads to Cloudinary
 */

import api from './api.js';

export const uploadService = {
  /**
   * Upload crop images
   * @param {File[]} files - Array of image files
   * @returns {Promise<Object>} - Upload result with Cloudinary URLs
   */
  uploadCropImages: async (files) => {
    try {
      const formData = new FormData();
      files.forEach(file => {
        formData.append('files', file);
      });

      const response = await fetch('/api/crops/with-images', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Crop image upload error:', error);
      throw error;
    }
  },

  /**
   * Upload profile picture
   * @param {File} file - Image file
   * @returns {Promise<Object>} - Upload result with Cloudinary URL
   */
  uploadProfilePicture: async (file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/users/profile-picture', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Profile picture upload failed');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Profile picture upload error:', error);
      throw error;
    }
  },

  /**
   * Upload KYC documents
   * @param {File[]} files - Array of document files
   * @param {String} documentType - Type of KYC document
   * @returns {Promise<Object>} - Upload result
   */
  uploadKYCDocuments: async (files, documentType) => {
    try {
      const formData = new FormData();
      files.forEach(file => {
        formData.append('files', file);
      });
      formData.append('documentType', documentType);

      const response = await fetch('/api/auth/kyc/submit', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('KYC upload failed');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('KYC upload error:', error);
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

      const response = await fetch(`/api/orders/${orderId}/invoice`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Invoice upload failed');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Invoice upload error:', error);
      throw error;
    }
  }
};

export default uploadService;
