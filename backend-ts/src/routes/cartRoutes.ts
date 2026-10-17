import { Router } from 'express';
import { getCart, updateCart, clearCart } from '../controllers/cartController.js';
import { protect, authorize } from '../middleware/auth.js';
import { UserRole } from '../types/enums.js';
import validateRequest from '../middleware/validator.js';
import { updateCartSchema } from '../schemas/cartSchemas.js';

const router = Router();

router.use(protect, authorize(UserRole.Buyer));

router.get('/', getCart);
router.put('/', validateRequest({ body: updateCartSchema }), updateCart);
router.delete('/', clearCart);

export default router;
