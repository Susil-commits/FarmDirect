import multer from 'multer';
import { saveToLocalStorage } from '../config/localStorage.js';
import { uploadFile } from '../utils/cloudinaryService.js';
import asyncHandler from '../utils/asyncHandler.js';

// Configure multer to store files in memory (buffer) for processing
const storage = multer.memoryStorage();

// File filter - allow common document and image types
const fileFilter = (req, file, cb) => {
  const allowedMimes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/tiff',
    'image/bmp',
    'image/svg+xml',
    'application/pdf',
    'application/msword',                                    // .doc
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
    'application/vnd.ms-excel',                              // .xls
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'text/csv',                                              // .csv
    'video/mp4',
    'video/quicktime',
    'audio/mpeg',
    'audio/wav',
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Unsupported file type: ${file.mimetype}`));
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  }
});

/**
 * Upload single file to local storage
 * Middleware to save file from request to local disk
 */
export const uploadSingleFile = (folder = 'general') => {
  return [
    upload.single('file'),
    asyncHandler(async (req, res, next) => {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file provided'
        });
      }

      try {
        const result = await uploadFile(
          req.file.buffer,
          req.file.originalname,
          folder
        );

        // Attach upload result to request for use in route handler
        req.uploadedFile = {
          url: result.url,
          fileName: req.file.originalname,
          fileSize: result.fileSize,
          mimeType: req.file.mimetype
        };

        next();
      } catch (error) {
        res.status(500).json({
          success: false,
          message: 'File upload failed',
          error: error.message
        });
      }
    })
  ];
};

/**
 * Upload multiple files to local storage
 */
export const uploadMultipleFiles = (folder = 'general', maxFiles = 5) => {
  return [
    upload.any(), // Accept files from any field name
    asyncHandler(async (req, res, next) => {
      // DEBUG: Log incoming request details for troubleshooting
      console.log('📦 [uploadMultipleFiles] Content-Type:', req.get('Content-Type'));
      console.log('📦 [uploadMultipleFiles] req.files count:', req.files?.length || 0);
      console.log('📦 [uploadMultipleFiles] req.body keys:', Object.keys(req.body || {}));
      if (req.files && req.files.length > 0) {
        req.files.forEach((f, i) => {
          console.log(`  File ${i}: fieldname="${f.fieldname}", originalname="${f.originalname}", size=${f.size}, mimetype="${f.mimetype}"`);
        });
      }

      // If no files provided, pass through to controller
      if (!req.files || req.files.length === 0) {
        console.log('ℹ️ No files provided, passing through to controller');
        req.uploadedFiles = [];
        return next();
      }

      // Enforce max files limit
      if (req.files.length > maxFiles) {
        return res.status(400).json({
          success: false,
          message: `Too many files. Maximum ${maxFiles} allowed.`
        });
      }

      try {
        const results = await Promise.all(
          req.files.map(file => uploadFile(file.buffer, file.originalname, folder))
        );

        req.uploadedFiles = results.map((result, index) => ({
          url: result.url,
          fileName: req.files[index].originalname,
          fieldName: req.files[index].fieldname, // Preserve form field name for document type mapping
          fileSize: result.fileSize,
          mimeType: req.files[index].mimetype
        }));

        next();
      } catch (error) {
        console.error('❌ Local file save failed:', error.message);
        req.uploadedFiles = [];
        req.uploadError = error.message;
        next();
      }
    })
  ];
};

/**
 * Upload profile picture
 */
export const uploadProfilePicture = () => {
  return uploadSingleFile('profiles');
};

/**
 * Upload crop listing images
 */
export const uploadCropImages = () => {
  return uploadMultipleFiles('crops', 5);
};

/**
 * Upload KYC documents
 */
export const uploadKYCDocuments = () => {
  return uploadMultipleFiles('kyc_documents', 10);
};

/**
 * Upload order documents (invoices, etc)
 */
export const uploadOrderDocuments = () => {
  return uploadMultipleFiles('orders', 10);
};

export default upload;