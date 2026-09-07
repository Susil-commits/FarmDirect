import crypto from 'crypto';
import type { RequestHandler } from 'express';

import { createRequestLogger } from '../utils/logger.js';

export const requestId: RequestHandler = (req, res, next) => {
  const incoming = (req.headers['x-request-id'] as string | undefined)?.trim();
  const id = incoming || crypto.randomUUID();
  res.setHeader('X-Request-Id', id);
  req.requestId = id;
  req.log = createRequestLogger(id);
  next();
};

export default requestId;
