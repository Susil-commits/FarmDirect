import { v2 as cloudinary } from 'cloudinary';

/**
 * Cloudinary configuration.
 * Opt-in: only configured when all required env vars are present.
 * When not configured, the upload layer falls back to local disk storage.
 */
const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

export const isCloudinaryConfigured = Boolean(
  cloudName && apiKey && apiSecret
);

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });
  console.log('☁️  Cloudinary configured — uploads will use Cloudinary');
} else {
  console.log('💾 Cloudinary not configured — uploads will use local disk storage');
}

export default cloudinary;
