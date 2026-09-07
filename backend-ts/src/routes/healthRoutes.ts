import { Router, type Request, type Response } from 'express';
import mongoose from 'mongoose';
import { redisClient } from '../config/redis.js';

const router = Router();

/**
 * GET /health or /health/
 * Platform health/readiness check (used by Render, Kubernetes, Docker).
 * Returns 200 if MongoDB is connected and ready to serve requests.
 * Returns 503 if MongoDB is disconnected.
 */
router.get('/', async (_req: Request, res: Response): Promise<void> => {
  const isMongoConnected = mongoose.connection.readyState === 1;
  const isRedisReady = redisClient.isReady;

  if (!isMongoConnected) {
    res.status(503).json({
      status: 'unhealthy',
      db: 'disconnected',
      redis: isRedisReady ? 'connected' : 'fallback',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    });
    return;
  }

  res.status(200).json({
    status: 'ok',
    db: 'connected',
    redis: isRedisReady ? 'connected' : 'fallback',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

/**
 * GET /health/liveness
 * Process liveness probe. Checks that Node process is responsive.
 */
router.get('/liveness', (_req: Request, res: Response): void => {
  res.status(200).json({ status: 'OK', uptime: process.uptime() });
});

/**
 * GET /health/readiness
 * Readiness check with dependency statuses.
 * MongoDB is required for traffic; Redis runs in fallback mode if unavailable.
 */
router.get('/readiness', async (_req: Request, res: Response): Promise<void> => {
  try {
    const mongoStatus = mongoose.connection.readyState === 1;
    const redisStatus = redisClient.isReady;

    if (!mongoStatus) {
      res.status(503).json({
        status: 'UNAVAILABLE',
        dependencies: {
          mongo: 'DOWN',
          redis: redisStatus ? 'UP' : 'FALLBACK',
        },
      });
      return;
    }

    res.status(200).json({
      status: 'OK',
      dependencies: {
        mongo: 'UP',
        redis: redisStatus ? 'UP' : 'FALLBACK',
      },
    });
  } catch {
    res.status(500).json({ status: 'ERROR', message: 'Readiness check failed' });
  }
});

export default router;
