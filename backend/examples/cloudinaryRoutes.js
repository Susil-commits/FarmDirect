/**
 * Example routes showing how to use Cloudinary upload middleware
 * Add these patterns to your existing routes
 */

import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import {
  uploadCropImages,
  uploadProfilePicture,
  uploadKYCDocuments,
  uploadOrderDocuments
} from '../middleware/cloudinaryUpload.js';
import {
  createCropWithImages,
  updateCropImages,
  deleteCrop
} from '../examples/cloudinaryExample.js';

const router = express.Router();

// ============================================
// CROP ROUTES WITH IMAGE UPLOADS
// ============================================

// POST /api/crops/with-images
// Upload crop with multiple images to Cloudinary
router.post(
  '/crops/with-images',
  protect,
  authorize('farmer'),
  ...uploadCropImages(), // Middleware handles upload
  createCropWithImages   // Handler receives req.uploadedFiles
);

// PUT /api/crops/:cropId/images
// Update crop images
router.put(
  '/crops/:cropId/images',
  protect,
  ...uploadCropImages(),
  updateCropImages
);

// DELETE /api/crops/:cropId
// Delete crop and associated images from Cloudinary
router.delete(
  '/crops/:cropId',
  protect,
  deleteCrop
);

// ============================================
// USER ROUTES WITH PROFILE PICTURE
// ============================================

// PUT /api/users/profile-picture
// Upload profile picture to Cloudinary
router.put(
  '/users/profile-picture',
  protect,
  ...uploadProfilePicture(),
  async (req, res) => {
    try {
      const { uploadedFile } = req;
      
      // If user has old profile picture, delete it from Cloudinary
      // (implement based on your User model structure)
      
      // Update user with new profile picture URL
      const user = await User.findByIdAndUpdate(
        req.user._id,
        { profilePicture: uploadedFile.url },
        { new: true }
      );

      res.json({
        success: true,
        message: 'Profile picture updated',
        data: user
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to update profile picture'
      });
    }
  }
);

// ============================================
// KYC ROUTES WITH DOCUMENT UPLOADS
// ============================================

// POST /api/kyc/submit
// Upload KYC documents to Cloudinary
router.post(
  '/kyc/submit',
  protect,
  authorize('farmer'),
  ...uploadKYCDocuments(),
  async (req, res) => {
    try {
      const { uploadedFiles } = req;
      const { documentType, farmName } = req.body;

      // Store KYC documents with Cloudinary URLs
      const user = await User.findByIdAndUpdate(
        req.user._id,
        {
          kycDocuments: uploadedFiles.map(file => ({
            url: file.url,
            public_id: file.public_id,
            type: documentType,
            uploadedAt: new Date()
          })),
          kycStatus: 'pending',
          farmName: farmName
        },
        { new: true }
      );

      res.json({
        success: true,
        message: 'KYC documents submitted successfully',
        data: user
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to upload KYC documents'
      });
    }
  }
);

// ============================================
// ORDER ROUTES WITH INVOICE UPLOADS
// ============================================

// POST /api/orders/:orderId/invoice
// Upload order invoice to Cloudinary
router.post(
  '/orders/:orderId/invoice',
  protect,
  authorize('farmer', 'admin'),
  ...uploadOrderDocuments(),
  async (req, res) => {
    try {
      const { uploadedFiles } = req;
      const { orderId } = req.params;

      const order = await Order.findByIdAndUpdate(
        orderId,
        {
          documents: uploadedFiles.map(file => ({
            url: file.url,
            public_id: file.public_id,
            type: 'invoice',
            uploadedAt: new Date()
          }))
        },
        { new: true }
      );

      res.json({
        success: true,
        message: 'Invoice uploaded successfully',
        data: order
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to upload invoice'
      });
    }
  }
);

export default router;
