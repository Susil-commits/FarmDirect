import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Root uploads directory (relative to backend/)
const UPLOADS_ROOT = path.join(__dirname, '..', 'uploads');

/**
 * Ensure a directory exists, creating it recursively if needed
 */
const ensureDir = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

/**
 * Save a file buffer to disk
 * @param {Buffer} fileBuffer - File buffer from multer
 * @param {String} fileName - Original file name
 * @param {String} folder - Subfolder within uploads (e.g., 'kyc_documents', 'crops', 'profiles')
 * @returns {Object} - { url, fileName, fileSize, mimeType }
 */
export const saveToLocalStorage = (fileBuffer, fileName, folder = 'general') => {
  const folderPath = path.join(UPLOADS_ROOT, folder);
  ensureDir(folderPath);

  // Generate unique filename to prevent collisions
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  const uniqueName = `${timestamp}-${random}-${safeName}`;
  const filePath = path.join(folderPath, uniqueName);

  fs.writeFileSync(filePath, fileBuffer);

  // Return a relative URL path (served by Express static middleware)
  const url = `/uploads/${folder}/${uniqueName}`;

  return {
    url,
    fileName,
    fileSize: fileBuffer.length,
    filePath, // absolute path for server-side operations
  };
};

/**
 * Delete a file from local storage
 * @param {String} fileUrl - The URL path (e.g., '/uploads/kyc_documents/123-file.pdf')
 * @returns {Boolean} - Whether deletion succeeded
 */
export const deleteFromLocalStorage = (fileUrl) => {
  try {
    if (!fileUrl || !fileUrl.startsWith('/uploads/')) {
      return false;
    }
    const relativePath = fileUrl.replace('/uploads/', '');
    const absolutePath = path.join(UPLOADS_ROOT, relativePath);

    if (fs.existsSync(absolutePath)) {
      fs.unlinkSync(absolutePath);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error deleting local file:', error.message);
    return false;
  }
};

/**
 * Get the absolute file path from a URL
 * @param {String} fileUrl - The URL path (e.g., '/uploads/kyc_documents/123-file.pdf')
 * @returns {String|null} - Absolute file path or null
 */
export const getLocalFilePath = (fileUrl) => {
  if (!fileUrl || !fileUrl.startsWith('/uploads/')) {
    return null;
  }
  const relativePath = fileUrl.replace('/uploads/', '');
  const absolutePath = path.join(UPLOADS_ROOT, relativePath);

  if (fs.existsSync(absolutePath)) {
    return absolutePath;
  }
  return null;
};

export default {
  saveToLocalStorage,
  deleteFromLocalStorage,
  getLocalFilePath,
};