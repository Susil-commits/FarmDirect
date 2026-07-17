import { v2 as cloudinary } from 'cloudinary';
import { env, isCloudinaryConfigured } from './env.js';

if (isCloudinaryConfigured()) {
  cloudinary.config({
    cloud_name: env.cloudinaryCloudName,
    api_key: env.cloudinaryApiKey,
    api_secret: env.cloudinaryApiSecret,
    secure: true,
  });
  console.log('Cloudinary configured — uploads will use Cloudinary');
} else {
  console.log('Cloudinary not configured — uploads will use local disk storage');
}

export { cloudinary, isCloudinaryConfigured };
export default cloudinary;
