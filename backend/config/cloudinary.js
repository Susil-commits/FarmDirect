import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload file to Cloudinary
 * @param {Buffer} fileBuffer - File buffer from multer
 * @param {String} fileName - Original file name
 * @param {String} folder - Cloudinary folder path (e.g., 'farm/crops', 'farm/users')
 * @returns {Promise<Object>} - Upload result with URL and public_id
 */
export const uploadToCloudinary = (fileBuffer, fileName, folder = 'farm') => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: folder,
        resource_type: 'auto',
        public_id: fileName.split('.')[0], // Remove extension
        use_filename: true,
        unique_filename: true,
        quality: 'auto', // Auto-optimize quality
        transformation: [
          {
            width: 1000,
            height: 1000,
            crop: 'fill',
            quality: 'auto',
          }
        ]
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve({
            url: result.secure_url,
            public_id: result.public_id,
            width: result.width,
            height: result.height,
            fileSize: result.bytes,
            format: result.format
          });
        }
      }
    );

    uploadStream.end(fileBuffer);
  });
};

/**
 * Delete file from Cloudinary
 * @param {String} publicId - Public ID of the file to delete
 */
export const deleteFromCloudinary = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
    throw error;
  }
};

/**
 * Generate optimized URL for different use cases
 * @param {String} publicId - Public ID of the file
 * @param {Object} options - Transformation options
 */
export const getOptimizedUrl = (publicId, options = {}) => {
  const {
    width = 800,
    height = 600,
    crop = 'fill',
    quality = 'auto',
    format = 'auto'
  } = options;

  return cloudinary.url(publicId, {
    width,
    height,
    crop,
    quality,
    format,
    secure: true
  });
};

/**
 * Get thumbnail URL
 * @param {String} publicId - Public ID of the file
 */
export const getThumbnailUrl = (publicId) => {
  return cloudinary.url(publicId, {
    width: 300,
    height: 300,
    crop: 'fill',
    quality: 'auto',
    format: 'auto',
    secure: true
  });
};

export default cloudinary;
