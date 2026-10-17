import { Router } from 'express';
import * as reviewController from '../controllers/reviewController.js';
import { protect } from '../middleware/auth.js';
import validateRequest, { validateObjectId } from '../middleware/validator.js';
import { addReviewSchema, reportReviewSchema } from '../schemas/reviewSchemas.js';

const router = Router();

router.post('/:cropId', protect, validateObjectId('cropId'), validateRequest({ body: addReviewSchema }), reviewController.addReview);
router.get('/crop/:cropId', validateObjectId('cropId'), reviewController.getReviews);
router.get('/crop/:cropId/summary', validateObjectId('cropId'), reviewController.getCropReviewSummaryController);
router.get('/farmer/:farmerId', validateObjectId('farmerId'), reviewController.getFarmerReviews);
router.delete('/:reviewId', protect, validateObjectId('reviewId'), reviewController.deleteReview);
router.post('/:reviewId/report', protect, validateObjectId('reviewId'), validateRequest({ body: reportReviewSchema }), reviewController.reportReview);

export default router;
