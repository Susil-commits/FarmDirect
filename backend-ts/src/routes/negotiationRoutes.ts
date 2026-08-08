import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { makeOffer, respondToOffer, getNegotiations } from '../controllers/negotiationController.js';
import { UserRole } from '../types/enums.js';

const router = Router();

router.use(protect);

router.post('/offer', authorize(UserRole.Buyer), makeOffer);
router.post('/:id/respond', respondToOffer);
router.get('/', getNegotiations);

export default router;
