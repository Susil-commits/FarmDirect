import { type Request, type Response, type NextFunction } from 'express';
import { redisClient } from '../config/redis.js';

export const cacheRoute = (ttlSeconds: number) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    
    if (req.method !== 'GET') {
      return next();
    }

    if (!redisClient.isReady) {
      return next();
    }

    const key = `route-cache:${req.originalUrl || req.url}`;

    try {
      const cachedResponse = await redisClient.get(key);
      if (cachedResponse) {
        res.setHeader('X-Cache', 'HIT');
        res.setHeader('Content-Type', 'application/json');
        res.send(cachedResponse);
        return;
      }

      res.setHeader('X-Cache', 'MISS');

      const originalJson = res.json.bind(res);
      const originalSend = res.send.bind(res);

      let responseSent = false;

      res.json = (body: any) => {
        if (!responseSent && res.statusCode >= 200 && res.statusCode < 300) {
          redisClient.setEx(key, ttlSeconds, JSON.stringify(body)).catch((err) => {
            console.error('Redis Route Cache Set Error:', err);
          });
        }
        responseSent = true;
        return originalJson(body);
      };

      res.send = (body: any) => {
        if (!responseSent && res.statusCode >= 200 && res.statusCode < 300) {
          
          const stringBody = typeof body === 'object' ? JSON.stringify(body) : body;
          redisClient.setEx(key, ttlSeconds, stringBody).catch((err) => {
            console.error('Redis Route Cache Set Error:', err);
          });
        }
        responseSent = true;
        return originalSend(body);
      };

      next();
    } catch (err) {
      console.error('Redis Route Cache Error:', err);
      next();
    }
  };
};
