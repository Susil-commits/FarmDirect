import { redisClient } from '../config/redis.js';
import RevokedToken from '../models/RevokedToken.js';

const DEFAULT_TTL_SECONDS = 7 * 24 * 60 * 60; 

export async function revokeToken(jti: string, ttlSeconds = DEFAULT_TTL_SECONDS): Promise<void> {
  if (!jti) return;
  let redisSuccess = false;

  try {
    if (redisClient.isReady) {
      await redisClient.setEx(`revoked:jti:${jti}`, ttlSeconds, '1');
      redisSuccess = true;
    }
  } catch (error) {
    console.warn('Failed to revoke token in Redis:', error);
  }

  // Fallback to MongoDB when Redis isn't ready or failed
  if (!redisSuccess) {
    try {
      const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
      await RevokedToken.findOneAndUpdate(
        { jti },
        { $set: { jti, expiresAt } },
        { upsert: true }
      );
    } catch (dbError) {
      console.warn('Failed to persist revoked token to MongoDB:', dbError);
    }
  }
}

export async function isTokenRevoked(jti: string): Promise<boolean> {
  if (!jti) return false;

  // 1. Check Redis if ready
  if (redisClient.isReady) {
    try {
      const isRevoked = await redisClient.get(`revoked:jti:${jti}`);
      if (isRevoked === '1') return true;
    } catch (error) {
      console.warn('Failed to check token revocation status in Redis:', error);
    }
  }

  // 2. Check MongoDB fallback (when Redis isn't ready or if revoked during an outage)
  try {
    const doc = await RevokedToken.findOne({ jti, expiresAt: { $gt: new Date() } }).lean();
    if (doc) {
      if (redisClient.isReady) {
        const remainingSeconds = Math.max(1, Math.floor((doc.expiresAt.getTime() - Date.now()) / 1000));
        redisClient.setEx(`revoked:jti:${jti}`, remainingSeconds, '1').catch(() => {});
      }
      return true;
    }
  } catch (dbError) {
    console.warn('Failed to check token revocation status in MongoDB:', dbError);
  }

  return false;
}

export default {
  revokeToken,
  isTokenRevoked,
};
