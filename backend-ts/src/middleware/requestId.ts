import crypto from 'crypto';
import type { RequestHandler } from 'express';

/**
 * Generate a unique request-id for every inbound request and attach it to the
 * response header `X-Request-Id`. Enables correlating logs across services.
 */
export const requestId: RequestHandler = (req, res, next) => {
  const incoming = (req.headers['x-request-id'] as string | undefined)?.trim();
  const id = incoming || crypto.randomUUID();
  res.setHeader('X-Request-Id', id);
  (req as unknown as { requestId: string }).requestId = id;
  next();
};

export default requestId;
