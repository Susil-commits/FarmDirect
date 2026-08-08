import { createClient } from 'redis';
import dotenv from 'dotenv';

dotenv.config();

const redisUrl = process.env.REDIS_URI || process.env.REDIS_URL;

export const redisClient = createClient({
  url: redisUrl
});

redisClient.on('error', (err) => {
  console.warn('Redis Client Error. Caching will be disabled and fallback to direct queries.', err);
});

redisClient.on('connect', () => {
  console.log('Connected to Redis');
});

export const connectRedis = async (): Promise<void> => {
  const redisUrl = process.env.REDIS_URI || process.env.REDIS_URL;
  if (redisUrl) {
    try {
      await redisClient.connect();
    } catch (error) {
      console.warn('Failed to connect to Redis, application will run without caching.', error);
    }
  } else {
    console.warn('REDIS_URI or REDIS_URL not provided. Running without caching layer.');
  }
};
