import type { Request, Response, NextFunction, RequestHandler } from 'express';

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

export const trimStrings: RequestHandler = (req: Request, _res: Response, next: NextFunction) => {
  if (req.body && typeof req.body === 'object') {
    req.body = trimObject(req.body);
  }
  next();
};

export const normalizeEmail: RequestHandler = (req: Request, _res: Response, next: NextFunction) => {
  if (req.body?.email && typeof req.body.email === 'string') {
    req.body.email = req.body.email.trim().toLowerCase();
  }
  next();
};

export function sanitizeField(...fields: string[]): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    for (const field of fields) {
      if (req.body?.[field] && typeof req.body[field] === 'string') {
        req.body[field] = req.body[field].replace(/<[^>]*>/g, '').trim();
      }
    }
    next();
  };
}
