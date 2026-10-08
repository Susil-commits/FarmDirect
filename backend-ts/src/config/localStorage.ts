import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { env } from './env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const UPLOADS_ROOT = path.resolve(env.uploadDir || path.join(__dirname, '..', 'uploads'));

function ensureDir(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

export interface LocalStorageResult {
  url: string;
  fileName: string;
  fileSize: number;
  filePath: string;
}

export function saveToLocalStorage(
  fileBuffer: Buffer,
  fileName: string,
  folder = 'general',
): LocalStorageResult {
  // Disallow path traversal components in folder
  const safeFolder = path.basename(folder).replace(/[^a-zA-Z0-9_-]/g, '') || 'general';
  const folderPath = path.join(UPLOADS_ROOT, safeFolder);
  ensureDir(folderPath);

  const timestamp = Date.now();
  const random = crypto.randomInt(1000, 9999);
  const ext = path.extname(fileName).slice(0, 10).replace(/[^a-zA-Z0-9.]/g, '');
  const base = path.basename(fileName, ext).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 50);
  const uniqueName = `${timestamp}-${random}-${base || 'file'}${ext}`;
  const filePath = path.resolve(folderPath, uniqueName);

  // Strict path containment verification
  const relative = path.relative(UPLOADS_ROOT, filePath);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error('Invalid file storage path');
  }

  fs.writeFileSync(filePath, fileBuffer);

  const url = `/uploads/${safeFolder}/${uniqueName}`;

  return { url, fileName, fileSize: fileBuffer.length, filePath };
}

export function deleteFromLocalStorage(fileUrl: string): boolean {
  try {
    if (!fileUrl || !fileUrl.startsWith('/uploads/')) return false;
    const stripped = fileUrl.replace(/^\/uploads\//, '');
    const absolutePath = path.resolve(UPLOADS_ROOT, stripped);
    
    // Ensure the target file is strictly inside UPLOADS_ROOT
    const relative = path.relative(UPLOADS_ROOT, absolutePath);
    if (relative.startsWith('..') || path.isAbsolute(relative)) {
      return false;
    }

    if (fs.existsSync(absolutePath)) {
      fs.unlinkSync(absolutePath);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error deleting local file:', error instanceof Error ? error.message : error);
    return false;
  }
}

export function getLocalFilePath(fileUrl: string): string | null {
  if (!fileUrl || !fileUrl.startsWith('/uploads/')) return null;
  const relativePath = fileUrl.replace('/uploads/', '');
  const absolutePath = path.join(UPLOADS_ROOT, relativePath);
  return fs.existsSync(absolutePath) ? absolutePath : null;
}

export function getUploadsRoot(): string {
  return UPLOADS_ROOT;
}

export default { saveToLocalStorage, deleteFromLocalStorage, getLocalFilePath, getUploadsRoot };
