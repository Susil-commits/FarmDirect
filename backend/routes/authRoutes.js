import express from 'express';
import { register, login, getCurrentUser, updateProfile, logout, googleCallback, githubCallback, refreshTokenHandler, submitKYCDocuments, deleteAccount } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/refresh-token', refreshTokenHandler);

// Social OAuth routes
router.post('/google/callback', googleCallback);
router.post('/github/callback', githubCallback);

// Private routes
router.get('/me', protect, getCurrentUser);
router.put('/update-profile', protect, updateProfile);
router.post('/logout', protect, logout);
router.post('/delete-account', protect, deleteAccount);

// KYC routes
router.post('/kyc/submit', protect, submitKYCDocuments);
router.post('/submit-kyc', protect, submitKYCDocuments);  // Alternative endpoint name

export default router;
