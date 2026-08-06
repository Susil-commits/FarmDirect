import mongoose from 'mongoose';
import { env } from './env.js';

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 5000;

/** Connect to MongoDB with retry logic and connection pooling. */
export async function connectDB(retries = MAX_RETRIES): Promise<typeof mongoose> {
  try {
    mongoose.set('strictQuery', true);
    
    // Enterprise configuration for DB Resilience
    const conn = await mongoose.connect(env.mongoUri, {
      maxPoolSize: 50, // Maintain up to 50 socket connections
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    });
    
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
/** Gracefully close the Mongoose connection. */
export async function disconnectDB(): Promise<void> {
  try {
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error disconnecting MongoDB:', error);
  }
}

export default connectDB;
