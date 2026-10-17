import multer, { type FileFilterCallback } from 'multer';
import type { Request } from 'express';
import { uploadFile } from '../utils/cloudinaryService.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendError } from '../utils/apiResponse.js';
import { env } from '../config/env.js';
import type { UploadedFileMeta, UploadedFileMetaWithField } from '../types/index.js';

import { ApiError } from '../utils/apiError.js';
import logger from '../utils/logger.js';

const storage = multer.memoryStorage();

const ALLOWED_MIMES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
];

const ALLOWED_UPLOAD_FIELDS = new Set([
  'file', 'files', 'image', 'images', 'profilePhoto',
  'governmentId', 'addressProof', 'landOwnership', 'farmRegistration',
  'businessRegistration', 'bankDetails', 'taxId', 'bankAccount', 'landSurvey',
]);

export const KYC_FIELD_NAMES = new Set([
  'governmentId', 'addressProof', 'landOwnership', 'farmRegistration',
  'businessRegistration', 'bankDetails', 'taxId', 'bankAccount', 'landSurvey',
]);

export const UPLOAD_SIZE_LIMITS = {
  // KYC / Identity documents: 15MB for high-resolution scans and multi-page PDFs
  KYC_DOCUMENT: 15 * 1024 * 1024,
  // Product / Crop listings: 5MB for compressed camera images (JPEG/PNG/WEBP)
  PRODUCT_IMAGE: 5 * 1024 * 1024,
  // User profile avatars: 5MB
  PROFILE_IMAGE: 5 * 1024 * 1024,
  // Order delivery receipts / invoices: 10MB
  ORDER_DOCUMENT: 10 * 1024 * 1024,
  // Fallback global default
  DEFAULT: env.maxFileSize || 5 * 1024 * 1024,
};

export function getFieldSizeLimit(fieldname: string, folder = 'general'): number {
  if (folder === 'kyc_documents' || KYC_FIELD_NAMES.has(fieldname)) {
    return UPLOAD_SIZE_LIMITS.KYC_DOCUMENT;
  }
  if (folder === 'crops' || fieldname === 'image' || fieldname === 'images') {
    return UPLOAD_SIZE_LIMITS.PRODUCT_IMAGE;
  }
  if (folder === 'profiles' || fieldname === 'profilePhoto') {
    return UPLOAD_SIZE_LIMITS.PROFILE_IMAGE;
  }
  if (folder === 'orders') {
    return UPLOAD_SIZE_LIMITS.ORDER_DOCUMENT;
  }
  return UPLOAD_SIZE_LIMITS.DEFAULT;
}

export function validateMagicBytes(buffer: Buffer, claimedMime: string): boolean {
  if (!buffer || buffer.length < 4) return false;

  if (claimedMime === 'image/jpeg') {
    return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }
  if (claimedMime === 'image/png') {
    return buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47;
  }
  if (claimedMime === 'image/webp') {
    return (
      buffer.length >= 12 &&
      buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
      buffer.subarray(8, 12).toString('ascii') === 'WEBP'
    );
  }
  if (claimedMime === 'application/pdf') {
    return buffer.subarray(0, 4).toString('ascii') === '%PDF';
  }
  return false;
}

function fileFilter(
  _req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback,
): void {
  const ext = file.originalname.split('.').pop()?.toLowerCase();
  if (ext === 'svg' || file.mimetype === 'image/svg+xml') {
    return cb(ApiError.badRequest('SVG files are not allowed for security reasons.'));
  }
  if (!ALLOWED_UPLOAD_FIELDS.has(file.fieldname)) {
    return cb(ApiError.badRequest(`Disallowed upload field name: ${file.fieldname}`));
  }
  if (ALLOWED_MIMES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(ApiError.badRequest(`Unsupported file type: ${file.mimetype}. Only JPEG, PNG, WEBP, and PDF are accepted.`));
  }
}

export function createMulterUploader(maxFileSize: number) {
  return multer({
    storage,
    fileFilter,
    limits: { fileSize: maxFileSize },
  });
}

const upload = createMulterUploader(UPLOAD_SIZE_LIMITS.KYC_DOCUMENT);

export function uploadSingleFile(folder = 'general', customMaxFileSize?: number) {
  const limit = customMaxFileSize ?? getFieldSizeLimit('', folder);
  const uploader = createMulterUploader(limit);
  return [
    uploader.single('file'),
    asyncHandler(async (req, res, next) => {
      if (!req.file) {
        return next();
      }
      if (req.file.size > limit) {
        return sendError(res, `File exceeds the maximum size limit of ${Math.round(limit / (1024 * 1024))}MB`, 400);
      }
      if (!validateMagicBytes(req.file.buffer, req.file.mimetype)) {
        return sendError(res, 'File content does not match the claimed MIME type (magic bytes check failed)', 400);
      }
      try {
        const result = await uploadFile(req.file.buffer, req.file.originalname, folder, req.file.mimetype);
        const meta: UploadedFileMeta = {
          url: result.url,
          fileName: req.file.originalname,
          fileSize: result.fileSize,
          mimeType: req.file.mimetype,
        };
        req.uploadedFile = meta;
        next();
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        res.status(500).json({ success: false, message: 'File upload failed', error: message });
      }
    }),
  ];
}

export function uploadMultipleFiles(folder = 'general', maxFiles = 5, customMaxFileSize?: number) {
  const limit = customMaxFileSize ?? getFieldSizeLimit('', folder);
  const uploader = createMulterUploader(limit);
  return [
    uploader.any(),
    asyncHandler(async (req, res, next) => {
      if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
        req.uploadedFiles = [];
        return next();
      }

      const files = req.files;
      if (files.length > maxFiles) {
        return sendError(res, `Too many files. Maximum ${maxFiles} allowed.`, 400);
      }

      for (const file of files) {
        const perFieldLimit = getFieldSizeLimit(file.fieldname, folder);
        if (file.size > perFieldLimit) {
          return sendError(res, `File "${file.originalname}" exceeds maximum allowed size of ${Math.round(perFieldLimit / (1024 * 1024))}MB for field ${file.fieldname}`, 400);
        }
        if (!validateMagicBytes(file.buffer, file.mimetype)) {
          return sendError(res, `File "${file.originalname}" content does not match its claimed MIME type`, 400);
        }
      }

      try {
        const results = await Promise.all(
          files.map((file) => uploadFile(file.buffer, file.originalname, folder, file.mimetype)),
        );
        const metas: UploadedFileMetaWithField[] = results.map((result, index) => ({
          url: result.url,
          fileName: files[index].originalname,
          fieldName: files[index].fieldname,
          fileSize: result.fileSize,
          mimeType: files[index].mimetype,
          ...(result.publicId ? { publicId: result.publicId } : {}),
        }));
        req.uploadedFiles = metas;
        next();
      } catch (error) {
        logger.error({ err: error instanceof Error ? error.message : error }, 'File save failed');
        req.uploadedFiles = [];
        req.uploadError = error instanceof Error ? error.message : String(error);
        next();
      }
    }),
  ];
}

export function uploadProfilePicture() {
  return uploadSingleFile('profiles', UPLOAD_SIZE_LIMITS.PROFILE_IMAGE);
}

export function uploadCropImages() {
  return uploadMultipleFiles('crops', 5, UPLOAD_SIZE_LIMITS.PRODUCT_IMAGE);
}

export function uploadKYCDocuments() {
  return uploadMultipleFiles('kyc_documents', 10, UPLOAD_SIZE_LIMITS.KYC_DOCUMENT);
}

export function uploadOrderDocuments() {
  return uploadMultipleFiles('orders', 10, UPLOAD_SIZE_LIMITS.ORDER_DOCUMENT);
}

export default upload;
