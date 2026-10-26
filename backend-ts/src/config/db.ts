import mongoose from 'mongoose';
import { env } from './env.js';
import logger from '../utils/logger.js';

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 5000;

export async function connectDB(retries = MAX_RETRIES): Promise<typeof mongoose> {
  try {
    mongoose.set('strictQuery', true);
    
    // High-performance connection pooling (#8)
    const conn = await mongoose.connect(env.mongoUri, {
      maxPoolSize: 50,
      minPoolSize: 10,
      maxIdleTimeMS: 30000,
      waitQueueTimeoutMS: 5000,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    await verifyTransactionSupport(conn);
    
    return conn;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error({ err: message }, `MongoDB connection error: ${message}`);
    
    if (retries > 0) {
      // Exponential backoff + full jitter (#27, #28)
      const attempt = MAX_RETRIES - retries + 1;
      const exponentialDelay = Math.min(1000 * 2 ** attempt, 15000);
      const jitteredDelay = Math.floor(exponentialDelay * (0.5 + Math.random() * 0.5));
      logger.info({ retryInMs: jitteredDelay, retriesLeft: retries }, `Retrying MongoDB connection in ${(jitteredDelay / 1000).toFixed(1)}s... (${retries} retries left)`);
      await new Promise(resolve => setTimeout(resolve, jitteredDelay));
      return connectDB(retries - 1);
    } else {
      logger.error('MongoDB connection failed after maximum retries. Exiting.');
      process.exit(1);
    }
  }
}

export async function disconnectDB(): Promise<void> {
  try {
    await mongoose.disconnect();
  } catch (error) {
    logger.error({ err: error instanceof Error ? error.message : error }, 'Error disconnecting MongoDB');
  }
}

async function verifyTransactionSupport(conn: typeof mongoose): Promise<void> {
  try {
    const session = await conn.startSession();
    try {
      await session.withTransaction(async () => {
        // Trivial no-op to verify replica set / ACID transaction support
      });
      logger.info('MongoDB replica set and transaction support verified.');
    } finally {
      await session.endSession();
    }
  } catch (err: any) {
    const msg = `MongoDB deployment does not support transactions: ${err?.message || err}. A replica set or MongoDB Atlas is required for ACID transactions (orders, checkout).`;
    if (env.isProd) {
      logger.error(`FATAL STARTUP ERROR: ${msg}`);
      throw new Error(msg);
    } else {
      logger.warn(`[WARNING] ${msg} In development mode, transactions may fail if not connected to a replica set.`);
    }
  }
}

export default connectDB;
