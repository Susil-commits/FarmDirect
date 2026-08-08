import { Queue } from 'bullmq';
import IORedis from 'ioredis';

// BullMQ requires IORedis specifically
export const connection = process.env.REDIS_URI ? new IORedis(process.env.REDIS_URI, { maxRetriesPerRequest: null }) : undefined;

if (!connection) {
  console.warn('REDIS_URI not provided. Background queues will be disabled.');
}

export const anomalyQueue = connection ? new Queue('anomalyDetection', { connection }) : null;

export interface AnomalyJobData {
  orderId: string;
  amount: number;
  userId: string;
}

export async function enqueueAnomalyDetection(data: AnomalyJobData) {
  if (anomalyQueue) {
    await anomalyQueue.add('detect-anomaly', data, {
      removeOnComplete: true,
      removeOnFail: 100 // keep last 100 failed jobs for debugging
    });
  } else {
    console.warn('Redis not ready, skipping anomaly queueing');
  }
}
