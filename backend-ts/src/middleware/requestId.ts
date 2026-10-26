import crypto from 'crypto';
import type { RequestHandler } from 'express';

import { createRequestLogger } from '../utils/logger.js';

export const requestId: RequestHandler = (req, res, next) => {
  // Support W3C Trace Context (traceparent), X-Correlation-Id, or X-Request-Id (#50 Distributed Tracing)
  const incomingTraceParent = (req.headers['traceparent'] as string | undefined)?.trim();
  const incomingCorrelation = (req.headers['x-correlation-id'] as string | undefined)?.trim();
  const incomingRequestId = (req.headers['x-request-id'] as string | undefined)?.trim();

  let traceId = '';
  if (incomingTraceParent && /^00-[0-9a-f]{32}-[0-9a-f]{16}-[0-9a-f]{2}$/i.test(incomingTraceParent)) {
    traceId = incomingTraceParent.split('-')[1];
  }

  const id = incomingRequestId || incomingCorrelation || traceId || crypto.randomUUID();
  const correlationId = incomingCorrelation || traceId || id;

  res.setHeader('X-Request-Id', id);
  res.setHeader('X-Correlation-Id', correlationId);
  if (incomingTraceParent) {
    res.setHeader('traceparent', incomingTraceParent);
  }

  req.requestId = id;
  req.log = createRequestLogger(id);
  next();
};

export default requestId;
