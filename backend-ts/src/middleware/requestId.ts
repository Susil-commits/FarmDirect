import crypto from 'crypto';
import type { RequestHandler } from 'express';

export const requestId: RequestHandler = (req, res, next) => {
  const incoming = (req.headers['x-request-id'] as string | undefined)?.trim();
  const id = incoming || crypto.randomUUID();
  res.setHeader('X-Request-Id', id);
  (req as unknown as { requestId: string }).requestId = id;
  next();
};

export default requestId;
