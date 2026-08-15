import { createClient } from 'redis';
import dotenv from 'dotenv';

dotenv.config();

const redisUrl = process.env.REDIS_URI || process.env.REDIS_URL;

let isInitialErrorLogged = false;

export const redisClient = createClient({
  url: redisUrl,
  socket: {
    connectTimeout: 5000,
    reconnectStrategy: (retries) => {
      if (retries > 2) {
        if (!isInitialErrorLogged) {
          console.log('[Redis] Remote cache unreachable. Operating with in-memory & direct DB queries.');
          isInitialErrorLogged = true;
        }
        return false;
      }
      return 1000;
    },
  },
});

redisClient.on('error', (err) => {
  if (!isInitialErrorLogged) {
    console.log(`[Redis] Notice: ${err?.message || 'Connection timeout'}. Running with in-memory / direct DB fallback.`);
    isInitialErrorLogged = true;
  }
});

redisClient.on('connect', () => {
  console.log('[Redis] Connected successfully');
  isInitialErrorLogged = false;
});

let connectPromise: Promise<void> | null = null;

if (redisUrl) {
  connectPromise = redisClient.connect().catch(() => {}) as Promise<void>;
}

export const connectRedis = async (): Promise<void> => {
  if (connectPromise) {
    try {
      await connectPromise;
    } catch {}
  }
};
