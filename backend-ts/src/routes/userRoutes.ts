import { Router } from 'express';
import * as userController from '../controllers/userController.js';
import * as adminController from '../controllers/adminController.js';
import { protect, authorize } from '../middleware/auth.js';
import { uploadProfilePicture } from '../middleware/localUpload.js';
import { UserRole } from '../types/enums.js';

const router = Router();

router.get('/community/stats', adminController.getPublicCommunityStats);

router.get('/profile', protect, userController.getUserProfile);
router.put('/profile', protect, userController.updateUserProfile);
router.put('/profile-picture', protect, uploadProfilePicture(), userController.updateProfilePicture);
router.post('/address', protect, userController.addAddress);
router.get('/addresses', protect, userController.getAddresses);
router.delete('/address/:addressId', protect, userController.deleteAddress);

router.get('/farmer/:farmerId', userController.getFarmerProfile);

router.get('/all/buyers', protect, authorize(UserRole.Admin), userController.getAllBuyers);
router.get('/all/farmers', protect, authorize(UserRole.Admin), userController.getAllFarmers);

export default router;
