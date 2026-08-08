import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import { flagAnomalyAsync } from '../services/anomalyService.js';
import type { AnomalyJobData } from './queue.js';

export function startAnomalyWorker() {
  if (!process.env.REDIS_URI) {
    return;
  }

  const connection = new IORedis(process.env.REDIS_URI, { maxRetriesPerRequest: null });

  const worker = new Worker<AnomalyJobData>('anomalyDetection', async (job) => {
    console.log(`Processing anomaly detection for order ${job.data.orderId}`);
    await flagAnomalyAsync(job.data.orderId, job.data.amount, job.data.userId);
  }, { connection });

  worker.on('completed', job => {
    console.log(`Job ${job.id} has completed!`);
  });

  worker.on('failed', (job, err) => {
    console.error(`Job ${job?.id} has failed with ${err.message}`);
  });

  return worker;
}
