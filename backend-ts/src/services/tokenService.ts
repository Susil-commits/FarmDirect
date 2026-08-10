import { redisClient } from '../config/redis.js';

const DEFAULT_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days

/**
 * Revoke a refresh token by marking its jti in Redis
 * @param jti Unique token identifier
 * @param ttlSeconds Expiration time for key in Redis (matches token lifetime)
 */
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

/**
 * Check if a refresh token's jti is marked as revoked in Redis
 * @param jti Unique token identifier
 */
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
