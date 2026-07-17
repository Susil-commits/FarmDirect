import { cloudinary, isCloudinaryConfigured } from '../config/cloudinary.js';
import { saveToLocalStorage, deleteFromLocalStorage, type LocalStorageResult } from '../config/localStorage.js';

export interface UploadResult {
  url: string;
  fileName: string;
  fileSize: number;
  publicId?: string;
}

export async function uploadFile(
  fileBuffer: Buffer,
  fileName: string,
  folder = 'general',
): Promise<UploadResult> {
  if (!isCloudinaryConfigured()) {
    const local: LocalStorageResult = saveToLocalStorage(fileBuffer, fileName, folder);
    return { url: local.url, fileName: local.fileName, fileSize: local.fileSize };
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
      },
    );
    return {
      url: result.secure_url,
      fileName,
      fileSize: fileBuffer.length,
      publicId: result.public_id,
    };
  } catch (error) {
    console.error(
      'Cloudinary upload failed, falling back to local:',
      error instanceof Error ? error.message : error,
    );
    const local = saveToLocalStorage(fileBuffer, fileName, folder);
    return { url: local.url, fileName: local.fileName, fileSize: local.fileSize };
  }
}

export async function deleteFile(fileUrl: string): Promise<boolean> {
  if (!fileUrl) return false;

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
