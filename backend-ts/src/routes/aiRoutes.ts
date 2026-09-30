import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { createRateLimitStore } from '../config/rateLimiter.js';
import {
  handleAiChat,
  handleAiChatStream,
  handleGuestAiChat,
  getPromptSuggestions,
  getUserConversations,
  getConversationById,
  deleteConversation,
  handleListingDraft,
  handlePriceGuidance,
  handlePriceForecast,
} from '../controllers/aiController.js';
import { protect, authorize } from '../middleware/auth.js';
import { UserRole } from '../types/enums.js';

const router = Router();

const aiRateLimiter = rateLimit({
  windowMs: 60 * 1000, 
  max: 30, 
  store: createRateLimitStore('rl:ai:'),
  standardHeaders: true,
  legacyHeaders: false,
  validate: false,
  message: { success: false, message: 'Too many AI requests. Please slow down and wait a few seconds.' },
});

const guestAiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 requests per hour per IP
  store: createRateLimitStore('rl:ai:guest:'),
  standardHeaders: true,
  legacyHeaders: false,
  validate: false,
  message: { success: false, message: 'Guest demo question limit reached. Please sign in to continue chatting with AgriBot.' },
});

// Authenticated AI chat for farmers, buyers, admins
router.post('/chat', protect, aiRateLimiter, handleAiChat);
router.post('/chat/stream', protect, aiRateLimiter, handleAiChatStream);

// Restricted demo endpoint for guests
router.post('/try', guestAiLimiter, handleGuestAiChat);

router.get('/suggestions', getPromptSuggestions);

// Multimodal smart listing draft for farmers and admins (T2.1 + T2.2)
router.post(
  '/listing-draft',
  protect,
  authorize(UserRole.Farmer, UserRole.Admin),
  aiRateLimiter,
  handleListingDraft
);

// Statistical market price guidance (T2.3)
router.get('/price-guidance', aiRateLimiter, handlePriceGuidance);

// ML Price forecast with seasonal-naive baseline guard (T4.2)
router.get('/price-forecast', aiRateLimiter, handlePriceForecast);

// Conversation management (user-scoped)
router.get('/conversations', protect, getUserConversations);
router.get('/conversations/:id', protect, getConversationById);
router.delete('/conversations/:id', protect, deleteConversation);

export default router;
