import RedisStore from 'rate-limit-redis';
import { redisClient } from './redis.js';

export const createRateLimitStore = (prefix: string) => {
  if (!process.env.REDIS_URI) {
    return undefined;
  }
  return new RedisStore({
    sendCommand: (...args: string[]) => redisClient.sendCommand(args),
    prefix: prefix,
  });
};
