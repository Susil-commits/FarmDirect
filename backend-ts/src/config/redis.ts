import { createClient } from 'redis';
import dotenv from 'dotenv';

dotenv.config();

export const redisClient = createClient({
  url: process.env.REDIS_URI
});

redisClient.on('error', (err) => {
  console.warn('Redis Client Error. Caching will be disabled and fallback to direct queries.', err);
});

redisClient.on('connect', () => {
  console.log('Connected to Redis');
});

export const connectRedis = async (): Promise<void> => {
  if (process.env.REDIS_URI) {
    try {
      await redisClient.connect();
    } catch (error) {
      console.warn('Failed to connect to Redis, application will run without caching.', error);
    }
  } else {
    console.warn('REDIS_URI not provided. Running without caching layer.');
  }
};
