import { Worker } from 'bullmq';
import { flagAnomalyAsync } from '../services/anomalyService.js';
import { connection, type AnomalyJobData } from './queue.js';

export function startAnomalyWorker() {
  if (!connection) {
    return null;
  }

  const worker = new Worker<AnomalyJobData>('anomalyDetection', async (job) => {
    console.log(`Processing anomaly detection for order ${job.data.orderId}`);
    await flagAnomalyAsync(job.data.orderId, job.data.amount, job.data.userId);
  }, {
    connection,
    stalledInterval: 300_000, // 5 min interval to reduce idle Redis command polling
    maxStalledCount: 1,
    drainDelay: 30, // Long poll for 30s when empty to reduce Redis command frequency
  });

  worker.on('completed', job => {
    console.log(`Job ${job.id} has completed!`);
  });

  worker.on('failed', (job, err) => {
    console.error(`Job ${job?.id} has failed with ${err.message}`);
  });

  return worker;
}
