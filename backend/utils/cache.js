// In-memory cache store (can be replaced with Redis)
const cacheStore = new Map();

/**
 * Generate cache key
 */
export const generateCacheKey = (prefix, ...args) => {
  return `${prefix}:${args.join(':')}`;
};

/**
 * Set cache value
 */
export const setCache = (key, value, ttlSeconds = 300) => {
  cacheStore.set(key, {
    value,
    expiresAt: Date.now() + ttlSeconds * 1000
  });
};

/**
 * Get cache value
 */
export const getCache = (key) => {
  const cached = cacheStore.get(key);
  if (!cached) return null;

  // Check if expired
  if (Date.now() > cached.expiresAt) {
    cacheStore.delete(key);
    return null;
  }

  return cached.value;
};

/**
 * Invalidate cache by key pattern
 */
export const invalidateCache = (pattern) => {
  for (const key of cacheStore.keys()) {
    if (key.includes(pattern)) {
      cacheStore.delete(key);
    }
  }
};

/**
 * Clear all cache
 */
export const clearAllCache = () => {
  cacheStore.clear();
};

/**
 * Cache keys for the application
 */
export const CACHE_KEYS = {
  FARMER_CROPS: (farmerId) => `farmer:crops:${farmerId}`,
  FARMER_ORDERS: (farmerId) => `farmer:orders:${farmerId}`,
  FARMER_ANALYTICS: (farmerId) => `farmer:analytics:${farmerId}`,
  BUYER_ORDERS: (buyerId) => `buyer:orders:${buyerId}`,
  ALL_CROPS: 'crops:all:approved',
  CROP_DETAIL: (cropId) => `crop:detail:${cropId}`,
  USER_PROFILE: (userId) => `user:profile:${userId}`,
  ADMIN_USERS: 'admin:users',
  ADMIN_CROPS: 'admin:crops',
  ADMIN_ORDERS: 'admin:orders',
  ADMIN_ANALYTICS: 'admin:analytics'
};

/**
 * Invalidation strategies for data mutations
 */
export const invalidationStrategies = {
  // When farmer creates/updates crop
  cropCreated: (farmerId) => {
    invalidateCache(CACHE_KEYS.FARMER_CROPS(farmerId));
    invalidateCache(CACHE_KEYS.ALL_CROPS);
    invalidateCache(CACHE_KEYS.ADMIN_CROPS);
  },

  // When admin approves crop
  cropApproved: (farmerId, cropId) => {
    invalidateCache(CACHE_KEYS.FARMER_CROPS(farmerId));
    invalidateCache(CACHE_KEYS.CROP_DETAIL(cropId));
    invalidateCache(CACHE_KEYS.ALL_CROPS);
    invalidateCache(CACHE_KEYS.ADMIN_CROPS);
  },

  // When buyer places order
  orderCreated: (buyerId, farmerId) => {
    invalidateCache(CACHE_KEYS.BUYER_ORDERS(buyerId));
    invalidateCache(CACHE_KEYS.FARMER_ORDERS(farmerId));
    invalidateCache(CACHE_KEYS.ADMIN_ORDERS);
    invalidateCache(CACHE_KEYS.FARMER_ANALYTICS(farmerId));
  },

  // When admin changes user
  userChanged: (userId) => {
    invalidateCache(CACHE_KEYS.USER_PROFILE(userId));
    invalidateCache(CACHE_KEYS.ADMIN_USERS);
  },

  // When anything admin-related changes
  adminAction: () => {
    invalidateCache(CACHE_KEYS.ADMIN_USERS);
    invalidateCache(CACHE_KEYS.ADMIN_CROPS);
    invalidateCache(CACHE_KEYS.ADMIN_ORDERS);
    invalidateCache(CACHE_KEYS.ADMIN_ANALYTICS);
  }
};
