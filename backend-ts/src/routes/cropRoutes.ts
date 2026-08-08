import { Router } from 'express';
import {
  createCrop, getCrops, getCropById, updateCrop, deleteCrop, getCropsByFarmer,
  getMyListings, toggleInterest, getInterestedBuyers, getMyInterestedCrops,
  getTrendingCrops, getSimilarCrops, getRecommendedCrops,
} from '../controllers/cropController.js';
import { protect, authorize, requireKYC } from '../middleware/auth.js';
import { uploadCropImages } from '../middleware/localUpload.js';
import { validateObjectId } from '../middleware/validator.js';
import { UserRole } from '../types/enums.js';

import { cacheRoute } from '../middleware/cacheRoute.js';

const router = Router();

// Cache public GET requests for 60 seconds
router.get('/', cacheRoute(60), getCrops);
router.get('/trending', cacheRoute(300), getTrendingCrops);

router.get('/buyer/recommended', protect, authorize(UserRole.Buyer), getRecommendedCrops);
router.get('/my-listings', protect, authorize(UserRole.Farmer), getMyListings);
router.get('/buyer/interested', protect, authorize(UserRole.Buyer), getMyInterestedCrops);

router.get('/farmer/:farmerId', getCropsByFarmer);
router.get('/:id', validateObjectId(), getCropById);
router.get('/:id/similar', validateObjectId(), getSimilarCrops);
router.get('/:id/interested-buyers', validateObjectId(), protect, authorize(UserRole.Farmer, UserRole.Admin), getInterestedBuyers);

// Note: FormData from multipart/form-data bypasses Zod schema (fields arrive as strings).
router.post('/', protect, authorize(UserRole.Farmer, UserRole.Admin), requireKYC, uploadCropImages(), createCrop);
router.put('/:id', validateObjectId(), protect, authorize(UserRole.Farmer, UserRole.Admin), requireKYC, uploadCropImages(), updateCrop);
router.delete('/:id', validateObjectId(), protect, authorize(UserRole.Farmer, UserRole.Admin), requireKYC, deleteCrop);

router.post('/:id/interest', validateObjectId(), protect, authorize(UserRole.Buyer), requireKYC, toggleInterest);

export default router;
