import express from 'express';
import * as reviewController from '../controllers/reviewController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Add review
router.post('/:cropId', protect, reviewController.addReview);

// Get reviews for a crop
router.get('/crop/:cropId', reviewController.getReviews);

// Get farmer reviews (public)
router.get('/farmer/:farmerId', reviewController.getFarmerReviews);

// Delete review
router.delete('/:reviewId', protect, reviewController.deleteReview);

// Report review
router.post('/:reviewId/report', protect, reviewController.reportReview);

export default router;
