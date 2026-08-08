import { redisClient } from '../config/redis.js';

export const CACHE_KEYS = {
  FARMER_CROPS: (farmerId: string) => `farmer:crops:${farmerId}`,
  FARMER_ORDERS: (farmerId: string) => `farmer:orders:${farmerId}`,
  FARMER_ANALYTICS: (farmerId: string) => `farmer:analytics:${farmerId}`,
  BUYER_ORDERS: (buyerId: string) => `buyer:orders:${buyerId}`,
  ALL_CROPS: 'crops:all:approved',
  CROP_DETAIL: (cropId: string) => `crop:detail:${cropId}`,
  USER_PROFILE: (userId: string) => `user:profile:${userId}`,
  ADMIN_USERS: 'admin:users',
  ADMIN_CROPS: 'admin:crops',
  ADMIN_ORDERS: 'admin:orders',
  ADMIN_ANALYTICS: 'admin:analytics',
} as const;

export async function setCache<T>(key: string, value: T, ttlSeconds = 120): Promise<void> {
  if (!redisClient.isReady) return;
  try {
    await redisClient.setEx(key, ttlSeconds, JSON.stringify(value));
  } catch (error) {
    console.error(`Failed to set cache for key ${key}`, error);
  }
}

export async function getCache<T = unknown>(key: string): Promise<T | null> {
  if (!redisClient.isReady) return null;
  try {
    const cached = await redisClient.get(key);
    if (!cached) return null;
    return JSON.parse(cached) as T;
  } catch (error) {
    console.error(`Failed to get cache for key ${key}`, error);
    return null;
  }
}

export async function invalidateCache(pattern: string): Promise<void> {
  if (!redisClient.isReady) return;
  try {
    const keys = await redisClient.keys(`*${pattern}*`);
    if (keys.length > 0) {
      await redisClient.del(keys);
    }
  } catch (error) {
    console.error(`Failed to invalidate cache for pattern ${pattern}`, error);
  }
}

export async function clearPrefix(prefix: string): Promise<void> {
  if (!redisClient.isReady) return;
  try {
    const keys = await redisClient.keys(`${prefix}*`);
    if (keys.length > 0) {
      await redisClient.del(keys);
    }
  } catch (error) {
    console.error(`Failed to clear prefix ${prefix}`, error);
  }
}

export async function clearAllCache(): Promise<void> {
  if (!redisClient.isReady) return;
  try {
    await redisClient.flushDb();
  } catch (error) {
    console.error('Failed to clear all cache', error);
  }
}

export const invalidationStrategies = {
  async cropCreated(farmerId: string): Promise<void> {
    await invalidateCache(CACHE_KEYS.FARMER_CROPS(farmerId));
    await invalidateCache(CACHE_KEYS.ALL_CROPS);
    await invalidateCache(CACHE_KEYS.ADMIN_CROPS);
  },
  async cropApproved(farmerId: string, cropId: string): Promise<void> {
    await invalidateCache(CACHE_KEYS.FARMER_CROPS(farmerId));
    await invalidateCache(CACHE_KEYS.CROP_DETAIL(cropId));
    await invalidateCache(CACHE_KEYS.ALL_CROPS);
    await invalidateCache(CACHE_KEYS.ADMIN_CROPS);
  },
  async orderCreated(buyerId: string, farmerId: string): Promise<void> {
    await invalidateCache(CACHE_KEYS.BUYER_ORDERS(buyerId));
    await invalidateCache(CACHE_KEYS.FARMER_ORDERS(farmerId));
    await invalidateCache(CACHE_KEYS.ADMIN_ORDERS);
    await invalidateCache(CACHE_KEYS.FARMER_ANALYTICS(farmerId));
  },
  async userChanged(userId: string): Promise<void> {
    await invalidateCache(CACHE_KEYS.USER_PROFILE(userId));
    await invalidateCache(CACHE_KEYS.ADMIN_USERS);
  },
  async adminAction(): Promise<void> {
    await invalidateCache(CACHE_KEYS.ADMIN_USERS);
    await invalidateCache(CACHE_KEYS.ADMIN_CROPS);
    await invalidateCache(CACHE_KEYS.ADMIN_ORDERS);
    await invalidateCache(CACHE_KEYS.ADMIN_ANALYTICS);
  },
};
