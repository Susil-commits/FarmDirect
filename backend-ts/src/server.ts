import express, { type Request, type Response } from 'express';
import cors from 'cors';
import compression from 'compression';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import hpp from 'hpp';
import { createServer, type Server as HttpServer } from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import cookieParser from 'cookie-parser';
import cluster from 'cluster';
import os from 'os';
import mongoSanitize from 'express-mongo-sanitize';
import mongoose from 'mongoose';

import { env } from './config/env.js';
import { connectDB, disconnectDB } from './config/db.js';
import errorHandler from './middleware/errorHandler.js';
import { requestId } from './middleware/requestId.js';
import { resetServerStartTime, getServerStartTime } from './utils/serverTime.js';
import { initSocket } from './socket/socketManager.js';
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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Reset server start time on app initialization
resetServerStartTime();

// ---- Security & Performance Middleware (order matters) ----

// 1. Request ID (adds X-Request-Id header for log correlation)
app.use(requestId);

// 2. Helmet: secure HTTP headers with strict CSP
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
  max: 15, // Tightened from 30 to prevent brute force
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

// 7. Body & Cookie parsing & Data Sanitization
app.use(express.json({ limit: '10kb' })); // Restricted from 10mb to 10kb to prevent payload DoS
app.use(express.urlencoded({ limit: '10kb', extended: true }));
app.use(cookieParser());
app.use(mongoSanitize()); // Prevent NoSQL injection
app.use(hpp()); // Prevent HTTP Parameter Pollution
app.use(trimStrings); // Trim whitespace from all body string fields

// 8. Response compression
app.use(compression({ threshold: 1024 }));

// ---- End Security & Performance Middleware ----

// Request logging (development only)
if (env.isDev) {
  app.use((req: Request, _res: Response, next) => {
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

// Detailed health check with DB ping
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
  httpServer.close(async () => {
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

// B24 FIX: Wrap server startup in an async function
async function start(): Promise<void> {
  await connectDB();
  const PORT = env.port;
  httpServer.listen(PORT, () => {
    console.log(`Worker ${process.pid} listening on port ${PORT}`);
  });
}

// Cluster logic to spawn workers per CPU core for max throughput and reliability
if (cluster.isPrimary) {
  const numCPUs = os.cpus().length;
  console.log(`Primary cluster setting up ${numCPUs} workers...`);

  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('online', (worker) => {
    console.log(`Worker ${worker.process.pid} is online`);
  });

  cluster.on('exit', (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died with code: ${code}, and signal: ${signal}`);
    console.log('Starting a new worker to replace it...');
    cluster.fork();
  });

  // Self-ping Cron to prevent PaaS instances (Render/Heroku) from sleeping
  setInterval(() => {
    fetch(`http://localhost:${env.port}/api/health`)
      .then(() => console.log('Self-ping successful (Keeping instance warm)'))
      .catch((err) => console.error('Self-ping failed:', err.message));
  }, 10 * 60 * 1000); // Every 10 mins

} else {
  start().catch((err) => {
    console.error(`Worker ${process.pid} failed to start:`, err);
    process.exit(1);
  });
}

export default app;
