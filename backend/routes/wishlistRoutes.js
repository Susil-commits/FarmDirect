import express from 'express';
import {
  addToWishlist,
  getWishlist,
  removeFromWishlist,
  checkWishlist,
} from '../controllers/wishlistController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All wishlist routes require authentication
router.post('/', protect, addToWishlist);
router.get('/', protect, getWishlist);
router.delete('/:cropId', protect, removeFromWishlist);
router.get('/check/:cropId', protect, checkWishlist);

export default router;
