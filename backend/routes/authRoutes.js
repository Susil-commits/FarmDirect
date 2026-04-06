import express from 'express';
import { register, login, getCurrentUser, updateProfile, logout, googleCallback, githubCallback, refreshTokenHandler } from '../controllers/authController.js';
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

export default router;
