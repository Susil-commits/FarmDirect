import { cloudinary, isCloudinaryConfigured } from '../config/cloudinary.js';
import { saveToLocalStorage, deleteFromLocalStorage, type LocalStorageResult } from '../config/localStorage.js';

export interface UploadResult {
  url: string;
  fileName: string;
  fileSize: number;
  publicId?: string;
}

const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024;

export async function uploadFile(
  fileBuffer: Buffer,
  fileName: string,
  folder = 'general',
  mimeType = 'image/jpeg',
): Promise<UploadResult> {
  if (!fileBuffer || fileBuffer.length === 0) {
    throw new Error('Cannot upload an empty file buffer');
  }

  if (fileBuffer.length > MAX_FILE_SIZE_BYTES) {
    throw new Error(`File exceeds maximum allowed size (${MAX_FILE_SIZE_BYTES / 1024 / 1024} MB)`);
  }

  if (!isCloudinaryConfigured()) {
    const local: LocalStorageResult = saveToLocalStorage(fileBuffer, fileName, folder);
    return { url: local.url, fileName: local.fileName, fileSize: local.fileSize };
  }

  try {
    const result = await new Promise<UploadResult>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: `farmdirect/${folder}`,
          resource_type: 'auto',
          use_filename: true,
          unique_filename: true,
          overwrite: false,
        },
        (error, res) => {
          if (error || !res) {
            return reject(error || new Error('Upload result undefined from Cloudinary'));
          }
          resolve({
            url: res.secure_url,
            fileName,
            fileSize: fileBuffer.length,
            publicId: res.public_id,
          });
        },
      );
      uploadStream.end(fileBuffer);
    });
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    if (message.includes('Invalid API Key') || message.includes('Invalid API Secret')) {
      console.error('Cloudinary auth error — falling back to local storage:', message);
    } else if (message.includes('ENOTFOUND') || message.includes('ETIMEDOUT') || message.includes('ECONNREFUSED')) {
      console.error('Cloudinary network error — falling back to local storage:', message);
    } else if (message.includes('format') || message.includes('Invalid image')) {
      console.error('Cloudinary format error — falling back to local storage:', message);
    } else {
      console.error('Cloudinary upload failed — falling back to local storage:', message);
    }

    const local = saveToLocalStorage(fileBuffer, fileName, folder);
    return { url: local.url, fileName: local.fileName, fileSize: local.fileSize };
  }
}

export async function deleteFile(fileUrl: string): Promise<boolean> {
  if (!fileUrl || typeof fileUrl !== 'string') return false;

  if (isCloudinaryConfigured() && fileUrl.includes('res.cloudinary.com')) {
    try {
      const urlObj = new URL(fileUrl);
      const pathParts = urlObj.pathname.split('/');
      const uploadIdx = pathParts.indexOf('upload');
      if (uploadIdx !== -1) {
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
      console.error('Cloudinary delete failed:', error instanceof Error ? error.message : error);
      return false;
    }
  }

  return deleteFromLocalStorage(fileUrl);
}

export default { uploadFile, deleteFile };
