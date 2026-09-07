import { Router, type Request, type Response } from 'express';
import rateLimit from 'express-rate-limit';
import { uploadSingleFile, uploadMultipleFiles } from '../middleware/localUpload.js';
import { generatePresignedUploadParams } from '../utils/cloudinaryService.js';
import { protect, authorize } from '../middleware/auth.js';
import { createRateLimitStore } from '../config/rateLimiter.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess, sendCreated, sendError } from '../utils/apiResponse.js';
import { UserRole } from '../types/enums.js';

const router = Router();

const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // 30 uploads per window
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    return req.user?._id ? `user_${req.user._id}` : (req.ip || 'unknown');
  },
  store: createRateLimitStore('rl:upload:'),
  message: {
    success: false,
    message: 'Too many upload requests. Please wait a few minutes before trying again.',
  },
});

// All upload routes require authentication, authorized role, and dedicated rate limit
router.use(protect);
router.use(authorize(UserRole.Farmer, UserRole.Buyer, UserRole.Admin));
router.use(uploadLimiter);

router.post(
  '/',
  uploadSingleFile('general'),
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.uploadedFile) {
      sendError(res, req.uploadError || 'No file uploaded', 400);
      return;
    }
    sendCreated(res, {
      message: 'File uploaded successfully',
      url: req.uploadedFile.url,
      data: req.uploadedFile,
    });
  }),
);

router.post(
  '/multiple',
  uploadMultipleFiles('general', 5),
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.uploadedFiles || req.uploadedFiles.length === 0) {
      sendError(res, req.uploadError || 'No files uploaded', 400);
      return;
    }
    sendCreated(res, {
      message: 'Files uploaded successfully',
      urls: req.uploadedFiles.map((f) => f.url),
      data: req.uploadedFiles,
    });
  }),
);

router.post(
  '/presign',
  asyncHandler(async (req: Request, res: Response) => {
    const { folder = 'general' } = req.body as { folder?: string };
    const params = generatePresignedUploadParams(folder);
    sendSuccess(res, { message: 'Presigned upload parameters generated', data: params });
  }),
);

export default router;
