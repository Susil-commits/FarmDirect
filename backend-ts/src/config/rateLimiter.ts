import type { Store, Options, IncrementResponse } from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { redisClient } from './redis.js';

export const createRateLimitStore = (prefix: string): Store | undefined => {
  const redisUrl = process.env.REDIS_URI || process.env.REDIS_URL;
  if (!redisUrl) {
    return undefined;
  }

  let redisStoreInstance: any = null;
  try {
    redisStoreInstance = new RedisStore({
      sendCommand: (...args: string[]) => {
        if (!redisClient.isReady) {
          if (args[0]?.toUpperCase() === 'SCRIPT') return Promise.resolve('fallback_sha');
          return Promise.reject(new Error('Redis not ready'));
        }
        return redisClient.sendCommand(args);
      },
      prefix,
    });
  } catch {
    return undefined;
  }

  const memoryMap = new Map<string, { totalHits: number; resetTime: Date }>();

  const resilientStore: Store = {
    init(options: Options) {
      if (redisStoreInstance?.init) {
        try {
          const res = redisStoreInstance.init(options);
          if (res && typeof res.catch === 'function') {
            res.catch(() => {});
          }
        } catch {}
      }
    },
    async increment(key: string): Promise<IncrementResponse> {
      if (redisClient.isReady && redisStoreInstance) {
        try {
          return await redisStoreInstance.increment(key);
        } catch {}
      }

      const now = Date.now();
      const existing = memoryMap.get(key);
      if (!existing || existing.resetTime.getTime() <= now) {
        const resetTime = new Date(now + 60000);
        memoryMap.set(key, { totalHits: 1, resetTime });
        return { totalHits: 1, resetTime };
      }

      existing.totalHits += 1;
      return { totalHits: existing.totalHits, resetTime: existing.resetTime };
    },
    async decrement(key: string): Promise<void> {
      if (redisClient.isReady && redisStoreInstance?.decrement) {
        try {
          await redisStoreInstance.decrement(key);
          return;
        } catch {}
      }
      const existing = memoryMap.get(key);
      if (existing && existing.totalHits > 0) {
        existing.totalHits -= 1;
      }
    },
    async resetKey(key: string): Promise<void> {
      if (redisClient.isReady && redisStoreInstance?.resetKey) {
        try {
          await redisStoreInstance.resetKey(key);
          return;
        } catch {}
      }
      memoryMap.delete(key);
    },
  };

  return resilientStore;
};
