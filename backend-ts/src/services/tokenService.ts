import { redisClient } from '../config/redis.js';

const DEFAULT_TTL_SECONDS = 7 * 24 * 60 * 60; 

export async function revokeToken(jti: string, ttlSeconds = DEFAULT_TTL_SECONDS): Promise<void> {
  if (!jti) return;
  try {
    if (redisClient.isReady) {
      await redisClient.setEx(`revoked:jti:${jti}`, ttlSeconds, '1');
    }
  } catch (error) {
    console.warn('Failed to revoke token in Redis:', error);
  }
}

export async function isTokenRevoked(jti: string): Promise<boolean> {
  if (!jti) return false;
  try {
    if (redisClient.isReady) {
      const isRevoked = await redisClient.get(`revoked:jti:${jti}`);
      return isRevoked === '1';
    }
  } catch (error) {
    console.warn('Failed to check token revocation status in Redis:', error);
  }
  return false;
}

export default {
  revokeToken,
  isTokenRevoked,
};
