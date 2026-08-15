import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { createRateLimitStore } from '../config/rateLimiter.js';
import { handleAiChat, getPromptSuggestions } from '../controllers/aiController.js';

const router = Router();

const aiRateLimiter = rateLimit({
  windowMs: 60 * 1000, 
  max: 30, 
  store: createRateLimitStore('rl:ai:'),
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many AI requests. Please slow down and wait a few seconds.' },
});

router.post('/chat', aiRateLimiter, handleAiChat);
router.get('/suggestions', getPromptSuggestions);

export default router;
