import { Router } from 'express';
import {
  register, login, getCurrentUser, updateProfile, logout, refreshTokenHandler,
  submitKYCDocuments, deleteAccount,
  forgotPassword, resetPassword, updatePassword,
} from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import { uploadMultipleFiles } from '../middleware/localUpload.js';

const router = Router();

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/refresh-token', refreshTokenHandler);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Private routes
router.get('/me', protect, getCurrentUser);
router.put('/update-profile', protect, updateProfile);
router.put('/update-password', protect, updatePassword);
router.post('/logout', protect, logout);
router.post('/delete-account', protect, deleteAccount);

// KYC routes
router.post('/kyc/submit', protect, uploadMultipleFiles('kyc_documents', 10), submitKYCDocuments);
router.post('/submit-kyc', protect, uploadMultipleFiles('kyc_documents', 10), submitKYCDocuments);

export default router;
