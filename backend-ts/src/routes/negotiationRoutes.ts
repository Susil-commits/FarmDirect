import { Router } from 'express';
import { protect, authorize, requireKYC } from '../middleware/auth.js';
import { makeOffer, respondToOffer, getNegotiations, getCopilotGuidance } from '../controllers/negotiationController.js';
import { UserRole } from '../types/enums.js';

const router = Router();

router.use(protect);
router.use(requireKYC);

router.post('/offer', authorize(UserRole.Buyer), makeOffer);
router.post('/:id/respond', respondToOffer);
router.get('/copilot-guidance', getCopilotGuidance);
router.get('/', getNegotiations);

export default router;
