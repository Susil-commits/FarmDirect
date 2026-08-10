import { v2 as cloudinary } from 'cloudinary';
import { env, isCloudinaryConfigured } from './env.js';

if (isCloudinaryConfigured()) {
  if (env.cloudinaryUrl) {
    cloudinary.config({
      cloudinary_url: env.cloudinaryUrl,
      secure: true,
    });
  } else {
    cloudinary.config({
      cloud_name: env.cloudinaryCloudName,
      api_key: env.cloudinaryApiKey,
      api_secret: env.cloudinaryApiSecret,
      secure: true,
    });
  }
}

export { cloudinary, isCloudinaryConfigured };
export default cloudinary;

