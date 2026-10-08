
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
  razorpayWebhookSecret?: string;
  geminiApiKey?: string;
  geminiModel: string;
  geminiFallbackModel: string;
  aiChatEnabled: boolean;
  aiVisionEnabled: boolean;
  aiDailyTokenCap: number;
  mlServiceUrl?: string;
  mlServiceKey: string;
  sentryDsn?: string;
}

function loadEnv(): EnvConfig {
  const required: Array<[string, string | undefined]> = [];

  if (isProd) {
    required.push(['MONGODB_URI', process.env.MONGODB_URI]);
    required.push(['JWT_SECRET', process.env.JWT_SECRET]);
    required.push(['JWT_REFRESH_SECRET', process.env.JWT_REFRESH_SECRET]);

    // Force Cloudinary in production to prevent silent data loss on ephemeral disks
    const hasCloudinaryUrl = Boolean(process.env.CLOUDINARY_URL);
    const hasCloudinaryKeys = Boolean(
      process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
    );
    if (!hasCloudinaryUrl && !hasCloudinaryKeys) {
      throw new Error(
        'Missing required Cloudinary credentials in production: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET (or CLOUDINARY_URL). Local disk storage is forbidden in production to prevent silent data loss on container restarts.'
      );
    }
  }

  const missing = required.filter(([, v]) => !v).map(([k]) => k);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  const CLOUDINARY_URL = process.env.CLOUDINARY_URL;
  let { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;
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

  const jwtSecret = process.env.JWT_SECRET || (nodeEnv === 'test' ? 'test_jwt_secret_32_characters_min!' : (isDev ? 'dev_secret_local_only_insecure' : ''));
  const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET || (nodeEnv === 'test' ? 'test_refresh_secret_32_chars_min!' : (isDev ? 'dev_refresh_secret_local_only' : ''));
  const mlServiceUrl = process.env.ML_SERVICE_URL;
  const hasMlService = Boolean(mlServiceUrl && mlServiceUrl.trim().length > 0);
  const mlServiceKey = process.env.ML_SERVICE_KEY || (nodeEnv === 'test' ? 'test_ml_secret_key' : (isDev ? 'dev_ml_secret_key' : ''));

  if (!isDev && nodeEnv !== 'test') {
    if (!jwtSecret || jwtSecret.includes('change_me') || jwtSecret.includes('local_only')) {
      throw new Error('JWT_SECRET must be explicitly set to a strong secret in production/deployed environments.');
    }
    if (!jwtRefreshSecret || jwtRefreshSecret.includes('change_me') || jwtRefreshSecret.includes('local_only')) {
      throw new Error('JWT_REFRESH_SECRET must be explicitly set to a strong secret in production/deployed environments.');
    }
    if (hasMlService && (!mlServiceKey || mlServiceKey === 'dev_ml_secret_key')) {
      throw new Error('ML_SERVICE_KEY must be explicitly set to a strong secret in production/deployed environments when ML_SERVICE_URL is configured.');
    }
  }

  return {
    nodeEnv,
    isProd,
    isDev,
    port: parseInt(process.env.PORT || '5000', 10),
    mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/farmdirect',
    jwtSecret,
    jwtExpire: process.env.JWT_EXPIRE || '15m',
    jwtRefreshSecret,
    jwtRefreshExpire: process.env.JWT_REFRESH_EXPIRE || '7d',
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
    razorpayKeyId: process.env.RAZORPAY_KEY_ID || (nodeEnv === 'test' ? 'rzp_test_mock_key_id' : undefined),
    razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET || (nodeEnv === 'test' ? 'test_secret' : undefined),
    razorpayWebhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || (nodeEnv === 'test' ? 'test_webhook_secret' : undefined),
    geminiApiKey: process.env.GEMINI_API_KEY,
    geminiModel: process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite',
    geminiFallbackModel: process.env.GEMINI_FALLBACK_MODEL || 'gemini-2.5-flash-lite',
    aiChatEnabled: parseBoolean(process.env.AI_CHAT_ENABLED, true),
    aiVisionEnabled: parseBoolean(process.env.AI_VISION_ENABLED, true),
    aiDailyTokenCap: parseInt(process.env.AI_DAILY_TOKEN_CAP || '50000', 10),
    mlServiceUrl: process.env.ML_SERVICE_URL,
    mlServiceKey,
    sentryDsn: process.env.SENTRY_DSN,
  };
}

export const env = loadEnv();

export function isCloudinaryConfigured(): boolean {
  return Boolean(env.cloudinaryCloudName && env.cloudinaryApiKey && env.cloudinaryApiSecret);
}

export function isRazorpayConfigured(): boolean {
  if (env.nodeEnv === 'test') return true;
  const id = env.razorpayKeyId;
  const secret = env.razorpayKeySecret;
  if (!id || !secret) return false;
  const placeholder = (v: string) => v.startsWith('your_') || v === 'your_key_id' || v === 'your_key_secret';
  return !placeholder(id) && !placeholder(secret);
}

export { parseBoolean, parseStringList };
