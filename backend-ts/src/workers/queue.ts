import { Queue } from 'bullmq';
import IORedis from 'ioredis';

const redisUrl = process.env.REDIS_URI || process.env.REDIS_URL;

export const connection = (redisUrl && process.env.NODE_ENV !== 'test')
  ? new IORedis(redisUrl, {
      maxRetriesPerRequest: null,
      retryStrategy: (times) => {
        const maxDelay = 15_000;
        const baseDelay = 500;
        const exponential = Math.min(baseDelay * 2 ** times, maxDelay);
        return Math.floor(exponential * (0.5 + Math.random() * 0.5));
      },
    })
  : undefined;

if (connection) {
  connection.on('error', () => {});
}

if (!connection && process.env.NODE_ENV !== 'test') {
  console.warn('REDIS_URI or REDIS_URL not provided. Background queues will be disabled.');
}

export const anomalyQueue = connection
  ? new Queue('anomalyDetection', {
      connection,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
        removeOnComplete: true,
        removeOnFail: 100,
      },
    })
  : null;
if (anomalyQueue) {
  anomalyQueue.on('error', () => {});
}

export interface AnomalyJobData {
  orderId: string;
  amount: number;
  userId: string;
}

export async function enqueueAnomalyDetection(data: AnomalyJobData) {
  if (anomalyQueue && process.env.NODE_ENV !== 'test') {
    await anomalyQueue.add('detect-anomaly', data, {
      removeOnComplete: true,
      removeOnFail: 100 
    });
  } else {
    // Direct in-process fallback for tests and environments without Redis
    try {
      const { flagAnomalyAsync } = await import('../services/anomalyService.js');
      await flagAnomalyAsync(data.orderId, data.amount, data.userId);
    } catch (err) {
      console.error('Direct anomaly detection fallback failed:', err);
    }
  }
}
