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

const router = Router();

// ── Public routes ────────────────────────────────────────────────────────────
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

// ── Protected routes ─────────────────────────────────────────────────────────
router.get('/me', protect, getCurrentUser);
router.put('/update-profile', protect, trimStrings, updateProfile);
router.put('/update-password', protect, trimStrings, validateRequest({ body: updatePasswordSchema }), updatePassword);
router.post('/logout', protect, logout);
router.post('/delete-account', protect, deleteAccount);
router.post('/complete-onboarding', protect, trimStrings, completeOnboarding);

// ── KYC routes ────────────────────────────────────────────────────────────────
router.post('/kyc/submit', protect, uploadMultipleFiles('kyc_documents', 10), submitKYCDocuments);
router.post('/submit-kyc', protect, uploadMultipleFiles('kyc_documents', 10), submitKYCDocuments);

export default router;
