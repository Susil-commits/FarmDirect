import { Router } from 'express';
import { addToWishlist, getWishlist, removeFromWishlist, checkWishlist } from '../controllers/wishlistController.js';
import { protect } from '../middleware/auth.js';
import validateRequest, { validateObjectId } from '../middleware/validator.js';
import { addToWishlistSchema } from '../schemas/wishlistSchemas.js';

const router = Router();

router.post('/', protect, validateRequest({ body: addToWishlistSchema }), addToWishlist);
router.get('/', protect, getWishlist);
router.delete('/:cropId', protect, validateObjectId('cropId'), removeFromWishlist);
router.get('/check/:cropId', protect, validateObjectId('cropId'), checkWishlist);

export default router;
