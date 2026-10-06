import cluster from 'cluster';
import os from 'os';
import { createServer, type Server as HttpServer } from 'http';

import app from './app.js';
import { env } from './config/env.js';
import { connectDB, disconnectDB } from './config/db.js';
import { initSocket } from './socket/socketManager.js';
import { connectRedis, redisClient } from './config/redis.js';
import { startAnomalyWorker } from './workers/anomalyWorker.js';
import { startOutboxWorker, startOutboxPollingWorker, stopOutboxPollingWorker } from './workers/outboxWorker.js';
import { startPaymentReconciliationWorker, stopPaymentReconciliationWorker } from './workers/paymentReconciliationWorker.js';
import { startWeeklyDigestWorker, stopWeeklyDigestWorker } from './workers/weeklyDigestWorker.js';

const httpServer: HttpServer = createServer(app);

initSocket(httpServer, { origin: env.corsOrigins });

let workerInstance: any = null;
let outboxWorkerInstance: any = null;

function gracefulShutdown(signal: string): void {
  console.log(`Received ${signal}, shutting down gracefully...`);
  stopPaymentReconciliationWorker();
  stopOutboxPollingWorker();
  stopWeeklyDigestWorker();
  
  if (workerInstance) {
    workerInstance.close().then(() => {
      console.log('BullMQ worker closed');
    }).catch((err: any) => console.error('Error closing BullMQ worker', err));
  }

  if (outboxWorkerInstance) {
    outboxWorkerInstance.close().then(() => {
      console.log('BullMQ outbox worker closed');
    }).catch((err: any) => console.error('Error closing BullMQ outbox worker', err));
  }

  httpServer.close(async () => {
    if (redisClient.isReady) {
      await redisClient.disconnect();
    }
    await disconnectDB();
    process.exit(0);
  });

  setTimeout(() => {
    console.error('Forcing shutdown after timeout.');
    process.exit(1);
  }, 10000).unref();
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
});
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  gracefulShutdown('uncaughtException');
});

async function start(): Promise<void> {
  await connectRedis();
  await connectDB();
  
  workerInstance = startAnomalyWorker();
  outboxWorkerInstance = startOutboxWorker();

  // In clustered environments, only run background pollers on worker #1 (or standalone process)
  const isLeaderWorker = !cluster.isWorker || cluster.worker?.id === 1;
  if (isLeaderWorker) {
    startOutboxPollingWorker();
    startPaymentReconciliationWorker();
    startWeeklyDigestWorker();
  }
  
  const PORT = env.port;
  httpServer.listen(PORT, () => {
    console.log(`Worker ${process.pid} listening on port ${PORT}`);
  });
}

function selfPing(): void {
  // Only ping if RENDER_EXTERNAL_URL is configured and self-ping is enabled
  if (!process.env.RENDER_EXTERNAL_URL || process.env.ENABLE_SELF_PING === 'false') {
    return;
  }
  const pingUrl = `${process.env.RENDER_EXTERNAL_URL.replace(/\/$/, '')}/api/health`;

  fetch(pingUrl)
    .then(() => console.log('Self-ping successful (Keeping instance warm)'))
    .catch((err) => console.error('Self-ping failed:', err.message));
}

const numWorkers = Number(process.env.WEB_CONCURRENCY) || os.cpus().length;
if (numWorkers <= 1 || !cluster.isPrimary) {
  start().catch((err) => {
    console.error(`Worker ${process.pid} failed to start:`, err);
    process.exit(1);
  });
  if (numWorkers <= 1 && process.env.RENDER_EXTERNAL_URL && process.env.ENABLE_SELF_PING !== 'false') {
    setInterval(selfPing, 10 * 60_000); // keep Render instance warm
  }
} else {
  console.log(`Primary cluster setting up ${numWorkers} workers...`);

  for (let i = 0; i < numWorkers; i++) {
    cluster.fork();
  }

  cluster.on('online', (worker) => {
    console.log(`Worker ${worker.process.pid} is online`);
  });

  cluster.on('exit', (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died with code: ${code}, and signal: ${signal}`);
    console.log('Starting a new worker to replace it...');
    cluster.fork();
  });

  setInterval(selfPing, 10 * 60_000);
}
