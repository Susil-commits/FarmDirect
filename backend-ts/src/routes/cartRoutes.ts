import { Router } from 'express';
import { getCart, updateCart, clearCart } from '../controllers/cartController.js';
import { protect, authorize } from '../middleware/auth.js';
import { UserRole } from '../types/enums.js';

const router = Router();

router.use(protect, authorize(UserRole.Buyer));

router.get('/', getCart);
router.put('/', updateCart);
router.delete('/', clearCart);

export default router;
