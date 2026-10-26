import IORedis from 'ioredis';
import dotenv from 'dotenv';
import logger from '../utils/logger.js';

dotenv.config();

const redisUrl = process.env.REDIS_URI || process.env.REDIS_URL;

let isOutageLogged = false;

let rawClient: IORedis | null = null;

if (redisUrl && process.env.NODE_ENV !== 'test') {
  rawClient = new IORedis(redisUrl, {
    lazyConnect: true,
    connectTimeout: 10_000,
    maxRetriesPerRequest: null,
    // Full Jitter: spreads reconnect bursts over a randomized window to prevent thundering herds (#27, #28)
    retryStrategy: (times) => {
      const maxDelay = 15_000;
      const baseDelay = 500;
      const exponential = Math.min(baseDelay * 2 ** times, maxDelay);
      return Math.floor(exponential * (0.5 + Math.random() * 0.5));
    },
  });

  rawClient.on('error', (err) => {
    if (!isOutageLogged) {
      logger.warn({ err: err?.message || 'Connection error' }, '[Redis] Remote cache unreachable. Operating with in-memory & direct DB queries.');
      isOutageLogged = true;
    }
  });

  rawClient.on('connect', () => {
    logger.info('[Redis] Connected successfully');
    isOutageLogged = false;
  });

  rawClient.on('ready', () => {
    isOutageLogged = false;
  });
}

export const redisClient = {
  get isReady(): boolean {
    return rawClient !== null && rawClient.status === 'ready';
  },
  get isOpen(): boolean {
    return this.isReady;
  },
  get status(): string {
    return rawClient?.status || 'disconnected';
  },
  async get(key: string): Promise<string | null> {
    if (!this.isReady || !rawClient) return null;
    return rawClient.get(key);
  },
  async setEx(key: string, ttlSeconds: number, value: string): Promise<string | null> {
    if (!this.isReady || !rawClient) return null;
    return rawClient.set(key, value, 'EX', ttlSeconds);
  },
  async set(key: string, value: string, options?: { EX?: number } | any): Promise<string | null> {
    if (!this.isReady || !rawClient) return null;
    if (options && typeof options === 'object' && options.EX !== undefined) {
      return rawClient.set(key, value, 'EX', options.EX);
    }
    return rawClient.set(key, value);
  },
  async del(key: string | string[]): Promise<number> {
    if (!this.isReady || !rawClient) return 0;
    if (Array.isArray(key)) {
      if (key.length === 0) return 0;
      return rawClient.del(...key);
    }
    return rawClient.del(key);
  },
  async unlink(key: string | string[]): Promise<number> {
    if (!this.isReady || !rawClient) return 0;
    if (Array.isArray(key)) {
      if (key.length === 0) return 0;
      return rawClient.unlink(...key);
    }
    return rawClient.unlink(key);
  },
  async scan(cursor: string, ...args: (string | number)[]): Promise<[string, string[]]> {
    if (!this.isReady || !rawClient) return ['0', []];
    return rawClient.scan(cursor, ...(args as any)) as Promise<[string, string[]]>;
  },
  async keys(pattern: string): Promise<string[]> {
    if (!this.isReady || !rawClient) return [];
    return rawClient.keys(pattern);
  },
  async flushDb(): Promise<void> {
    if (!this.isReady || !rawClient) return;
    await rawClient.flushdb();
  },
  async disconnect(): Promise<void> {
    if (rawClient) {
      await rawClient.quit().catch(() => {});
    }
  },
  async quit(): Promise<void> {
    if (rawClient) {
      await rawClient.quit().catch(() => {});
    }
  },
  async sendCommand(args: string[]): Promise<any> {
    if (!this.isReady || !rawClient) throw new Error('Redis not ready');
    const [command, ...cmdArgs] = args;
    return rawClient.call(command, ...cmdArgs);
  },
  on(event: string, handler: (...args: any[]) => void): void {
    rawClient?.on(event, handler);
  },
  getRawClient(): IORedis | null {
    return rawClient;
  },
};

export const connectRedis = async (): Promise<void> => {
  if (!rawClient || process.env.NODE_ENV === 'test') return;
  try {
    await Promise.race([
      rawClient.connect().catch((err) => {
        logger.warn({ err: err?.message || err }, '[Redis] Initial connection failed');
      }),
      new Promise<void>((r) => setTimeout(r, 3000)),
    ]);
  } catch (err: any) {
    logger.warn({ err: err?.message || err }, '[Redis] Startup connect timed out or failed');
  }
};
