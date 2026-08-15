
import dotenv from 'dotenv';

dotenv.config();

type EnvMode = 'development' | 'production' | 'test';

function parseBoolean(value: string | undefined, fallback = false): boolean {
  if (value === undefined) return fallback;
  return value === 'true' || value === '1';
}

function parseStringList(value: string | undefined, fallback: string[] = []): string[] {
  if (!value) return fallback;
  return value.split(',').map((s) => s.trim()).filter(Boolean);
}

const nodeEnv = (process.env.NODE_ENV as EnvMode) ?? 'development';
const isProd = nodeEnv === 'production';
const isDev = nodeEnv === 'development';

export interface EnvConfig {
  nodeEnv: EnvMode;
  isProd: boolean;
  isDev: boolean;
  port: number;
  mongoUri: string;
  jwtSecret: string;
  jwtExpire: string;
  jwtRefreshSecret: string;
  jwtRefreshExpire: string;
  corsOrigins: string[];
  frontendUrl: string;
  smtpHost?: string;
  smtpPort: number;
  smtpUser?: string;
  smtpPass?: string;
  smtpFrom: string;
  adminEmail: string;
  cloudinaryCloudName?: string;
  cloudinaryApiKey?: string;
  cloudinaryApiSecret?: string;
  cloudinaryUrl?: string;
  maxFileSize: number;
  uploadDir: string;
  razorpayKeyId?: string;
  razorpayKeySecret?: string;
  googleClientId?: string;
  googleClientSecret?: string;
  githubClientId?: string;
  githubClientSecret?: string;
  geminiApiKey?: string;
}

function loadEnv(): EnvConfig {
  const required: Array<[string, string | undefined]> = [];

  if (isProd) {
    required.push(['MONGODB_URI', process.env.MONGODB_URI]);
    required.push(['JWT_SECRET', process.env.JWT_SECRET]);
    required.push(['JWT_REFRESH_SECRET', process.env.JWT_REFRESH_SECRET]);
  }

  const missing = required.filter(([, v]) => !v).map(([k]) => k);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  let { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET, CLOUDINARY_URL } = process.env;
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    if (CLOUDINARY_URL) {
      const match = CLOUDINARY_URL.match(/^cloudinary:\/\/([^:]+):([^@]+)@(.+)$/);
      if (match) {
        CLOUDINARY_API_KEY = match[1];
        CLOUDINARY_API_SECRET = match[2];
        CLOUDINARY_CLOUD_NAME = match[3];
      }
    }
  }

  return {
    nodeEnv,
    isProd,
    isDev,
    port: parseInt(process.env.PORT || '5000', 10),
    mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/farmdirect',
    jwtSecret: process.env.JWT_SECRET || 'dev_secret_change_me',
    jwtExpire: process.env.JWT_EXPIRE || '7d',
    jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'dev_refresh_secret_change_me',
    jwtRefreshExpire: process.env.JWT_REFRESH_EXPIRE || '30d',
    corsOrigins: parseStringList(
      process.env.CORS_ORIGIN,
      ['http://localhost:5173'],
    ),
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
    smtpHost: process.env.SMTP_HOST,
    smtpPort: parseInt(process.env.SMTP_PORT || '587', 10),
    smtpUser: process.env.SMTP_USER,
    smtpPass: process.env.SMTP_PASS,
    smtpFrom: process.env.SMTP_FROM || 'noreply@farm.local',
    adminEmail: process.env.ADMIN_EMAIL || 'admin@farm.local',
    cloudinaryCloudName: CLOUDINARY_CLOUD_NAME,
    cloudinaryApiKey: CLOUDINARY_API_KEY,
    cloudinaryApiSecret: CLOUDINARY_API_SECRET,
    cloudinaryUrl: CLOUDINARY_URL,
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880', 10),
    uploadDir: process.env.UPLOAD_DIR || './uploads',
    razorpayKeyId: process.env.RAZORPAY_KEY_ID,
    razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET,
    googleClientId: process.env.GOOGLE_CLIENT_ID,
    googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
    githubClientId: process.env.GITHUB_CLIENT_ID,
    githubClientSecret: process.env.GITHUB_CLIENT_SECRET,
    geminiApiKey: process.env.GEMINI_API_KEY,
  };
}

export const env = loadEnv();

export function isCloudinaryConfigured(): boolean {
  return Boolean(env.cloudinaryCloudName && env.cloudinaryApiKey && env.cloudinaryApiSecret);
}

export function isRazorpayConfigured(): boolean {
  const id = env.razorpayKeyId;
  const secret = env.razorpayKeySecret;
  if (!id || !secret) return false;
  const placeholder = (v: string) => v.startsWith('your_') || v === 'your_key_id' || v === 'your_key_secret';
  return !placeholder(id) && !placeholder(secret);
}

export { parseBoolean, parseStringList };
