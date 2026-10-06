import { createClient } from 'redis';
import dotenv from 'dotenv';

dotenv.config();

const redisUrl = process.env.REDIS_URI || process.env.REDIS_URL;

let isOutageLogged = false;

export const redisClient = createClient({
  url: redisUrl,
  pingInterval: 300_000, // 5 min interval to keep alive while conserving 500k monthly command limit
  socket: {
    connectTimeout: 10_000,
    reconnectStrategy: (retries) => Math.min(500 * 2 ** retries, 15_000), // retry forever
  },
});

redisClient.on('error', (err) => {
  if (!isOutageLogged) {
    console.warn(`[Redis] Remote cache unreachable: ${err?.message || 'Connection error'}. Operating with in-memory & direct DB queries.`);
    isOutageLogged = true;
  }
});

redisClient.on('connect', () => {
  console.log('[Redis] Connected successfully');
  isOutageLogged = false;
});

redisClient.on('ready', () => {
  isOutageLogged = false;
});

let connectPromise: Promise<void> | null = null;

if (redisUrl && process.env.NODE_ENV !== 'test') {
  connectPromise = redisClient.connect().catch((err) => {
    console.warn('[Redis] Initial connection failed:', err?.message || err);
  }) as Promise<void>;
}

export const connectRedis = async (): Promise<void> => {
  if (!connectPromise) return;
  // never block startup for more than 3s
  await Promise.race([connectPromise, new Promise<void>((r) => setTimeout(r, 3000))]);
};
