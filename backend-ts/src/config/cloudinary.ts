import { v2 as cloudinary } from 'cloudinary';
import { env, isCloudinaryConfigured } from './env.js';

if (isCloudinaryConfigured()) {
  cloudinary.config({
    cloud_name: env.cloudinaryCloudName,
    api_key: env.cloudinaryApiKey,
    api_secret: env.cloudinaryApiSecret,
    secure: true,
  });
} else {
}

export { cloudinary, isCloudinaryConfigured };
export default cloudinary;
