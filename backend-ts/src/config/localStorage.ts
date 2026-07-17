import fs from 'fs';
import path from 'path';
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
  const folderPath = path.join(UPLOADS_ROOT, folder);
  ensureDir(folderPath);

  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  const uniqueName = `${timestamp}-${random}-${safeName}`;
  const filePath = path.join(folderPath, uniqueName);

  fs.writeFileSync(filePath, fileBuffer);

  const url = `/uploads/${folder}/${uniqueName}`;

  return { url, fileName, fileSize: fileBuffer.length, filePath };
}

export function deleteFromLocalStorage(fileUrl: string): boolean {
  try {
    if (!fileUrl || !fileUrl.startsWith('/uploads/')) return false;
    const relativePath = fileUrl.replace('/uploads/', '');
    const absolutePath = path.join(UPLOADS_ROOT, relativePath);
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
