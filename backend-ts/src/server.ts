import express, { type Request, type Response } from 'express';
import cors from 'cors';
import compression from 'compression';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createServer, type Server as HttpServer } from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import cookieParser from 'cookie-parser';

import { env } from './config/env.js';
import { connectDB, disconnectDB } from './config/db.js';
import errorHandler from './middleware/errorHandler.js';
import { requestId } from './middleware/requestId.js';
import { resetServerStartTime, getServerStartTime } from './utils/serverTime.js';
import { initSocket } from './socket/socketManager.js';
import { uploadSingleFile } from './middleware/localUpload.js';

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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Reset server start time on app initialization
resetServerStartTime();

// Connect to MongoDB
connectDB();

// ---- Security & Performance Middleware (order matters) ----

// 1. Request ID (adds X-Request-Id header for log correlation)
app.use(requestId);

// 2. Helmet: secure HTTP headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false,
}));

// 3. CORS — supports comma-separated origins
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

// 4. Global rate limiter — 600 requests per 15 min per IP
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 600,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
});
app.use(globalLimiter);

// 5. Stricter rate limiter for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many authentication attempts, please try again later.' },
});
app.use('/api/auth', authLimiter);

// 6. Polling endpoints — generous per-minute burst window
const pollingLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please slow down.' },
});
app.use('/api/messages/unread', pollingLimiter);
app.use('/api/notifications/unread', pollingLimiter);

// 7. Body & Cookie parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(cookieParser());

// 8. Response compression
app.use(compression({ threshold: 1024 }));

// ---- End Security & Performance Middleware ----

// Request logging (development only)
if (env.isDev) {
  app.use((req: Request, _res: Response, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });
}

// Enhanced health check
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

// API Routes
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

// File upload route
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

// 404 handler
app.use('*', (req: Request, res: Response) => {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
});

// Error handling middleware
app.use(errorHandler);

// Create HTTP server for Socket.io
const httpServer: HttpServer = createServer(app);

// Initialize Socket.io
initSocket(httpServer, { origin: env.corsOrigins });

// ---- Graceful shutdown ----
function gracefulShutdown(signal: string): void {
  console.log(`\n${signal} received. Shutting down gracefully...`);
  httpServer.close(async () => {
    console.log('HTTP server closed.');
    await disconnectDB();
    process.exit(0);
  });

  // Force-close after 10 seconds
  setTimeout(() => {
    console.error('Forcing shutdown after timeout.');
    process.exit(1);
  }, 10000).unref();
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
});
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  gracefulShutdown('uncaughtException');
});

// Start server
const PORT = env.port;
httpServer.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Environment: ${env.nodeEnv}`);
  console.log(`Rate limiting: 600 req/15min (global), 120 req/min (polling), 30 req/15min (auth)`);
  console.log(`WebSocket: Ready`);
});

export default app;
