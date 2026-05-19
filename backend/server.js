import express from 'express';
import cors from 'cors';
import compression from 'compression';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import errorHandler from './middleware/errorHandler.js';
import { resetServerStartTime, getServerStartTime } from './utils/serverTime.js';

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
import dataAccessRoutes from './routes/dataAccessRoutes.js';
import { uploadSingleFile } from './middleware/localUpload.js';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Resolve __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Reset server start time on app initialization
resetServerStartTime();

// Connect to MongoDB
connectDB();

// ---- Security & Performance Middleware (order matters) ----

// 1. Helmet: secure HTTP headers (CSP, X-Frame-Options, etc.)
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }, // allow cross-origin images/uploads
  contentSecurityPolicy: false, // CSP managed by frontend build tooling
}));

// 2. CORS
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));

// 3. Global rate limiter — 200 requests per 15 min per IP (generous, won't affect normal use)
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
});
app.use(globalLimiter);

// 4. Stricter rate limiter for auth routes (login/register/forgot-password)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many authentication attempts, please try again later.' },
});
app.use('/api/auth', authLimiter);

// 5. Body parsing
app.use(express.json());
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// 6. Response compression — gzip/brotli JSON responses (3-5x smaller)
app.use(compression({
  threshold: 1024, // only compress responses > 1KB
}));

// ---- End Security & Performance Middleware ----

// Request logging middleware (development only)
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    message: 'Server is running', 
    timestamp: new Date(),
    serverStartTime: getServerStartTime()
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
app.use('/api/data', dataAccessRoutes);

// File upload route (for profile pictures, crop images, etc.)
app.post('/api/upload', uploadSingleFile('general'), (req, res) => {
  if (!req.uploadedFile || !req.uploadedFile.url) {
    return res.status(400).json({ message: 'No file uploaded' });
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
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Error handling middleware
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📁 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🛡️  Rate limiting: 200 req/15min (global), 30 req/15min (auth)`);
});

export default app;
