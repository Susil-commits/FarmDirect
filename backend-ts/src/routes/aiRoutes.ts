import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { createRateLimitStore } from '../config/rateLimiter.js';
import { handleAiChat, handleGuestAiChat, getPromptSuggestions } from '../controllers/aiController.js';
import { protect } from '../middleware/auth.js';

const router = Router();

const aiRateLimiter = rateLimit({
  windowMs: 60 * 1000, 
  max: 30, 
  store: createRateLimitStore('rl:ai:'),
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many AI requests. Please slow down and wait a few seconds.' },
});

const guestAiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 requests per hour per IP
  store: createRateLimitStore('rl:ai:guest:'),
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Guest demo question limit reached. Please sign in to continue chatting with AgriBot.' },
});

// Authenticated AI chat for farmers, buyers, admins
router.post('/chat', protect, aiRateLimiter, handleAiChat);

// Restricted demo endpoint for guests
router.post('/try', guestAiLimiter, handleGuestAiChat);

router.get('/suggestions', getPromptSuggestions);

export default router;
