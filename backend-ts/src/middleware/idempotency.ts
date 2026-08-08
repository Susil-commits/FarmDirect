import { type Request, type Response, type NextFunction } from 'express';
import { createHash } from 'crypto';
import IdempotencyKey from '../models/IdempotencyKey.js';
import { sendError } from '../utils/apiResponse.js';

export const idempotency = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const key = req.headers['idempotency-key'] as string;
  if (!key) {
    sendError(res, 'Idempotency-Key header is required', 400);
    return;
  }

  const requestHash = createHash('sha256').update(JSON.stringify(req.body)).digest('hex');
  const now = new Date();
  
  try {
    const existingKey = await IdempotencyKey.findOneAndUpdate(
      { key },
      {
        $setOnInsert: {
          status: 'pending',
          requestHash,
          createdAt: now,
          expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000)
        }
      },
      { upsert: true, returnDocument: 'before' }
    );

    if (existingKey) {
      if (existingKey.requestHash !== requestHash) {
        sendError(res, 'Idempotency-Key used with different request body', 422);
        return;
      }

      if (existingKey.status === 'completed') {
        res.setHeader('X-Idempotent-Replay', 'true');
        res.status(existingKey.responseStatus || 200).json(existingKey.responseBody);
        return;
      }

      if (existingKey.status === 'pending') {
        // If it's been pending for more than 2 minutes, assume it died and take over
        if (now.getTime() - existingKey.createdAt.getTime() > 2 * 60 * 1000) {
           await IdempotencyKey.updateOne({ _id: existingKey._id }, { $set: { createdAt: now } });
           // Fall through to process request
        } else {
           sendError(res, 'Request is currently processing', 409);
           return;
        }
      }
    }

    // Intercept res.json to cache the response
    const originalJson = res.json.bind(res);
    res.json = (body: any) => {
      // Determine if it was a success based on status code
      const isSuccess = res.statusCode >= 200 && res.statusCode < 300;
      
      IdempotencyKey.updateOne(
        { key },
        {
          $set: {
            status: isSuccess ? 'completed' : 'failed',
            responseStatus: res.statusCode,
            responseBody: body,
            // If body has data._id, it might be the orderId. Let's try to grab it if it exists.
            orderId: isSuccess && body?.data?._id ? body.data._id : null
          }
        }
      ).catch(err => console.error('Error saving idempotency key', err));

      return originalJson(body);
    };

    next();
  } catch (error: any) {
    console.error('Idempotency error:', error);
    sendError(res, 'Internal server error processing idempotency', 500);
  }
};
