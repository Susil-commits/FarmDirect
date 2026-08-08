import RedisStore from 'rate-limit-redis';
import { redisClient } from './redis.js';

export const createRateLimitStore = (prefix: string) => {
  const redisUrl = process.env.REDIS_URI || process.env.REDIS_URL;
  if (!redisUrl) {
    return undefined;
  }
  return new RedisStore({
    sendCommand: (...args: string[]) => redisClient.sendCommand(args),
    prefix: prefix,
  });
};
