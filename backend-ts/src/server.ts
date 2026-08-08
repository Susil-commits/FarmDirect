import cluster from 'cluster';
import os from 'os';
import { createServer, type Server as HttpServer } from 'http';

import app from './app.js';
import { env } from './config/env.js';
import { connectDB, disconnectDB } from './config/db.js';
import { initSocket } from './socket/socketManager.js';

// Create HTTP server for Socket.io
const httpServer: HttpServer = createServer(app);

// Initialize Socket.io
initSocket(httpServer, { origin: env.corsOrigins });

// ---- Graceful shutdown ----
function gracefulShutdown(signal: string): void {
  httpServer.close(async () => {
    await disconnectDB();
    process.exit(0);
  });

  // Force-close after 10 seconds
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

// B24 FIX: Wrap server startup in an async function
async function start(): Promise<void> {
  await connectDB();
  const PORT = env.port;
  httpServer.listen(PORT, () => {
    console.log(`Worker ${process.pid} listening on port ${PORT}`);
  });
}

// Cluster logic to spawn workers per CPU core for max throughput and reliability
if (cluster.isPrimary) {
  const numCPUs = os.cpus().length;
  console.log(`Primary cluster setting up ${numCPUs} workers...`);

  for (let i = 0; i < numCPUs; i++) {
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

  // Self-ping Cron to prevent PaaS instances (Render/Heroku) from sleeping
  setInterval(() => {
    fetch(`http://localhost:${env.port}/api/health`)
      .then(() => console.log('Self-ping successful (Keeping instance warm)'))
      .catch((err) => console.error('Self-ping failed:', err.message));
  }, 10 * 60 * 1000); // Every 10 mins

} else {
  start().catch((err) => {
    console.error(`Worker ${process.pid} failed to start:`, err);
    process.exit(1);
  });
}

