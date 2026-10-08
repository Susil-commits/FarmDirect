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

let isLeader = false;

function startPollers(): void {
  if (isLeader) return;
  isLeader = true;
  console.log(`[Worker ${process.pid}] Promoted to background poller leader.`);
  startOutboxPollingWorker();
  startPaymentReconciliationWorker();
  startWeeklyDigestWorker();
}

async function start(): Promise<void> {
  await connectRedis();
  await connectDB();
  
  workerInstance = startAnomalyWorker();
  outboxWorkerInstance = startOutboxWorker();

  // If running single-process (standard container deployment) or explicitly enabled
  const isCluster = cluster.isWorker;
  if (!isCluster || process.env.ENABLE_BACKGROUND_WORKERS === 'true') {
    startPollers();
  }

  process.on('message', (msg: any) => {
    if (msg?.type === 'PROMOTE_LEADER') {
      startPollers();
    }
  });
  
  const PORT = env.port;
  httpServer.listen(PORT, () => {
    console.log(`Server process ${process.pid} listening on port ${PORT}`);
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
    .catch((err) => console.error('Self-ping failed:', (err as Error).message));
}

// Default to single-process per container (standard in Docker/K8s). Enable cluster with CLUSTER_MODE=true
const enableCluster = process.env.CLUSTER_MODE === 'true';
const numWorkers = Number(process.env.WEB_CONCURRENCY) || os.cpus().length;

if (!enableCluster || numWorkers <= 1) {
  start().catch((err) => {
    console.error(`Process ${process.pid} failed to start:`, err);
    process.exit(1);
  });
  if (process.env.RENDER_EXTERNAL_URL && process.env.ENABLE_SELF_PING !== 'false') {
    setInterval(selfPing, 10 * 60_000);
  }
} else if (cluster.isPrimary) {
  console.log(`Primary cluster setting up ${numWorkers} workers...`);

  let assignedLeaderPid: number | null = null;

  function electLeader(): void {
    const workers = Object.values(cluster.workers || {}).filter(Boolean);
    if (workers.length > 0 && workers[0]) {
      const leader = workers[0];
      assignedLeaderPid = leader.process.pid ?? null;
      leader.send({ type: 'PROMOTE_LEADER' });
      console.log(`[Primary] Assigned worker ${leader.process.pid} as leader for background pollers.`);
    }
  }

  for (let i = 0; i < numWorkers; i++) {
    cluster.fork();
  }

  cluster.on('online', (worker) => {
    console.log(`Worker ${worker.process.pid} is online`);
    if (assignedLeaderPid === null) {
      electLeader();
    }
  });

  cluster.on('exit', (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died (code: ${code}, signal: ${signal}). Replacing...`);
    const wasLeader = worker.process.pid === assignedLeaderPid;
    if (wasLeader) {
      assignedLeaderPid = null;
    }
    const newWorker = cluster.fork();
    if (wasLeader) {
      // Re-elect leader immediately among surviving workers or new worker
      electLeader();
    }
  });

  setInterval(selfPing, 10 * 60_000);
} else {
  start().catch((err) => {
    console.error(`Worker ${process.pid} failed to start:`, err);
    process.exit(1);
  });
}
