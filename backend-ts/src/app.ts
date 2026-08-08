import express, { type Request, type Response } from 'express';
import cors from 'cors';
import compression from 'compression';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import hpp from 'hpp';
import path from 'path';
import { fileURLToPath } from 'url';
import cookieParser from 'cookie-parser';
import mongoSanitize from 'express-mongo-sanitize';
import mongoose from 'mongoose';

import { env } from './config/env.js';
import errorHandler from './middleware/errorHandler.js';
import { requestId } from './middleware/requestId.js';
import { resetServerStartTime, getServerStartTime } from './utils/serverTime.js';
import { uploadSingleFile } from './middleware/localUpload.js';
import { trimStrings } from './middleware/sanitizer.js';

import authRoutes from './routes/authRoutes.js';
import cropRoutes from './routes/cropRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import wishlistRoutes from './routes/wishlistRoutes.js';
import userRoutes from './routes/userRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import contactRoutes from './routes/contactRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import farmerRoutes from './routes/farmerRoutes.js';
import couponRoutes from './routes/couponRoutes.js';
import dataAccessRoutes from './routes/dataAccessRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import cartRoutes from './routes/cartRoutes.js';
import negotiationRoutes from './routes/negotiationRoutes.js';
import healthRoutes from './routes/healthRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.set('trust proxy', 1);

app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

resetServerStartTime();


app.use(requestId);

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      imgSrc: ["'self'", "data:", "https://res.cloudinary.com", "https://images.unsplash.com"],
      connectSrc: ["'self'", "https://api.razorpay.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'self'", "https://api.razorpay.com"],
    },
  },
  xXssProtection: true,
  xFrameOptions: { action: 'deny' },
}));

import { createRateLimitStore } from './config/rateLimiter.js';

const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, ok?: boolean) => void) => {
    if (!origin) return callback(null, true);
    if (env.corsOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
};
app.use(cors(corsOptions));

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 600,
  store: createRateLimitStore('rl:global:'),
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
});
app.use(globalLimiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  store: createRateLimitStore('rl:auth:'),
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many authentication attempts, please try again later.' },
});
app.use('/api/auth', authLimiter);

const pollingLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  store: createRateLimitStore('rl:polling:'),
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please slow down.' },
});
app.use('/api/messages/unread', pollingLimiter);
app.use('/api/notifications/unread', pollingLimiter);

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ limit: '10kb', extended: true }));
app.use(cookieParser());
app.use(mongoSanitize());
app.use(hpp());
app.use(trimStrings);

app.use(compression({ threshold: 1024 }));


if (env.isDev) {
  app.use((req: Request, _res: Response, next) => {
    next();
  });
}

app.get('/api/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    serverStartTime: getServerStartTime(),
    environment: env.nodeEnv,
  });
});

app.get('/api/health/detailed', async (_req: Request, res: Response) => {
  const dbState = mongoose.connection.readyState;
  const dbStateMap: Record<number, string> = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };
  let dbPing = false;
  let dbPingMs: number | null = null;
  try {
    const start = Date.now();
    await mongoose.connection.db?.admin().ping();
    dbPingMs = Date.now() - start;
    dbPing = true;
  } catch {
    dbPing = false;
  }
  const healthy = dbState === 1 && dbPing;
  res.status(healthy ? 200 : 503).json({
    status: healthy ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    serverStartTime: getServerStartTime(),
    environment: env.nodeEnv,
    services: {
      database: {
        status: dbStateMap[dbState] ?? 'unknown',
        ping: dbPing,
        latencyMs: dbPingMs,
      },
    },
  });
});

app.use('/health', healthRoutes); // K8s Liveness & Readiness Probes
app.use('/api/auth', authRoutes);
app.use('/api/crops', cropRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/users', userRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/farmer', farmerRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/data', dataAccessRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/negotiations', negotiationRoutes);

app.post('/api/upload', uploadSingleFile('general'), (req: Request, res: Response): void => {
  if (!req.uploadedFile) {
    res.status(400).json({ success: false, message: 'No file uploaded' });
    return;
  }
  res.status(200).json({
    message: 'File uploaded successfully',
    url: req.uploadedFile.url,
    fileName: req.uploadedFile.fileName,
    fileSize: req.uploadedFile.fileSize,
    mimeType: req.uploadedFile.mimeType,
  });
});

app.use('*', (req: Request, res: Response) => {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
});

app.use(errorHandler);

export default app;
