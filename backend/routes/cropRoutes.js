import express from 'express';
import {
  createCrop,
  getCrops,
  getCropById,
  updateCrop,
  deleteCrop,
  getCropsByFarmer,
} from '../controllers/cropController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/', getCrops);
router.get('/:id', getCropById);
router.get('/farmer/:farmerId', getCropsByFarmer);

// Private routes (Farmer only)
router.post('/', protect, authorize('farmer', 'admin'), createCrop);
router.put('/:id', protect, authorize('farmer', 'admin'), updateCrop);
router.delete('/:id', protect, authorize('farmer', 'admin'), deleteCrop);

export default router;
