import { Worker } from 'bullmq';
import { flagAnomalyAsync } from '../services/anomalyService.js';
import { connection, type AnomalyJobData } from './queue.js';
import logger from '../utils/logger.js';

export function startAnomalyWorker() {
  if (!connection) {
    return null;
  }

  const worker = new Worker<AnomalyJobData>('anomalyDetection', async (job) => {
    logger.info({ orderId: job.data.orderId }, `Processing anomaly detection for order ${job.data.orderId}`);
    await flagAnomalyAsync(job.data.orderId, job.data.amount, job.data.userId);
  }, {
    connection,
    stalledInterval: 300_000, // 5 min interval to reduce idle Redis command polling
    maxStalledCount: 1,
    drainDelay: 30, // Long poll for 30s when empty to reduce Redis command frequency
  });

  worker.on('completed', job => {
    logger.info({ jobId: job.id }, `Job ${job.id} has completed!`);
  });

  worker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, err: err.message }, `Job ${job?.id} has failed with ${err.message}`);
  });

  return worker;
}
