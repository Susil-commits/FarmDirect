import mongoose from 'mongoose';
import { env } from './env.js';

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 5000;

export async function connectDB(retries = MAX_RETRIES): Promise<typeof mongoose> {
  try {
    mongoose.set('strictQuery', true);
    
    const conn = await mongoose.connect(env.mongoUri, {
      maxPoolSize: 50,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    await verifyTransactionSupport(conn);
    
    return conn;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`MongoDB connection error: ${message}`);
    
    if (retries > 0) {
      console.log(`Retrying MongoDB connection in ${RETRY_DELAY_MS / 1000}s... (${retries} retries left)`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
      return connectDB(retries - 1);
    } else {
      console.error('MongoDB connection failed after maximum retries. Exiting.');
      process.exit(1);
    }
  }
}

export async function disconnectDB(): Promise<void> {
  try {
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error disconnecting MongoDB:', error);
  }
}

async function verifyTransactionSupport(conn: typeof mongoose): Promise<void> {
  try {
    const session = await conn.startSession();
    try {
      await session.withTransaction(async () => {
        // Trivial no-op to verify replica set / ACID transaction support
      });
      console.log('MongoDB replica set and transaction support verified.');
    } finally {
      await session.endSession();
    }
  } catch (err: any) {
    const msg = `MongoDB deployment does not support transactions: ${err?.message || err}. A replica set or MongoDB Atlas is required for ACID transactions (orders, checkout).`;
    if (env.isProd) {
      console.error(`FATAL STARTUP ERROR: ${msg}`);
      throw new Error(msg);
    } else {
      console.warn(`[WARNING] ${msg} In development mode, transactions may fail if not connected to a replica set.`);
    }
  }
}

export default connectDB;
