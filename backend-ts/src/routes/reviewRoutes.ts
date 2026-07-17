import { Router } from 'express';
import * as reviewController from '../controllers/reviewController.js';
import { protect } from '../middleware/auth.js';

const router = Router();

router.post('/:cropId', protect, reviewController.addReview);
router.get('/crop/:cropId', reviewController.getReviews);
router.get('/farmer/:farmerId', reviewController.getFarmerReviews);
router.delete('/:reviewId', protect, reviewController.deleteReview);
router.post('/:reviewId/report', protect, reviewController.reportReview);

export default router;
