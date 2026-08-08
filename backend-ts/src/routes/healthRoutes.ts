import { Router, type Request, type Response } from 'express';
import mongoose from 'mongoose';
import { redisClient } from '../config/redis.js';

const router = Router();

// Liveness probe: Is the node process running?
router.get('/liveness', (req: Request, res: Response) => {
  res.status(200).json({ status: 'OK', uptime: process.uptime() });
});

// Readiness probe: Are dependencies (Mongo, Redis) healthy?
router.get('/readiness', async (req: Request, res: Response) => {
  try {
    const mongoStatus = mongoose.connection.readyState === 1; // 1 = connected
    const redisStatus = redisClient.isReady;

    if (!mongoStatus || !redisStatus) {
      res.status(503).json({
        status: 'UNAVAILABLE',
        dependencies: {
          mongo: mongoStatus ? 'UP' : 'DOWN',
          redis: redisStatus ? 'UP' : 'DOWN',
        },
      });
      return;
    }

    res.status(200).json({
      status: 'OK',
      dependencies: {
        mongo: 'UP',
        redis: 'UP',
      },
    });
  } catch (error) {
    res.status(500).json({ status: 'ERROR', message: 'Readiness check failed' });
  }
});

export default router;
