import type { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * Wraps an async route handler so rejected promises are forwarded to the
 * Express error-handling middleware instead of crashing the process.
 *
 * The handler is typed to return `Promise<unknown>` so that handlers which
 * early-exit with `return res.json(...)` (returning a Response) remain
 * compatible while still catching unhandled rejections.
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

export default asyncHandler;
