import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { createRateLimitStore } from '../config/rateLimiter.js';
import { optionalProtect } from '../middleware/auth.js';
import { logEvents } from '../controllers/eventController.js';
import validateRequest from '../middleware/validator.js';
import { batchEventsSchema } from '../schemas/eventSchemas.js';

const router = Router();

const eventRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  store: createRateLimitStore('rl:events:'),
  standardHeaders: true,
  legacyHeaders: false,
  validate: false,
  message: { success: false, message: 'Too many event logging requests.' },
});

router.post('/', eventRateLimiter, optionalProtect, validateRequest({ body: batchEventsSchema }), logEvents);

export default router;
