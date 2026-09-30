import type { Request, Response } from 'express';
import EventLog from '../models/EventLog.js';
import { batchEventsSchema } from '../schemas/eventSchemas.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import logger from '../utils/logger.js';

const DISALLOWED_META_KEYS = new Set([
  'password', 'token', 'refreshToken', 'aadharNumber', 'governmentIdNumber',
  'phoneNumber', 'phone', 'email', 'cardNumber', 'cvv'
]);

function sanitizeMeta(meta?: Record<string, unknown>): Record<string, unknown> {
  if (!meta || typeof meta !== 'object') return {};
  const cleaned: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(meta)) {
    if (!DISALLOWED_META_KEYS.has(key)) {
      cleaned[key] = value;
    }
  }
  return cleaned;
}

export const logEvents = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const parseResult = batchEventsSchema.safeParse(req.body);
  if (!parseResult.success) {
    sendError(res, 'Invalid event payload', 400, { errors: parseResult.error.errors });
    return;
  }

  const { events } = parseResult.data;
  const authUserId = req.user?._id || null;

  const docsToInsert = events.map((event) => ({
    userId: authUserId,
    sessionId: event.sessionId,
    type: event.type,
    cropId: event.cropId || null,
    query: event.query || null,
    meta: sanitizeMeta(event.meta),
    at: event.at ? new Date(event.at) : new Date(),
  }));

  try {
    const inserted = await EventLog.insertMany(docsToInsert, { ordered: false });
    sendSuccess(res, { count: inserted.length, recorded: true }, 201);
  } catch (error: any) {
    logger.error({ err: error?.message || error }, 'Error inserting batched event logs');
    sendSuccess(res, { count: 0, recorded: false }, 200);
  }
});
