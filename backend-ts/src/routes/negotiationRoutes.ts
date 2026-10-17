import { Router } from 'express';
import { protect, authorize, requireKYC } from '../middleware/auth.js';
import { makeOffer, respondToOffer, getNegotiations, getCopilotGuidance } from '../controllers/negotiationController.js';
import { UserRole } from '../types/enums.js';
import validateRequest, { validateObjectId } from '../middleware/validator.js';
import { makeOfferSchema, respondOfferSchema } from '../schemas/negotiationSchemas.js';

const router = Router();

router.use(protect);
router.use(requireKYC);

router.post('/offer', authorize(UserRole.Buyer), validateRequest({ body: makeOfferSchema }), makeOffer);
router.post('/:id/respond', validateObjectId('id'), validateRequest({ body: respondOfferSchema }), respondToOffer);
router.get('/copilot-guidance', getCopilotGuidance);
router.get('/', getNegotiations);

export default router;
