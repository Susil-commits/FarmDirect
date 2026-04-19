import express from 'express';
import {
  createCrop,
  getCrops,
  getCropById,
  updateCrop,
  deleteCrop,
  getCropsByFarmer,
} from '../controllers/cropController.js';
import { protect, authorize, requireKYC } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/', getCrops);
router.get('/:id', getCropById);
router.get('/farmer/:farmerId', getCropsByFarmer);

// Private routes (Farmer only) - with KYC requirement
router.post('/', protect, authorize('farmer', 'admin'), requireKYC, createCrop);
router.put('/:id', protect, authorize('farmer', 'admin'), requireKYC, updateCrop);
router.delete('/:id', protect, authorize('farmer', 'admin'), deleteCrop);

export default router;
