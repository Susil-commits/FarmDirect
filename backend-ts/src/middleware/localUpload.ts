import multer, { type FileFilterCallback } from 'multer';
import type { Request } from 'express';
import { uploadFile } from '../utils/cloudinaryService.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendError } from '../utils/apiResponse.js';
import { env } from '../config/env.js';
import type { UploadedFileMeta, UploadedFileMetaWithField } from '../types/index.js';

const storage = multer.memoryStorage();

const ALLOWED_MIMES = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/tiff',
  'image/bmp', 'image/svg+xml',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv',
  'video/mp4', 'video/quicktime',
  'audio/mpeg', 'audio/wav',
];

function fileFilter(
  _req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback,
): void {
  if (ALLOWED_MIMES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Unsupported file type: ${file.mimetype}`));
  }
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: env.maxFileSize },
});

/** Upload a single file (field name `file`) to storage. */
export function uploadSingleFile(folder = 'general') {
  return [
    upload.single('file'),
    asyncHandler(async (req, res, next) => {
      if (!req.file) {
        return next();
      }
      try {
        const result = await uploadFile(req.file.buffer, req.file.originalname, folder);
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

/** Upload multiple files (any field name) to storage. */
export function uploadMultipleFiles(folder = 'general', maxFiles = 5) {
  return [
    upload.any(),
    asyncHandler(async (req, res, next) => {
      if (!req.files || req.files.length === 0) {
        req.uploadedFiles = [];
        return next();
      }

      const files = req.files as Express.Multer.File[];
      if (files.length > maxFiles) {
        return sendError(res, `Too many files. Maximum ${maxFiles} allowed.`, 400);
      }

      try {
        const results = await Promise.all(
          files.map((file) => uploadFile(file.buffer, file.originalname, folder)),
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
        console.error('Local file save failed:', error instanceof Error ? error.message : error);
        req.uploadedFiles = [];
        req.uploadError = error instanceof Error ? error.message : String(error);
        next();
      }
    }),
  ];
}

export function uploadProfilePicture() {
  return uploadSingleFile('profiles');
}

export function uploadCropImages() {
  return uploadMultipleFiles('crops', 5);
}

export function uploadKYCDocuments() {
  return uploadMultipleFiles('kyc_documents', 10);
}

export function uploadOrderDocuments() {
  return uploadMultipleFiles('orders', 10);
}

export default upload;
