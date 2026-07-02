import cloudinary, { isCloudinaryConfigured } from '../config/cloudinary.js';
import { saveToLocalStorage, deleteFromLocalStorage } from '../config/localStorage.js';

/**
 * Cloudinary upload service with automatic local-disk fallback.
 *
 * - If Cloudinary env vars are set → uploads to Cloudinary and returns a CDN URL.
 * - Otherwise → falls back to local disk storage (the existing behaviour).
 *
 * This keeps the app working out-of-the-box while enabling Cloudinary when
 * credentials are provided.
 */

/**
 * Upload a file buffer to Cloudinary (or local disk as fallback).
 * @param {Buffer} fileBuffer - multer file buffer
 * @param {String} fileName  - original file name
 * @param {String} folder    - subfolder / Cloudinary folder tag
 * @returns {Promise<{url, fileName, fileSize, filePath?}>}
 */
export const uploadFile = async (fileBuffer, fileName, folder = 'general') => {
  if (!isCloudinaryConfigured) {
    return saveToLocalStorage(fileBuffer, fileName, folder);
  }

  try {
    const result = await cloudinary.uploader.upload(
      `data:application/octet-stream;base64,${fileBuffer.toString('base64')}`,
      {
        folder: `farmdirect/${folder}`,
        resource_type: 'auto',
        use_filename: true,
        unique_filename: true,
        overwrite: false,
      }
    );

    return {
      url: result.secure_url,
      fileName,
      fileSize: fileBuffer.length,
      publicId: result.public_id,
    };
  } catch (error) {
    console.error('☁️  Cloudinary upload failed, falling back to local:', error.message);
    return saveToLocalStorage(fileBuffer, fileName, folder);
  }
};

/**
 * Delete a file. Detects Cloudinary URLs vs local paths automatically.
 */
export const deleteFile = async (fileUrl) => {
  if (!fileUrl) return false;

  // Cloudinary URLs contain 'res.cloudinary.com'
  if (isCloudinaryConfigured && fileUrl.includes('res.cloudinary.com')) {
    try {
      // Extract public_id from the URL (last path segments, strip extension)
      const urlObj = new URL(fileUrl);
      const pathParts = urlObj.pathname.split('/');
      const uploadIdx = pathParts.indexOf('upload');
      if (uploadIdx !== -1) {
        // Remove version segment if present (e.g., /upload/v123456/folder/file)
        let idParts = pathParts.slice(uploadIdx + 1);
        if (idParts[0]?.startsWith('v') && /^\d+$/.test(idParts[0].slice(1))) {
          idParts = idParts.slice(1);
        }
        const publicId = idParts.join('/').replace(/\.[^.]+$/, '');
        if (publicId) {
          await cloudinary.uploader.destroy(publicId, { resource_type: 'auto' });
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('☁️  Cloudinary delete failed:', error.message);
      return false;
    }
  }

  // Local file
  return deleteFromLocalStorage(fileUrl);
};

export default { uploadFile, deleteFile };
