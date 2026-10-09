import type { Request, Response, NextFunction, RequestHandler } from 'express';
import { env } from '../config/env.js';

export const csrfProtection: RequestHandler = (req: Request, res: Response, next: NextFunction) => {
  // Safe HTTP methods do not change state
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // Webhooks have independent signature verification
  if (req.originalUrl?.includes('/webhook') || req.path?.includes('/webhook')) {
    return next();
  }

  const normalizedPath = (req.originalUrl || req.path || '').split('?')[0];
  const isCookieAuthRoute =
    normalizedPath.endsWith('/auth/refresh') ||
    normalizedPath.endsWith('/auth/refresh-token') ||
    normalizedPath.endsWith('/auth/logout');

  const hasCookieAuth = Boolean(
    req.cookies?.refreshToken ||
    (req.headers.cookie && req.headers.cookie.includes('refreshToken='))
  );

  // For cookie-authenticated routes (/auth/refresh, /auth/logout) and cookie-authenticated requests:
  // Require an exact-match Origin in env.corsOrigins (no startsWith, no x-requested-with shortcut)
  if (isCookieAuthRoute || hasCookieAuth) {
    const origin = req.headers.origin;
    if (!origin || typeof origin !== 'string' || !env.corsOrigins.includes(origin)) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Invalid or missing CSRF Origin',
      });
    }
    return next();
  }

  // Bearer tokens in Authorization header cannot be automatically forged cross-site
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return next();
  }

  return next();
};

export default csrfProtection;
