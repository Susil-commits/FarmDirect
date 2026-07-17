interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

const cacheStore = new Map<string, CacheEntry<unknown>>();

export function generateCacheKey(prefix: string, ...args: unknown[]): string {
  return `${prefix}:${args.join(':')}`;
}

export function setCache<T>(key: string, value: T, ttlSeconds = 300): void {
  cacheStore.set(key, {
    value,
    expiresAt: Date.now() + ttlSeconds * 1000,
  });
}

export function getCache<T = unknown>(key: string): T | null {
  const cached = cacheStore.get(key);
  if (!cached) return null;
  if (Date.now() > cached.expiresAt) {
    cacheStore.delete(key);
    return null;
  }
  return cached.value as T;
}

export function invalidateCache(pattern: string): void {
  for (const key of cacheStore.keys()) {
    if (key.includes(pattern)) cacheStore.delete(key);
  }
}

export function clearAllCache(): void {
  cacheStore.clear();
}

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

export const invalidationStrategies = {
  cropCreated(farmerId: string): void {
    invalidateCache(CACHE_KEYS.FARMER_CROPS(farmerId));
    invalidateCache(CACHE_KEYS.ALL_CROPS);
    invalidateCache(CACHE_KEYS.ADMIN_CROPS);
  },
  cropApproved(farmerId: string, cropId: string): void {
    invalidateCache(CACHE_KEYS.FARMER_CROPS(farmerId));
    invalidateCache(CACHE_KEYS.CROP_DETAIL(cropId));
    invalidateCache(CACHE_KEYS.ALL_CROPS);
    invalidateCache(CACHE_KEYS.ADMIN_CROPS);
  },
  orderCreated(buyerId: string, farmerId: string): void {
    invalidateCache(CACHE_KEYS.BUYER_ORDERS(buyerId));
    invalidateCache(CACHE_KEYS.FARMER_ORDERS(farmerId));
    invalidateCache(CACHE_KEYS.ADMIN_ORDERS);
    invalidateCache(CACHE_KEYS.FARMER_ANALYTICS(farmerId));
  },
  userChanged(userId: string): void {
    invalidateCache(CACHE_KEYS.USER_PROFILE(userId));
    invalidateCache(CACHE_KEYS.ADMIN_USERS);
  },
  adminAction(): void {
    invalidateCache(CACHE_KEYS.ADMIN_USERS);
    invalidateCache(CACHE_KEYS.ADMIN_CROPS);
    invalidateCache(CACHE_KEYS.ADMIN_ORDERS);
    invalidateCache(CACHE_KEYS.ADMIN_ANALYTICS);
  },
};
