import express from 'express';
import {
  createCrop,
  getCrops,
  getCropById,
  updateCrop,
  deleteCrop,
  getCropsByFarmer,
  getMyListings,
  toggleInterest,
  getInterestedBuyers,
  getMyInterestedCrops,
} from '../controllers/cropController.js';
import { protect, authorize, requireKYC } from '../middleware/auth.js';
import { uploadCropImages } from '../middleware/localUpload.js';

const router = express.Router();

// Public routes
router.get('/', getCrops);

// Farmer's own listings (MUST be before /:id to avoid route conflict)
router.get('/my-listings', protect, authorize('farmer'), getMyListings);

// Buyer's interested crops (MUST be before /:id to avoid route conflict)
router.get('/buyer/interested', protect, authorize('buyer'), getMyInterestedCrops);

// Public routes with params (MUST be after static routes)
router.get('/farmer/:farmerId', getCropsByFarmer);
router.get('/:id', getCropById);

// Private routes (Farmer only) - with KYC requirement + file upload middleware
router.post('/', protect, authorize('farmer', 'admin'), requireKYC, uploadCropImages(), createCrop);
router.put('/:id', protect, authorize('farmer', 'admin'), requireKYC, uploadCropImages(), updateCrop);
router.delete('/:id', protect, authorize('farmer', 'admin'), requireKYC, deleteCrop);

// Interest workflow (Buyer only)
router.post('/:id/interest', protect, authorize('buyer'), requireKYC, toggleInterest);
router.get('/:id/interested-buyers', protect, authorize('farmer', 'admin'), getInterestedBuyers);

export default router;
