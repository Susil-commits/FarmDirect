import multer from 'multer';
import { uploadToCloudinary } from '../config/cloudinary.js';
import asyncHandler from '../utils/asyncHandler.js';

// Configure multer to store files in memory (not disk)
const storage = multer.memoryStorage();

// File filter - only allow specific types
const fileFilter = (req, file, cb) => {
  const allowedMimes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/tiff',
    'application/pdf',
    'video/mp4',
    'video/quicktime',
    'audio/mpeg',
    'audio/wav',
    'document/csv'
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
 * Upload single file to Cloudinary
 * Middleware to upload file from request to Cloudinary
 */
export const uploadSingleFile = (folder = 'farm') => {
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
        const cloudinaryResult = await uploadToCloudinary(
          req.file.buffer,
          req.file.originalname,
          folder
        );

        // Attach upload result to request for use in route handler
        req.uploadedFile = {
          url: cloudinaryResult.url,
          public_id: cloudinaryResult.public_id,
          fileName: req.file.originalname,
          fileSize: cloudinaryResult.fileSize,
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
 * Upload multiple files to Cloudinary
 */
export const uploadMultipleFiles = (folder = 'farm', maxFiles = 5) => {
  return [
    upload.array('files', maxFiles),
    asyncHandler(async (req, res, next) => {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No files provided'
        });
      }

      try {
        const uploadPromises = req.files.map(file =>
          uploadToCloudinary(file.buffer, file.originalname, folder)
        );

        const results = await Promise.all(uploadPromises);

        req.uploadedFiles = results.map((result, index) => ({
          url: result.url,
          public_id: result.public_id,
          fileName: req.files[index].originalname,
          fileSize: result.fileSize,
          mimeType: req.files[index].mimetype
        }));

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
 * Upload profile picture
 */
export const uploadProfilePicture = () => {
  return uploadSingleFile('farm/profiles');
};

/**
 * Upload crop listing images
 */
export const uploadCropImages = () => {
  return uploadMultipleFiles('farm/crops', 5);
};

/**
 * Upload KYC documents
 */
export const uploadKYCDocuments = () => {
  return uploadMultipleFiles('farm/kyc', 3);
};

/**
 * Upload order documents (invoices, etc)
 */
export const uploadOrderDocuments = () => {
  return uploadMultipleFiles('farm/orders', 10);
};

export default upload;
