import RedisStore from 'rate-limit-redis';
import { redisClient } from './redis.js';

export const redisRateLimitStore = new RedisStore({
  sendCommand: (...args: string[]) => redisClient.sendCommand(args),
});
