import type { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * Recursively trim all string values in an object, in place.
 */
function trimObject(obj: unknown): unknown {
  if (typeof obj === 'string') return obj.trim();
  if (Array.isArray(obj)) return obj.map(trimObject);
  if (obj !== null && typeof obj === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      result[key] = trimObject(value);
    }
    return result;
  }
  return obj;
}

/**
 * Middleware that trims leading/trailing whitespace from all string fields
 * in `req.body`. Apply globally or per-route.
 */
export const trimStrings: RequestHandler = (req: Request, _res: Response, next: NextFunction) => {
  if (req.body && typeof req.body === 'object') {
    req.body = trimObject(req.body);
  }
  next();
};

/**
 * Middleware that lowercases the `email` field in `req.body` if it exists.
 * Should be applied after body parsing and before validation.
 */
export const normalizeEmail: RequestHandler = (req: Request, _res: Response, next: NextFunction) => {
  if (req.body?.email && typeof req.body.email === 'string') {
    req.body.email = req.body.email.trim().toLowerCase();
  }
  next();
};

/**
 * Middleware that strips any HTML tags from a string field.
 * Used for user-supplied content fields like `message` and `bio`.
 */
export function sanitizeField(...fields: string[]): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    for (const field of fields) {
      if (req.body?.[field] && typeof req.body[field] === 'string') {
        // Strip HTML tags — simple regex is sufficient for backend sanitization
        req.body[field] = req.body[field].replace(/<[^>]*>/g, '').trim();
      }
    }
    next();
  };
}
