import type { Request, Response, NextFunction, RequestHandler } from 'express';
import type { ZodSchema, ZodError } from 'zod';

interface ValidationSchemas {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}

/**
 * Validate `req.body`, `req.query`, and `req.params` against a set of Zod
 * schemas. The validated (and optionally transformed) data replaces the
 * raw request fields.
 */
export function validateRequest(schemas: ValidationSchemas): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (schemas.body) {
        req.body = await schemas.body.parseAsync(req.body);
      }
      if (schemas.query) {
        const parsed = await schemas.query.parseAsync(req.query);
        req.query = parsed as typeof req.query;
      }
      if (schemas.params) {
        const parsed = await schemas.params.parseAsync(req.params);
        req.params = parsed as typeof req.params;
      }
      next();
    } catch (error) {
      const zodError = error as ZodError;
      res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors: zodError.errors ?? zodError.issues,
      });
    }
  };
}

export default validateRequest;
