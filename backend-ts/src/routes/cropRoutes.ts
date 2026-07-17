import { Router } from 'express';
import {
  createCrop, getCrops, getCropById, updateCrop, deleteCrop, getCropsByFarmer,
  getMyListings, toggleInterest, getInterestedBuyers, getMyInterestedCrops,
  getTrendingCrops, getSimilarCrops, getRecommendedCrops,
} from '../controllers/cropController.js';
import { protect, authorize, requireKYC } from '../middleware/auth.js';
import { uploadCropImages } from '../middleware/localUpload.js';
import { UserRole } from '../types/enums.js';

const router = Router();

router.get('/', getCrops);
router.get('/trending', getTrendingCrops);
router.get('/buyer/recommended', protect, authorize(UserRole.Buyer), getRecommendedCrops);
router.get('/my-listings', protect, authorize(UserRole.Farmer), getMyListings);
router.get('/buyer/interested', protect, authorize(UserRole.Buyer), getMyInterestedCrops);
router.get('/farmer/:farmerId', getCropsByFarmer);
router.get('/:id', getCropById);
router.get('/:id/similar', getSimilarCrops);

router.post('/', protect, authorize(UserRole.Farmer, UserRole.Admin), requireKYC, uploadCropImages(), createCrop);
router.put('/:id', protect, authorize(UserRole.Farmer, UserRole.Admin), requireKYC, uploadCropImages(), updateCrop);
router.delete('/:id', protect, authorize(UserRole.Farmer, UserRole.Admin), requireKYC, deleteCrop);

router.post('/:id/interest', protect, authorize(UserRole.Buyer), requireKYC, toggleInterest);
router.get('/:id/interested-buyers', protect, authorize(UserRole.Farmer, UserRole.Admin), getInterestedBuyers);

export default router;
