import { Queue } from 'bullmq';
import IORedis from 'ioredis';

const redisUrl = process.env.REDIS_URI || process.env.REDIS_URL;
// BullMQ requires IORedis specifically
export const connection = redisUrl ? new IORedis(redisUrl, { maxRetriesPerRequest: null }) : undefined;

if (!connection) {
  console.warn('REDIS_URI or REDIS_URL not provided. Background queues will be disabled.');
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
