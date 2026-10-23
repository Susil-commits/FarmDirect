import { Router } from 'express';
import {
  register, login, getCurrentUser, updateProfile, logout, refreshTokenHandler,
  submitKYCDocuments, deleteAccount, completeOnboarding,
  forgotPassword, resetPassword, updatePassword,
} from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import { uploadMultipleFiles } from '../middleware/localUpload.js';
import validateRequest from '../middleware/validator.js';
import { normalizeEmail, trimStrings } from '../middleware/sanitizer.js';
import {
  registerSchema, loginSchema, forgotPasswordSchema,
  resetPasswordSchema, updatePasswordSchema,
} from '../schemas/authSchemas.js';
import rateLimit from 'express-rate-limit';
import { createRateLimitStore } from '../config/rateLimiter.js';

// [FIX M-7] Prevent KYC spam: max 5 submissions per user per hour
// (10 files x 15MB = 150MB per request otherwise)
const kycLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  keyGenerator: (req) => String(req.user?._id ?? req.ip),
  store: createRateLimitStore('rl:kyc:'),
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many KYC submissions. Please try again in an hour.' },
});

const router = Router();

router.post('/register',
  trimStrings,
  normalizeEmail,
  validateRequest({ body: registerSchema }),
  register,
);

router.post('/login',
  trimStrings,
  normalizeEmail,
  validateRequest({ body: loginSchema }),
  login,
);

router.post('/refresh-token', refreshTokenHandler);
router.post('/refresh', refreshTokenHandler);

router.post('/forgot-password',
  trimStrings,
  normalizeEmail,
  validateRequest({ body: forgotPasswordSchema }),
  forgotPassword,
);

router.post('/reset-password',
  trimStrings,
  validateRequest({ body: resetPasswordSchema }),
  resetPassword,
);

router.get('/me', protect, getCurrentUser);
router.put('/update-profile', protect, trimStrings, updateProfile);
router.put('/update-password', protect, trimStrings, validateRequest({ body: updatePasswordSchema }), updatePassword);
router.post('/logout', protect, logout);
router.post('/delete-account', protect, deleteAccount);
router.post('/complete-onboarding', protect, trimStrings, completeOnboarding);

router.post('/kyc/submit', protect, kycLimiter, uploadMultipleFiles('kyc_documents', 10), submitKYCDocuments);

export default router;
