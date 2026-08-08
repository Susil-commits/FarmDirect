import type { Request, Response, NextFunction, RequestHandler } from 'express';
import mongoose from 'mongoose';
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
 *
 * Errors are returned as a structured `{ field: message }` map for easy
 * consumption by frontend form libraries.
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
      const fieldErrors: Record<string, string> = {};
      const issues = zodError.errors ?? zodError.issues ?? [];
      for (const issue of issues) {
        const field = issue.path.join('.') || '_root';
        if (!fieldErrors[field]) {
          fieldErrors[field] = issue.message;
        }
      }
      res.status(400).json({
        success: false,
        message: 'Validation Error',
        code: 'VALIDATION_ERROR',
        errors: fieldErrors,
      });
    }
  };
}

/**
 * Middleware that validates a route param (default: `id`) is a valid
 * MongoDB ObjectId. Returns 400 if the param is missing or malformed.
 *
 * Usage: `router.get('/:id', validateObjectId(), getById)`
 */
export function validateObjectId(paramName = 'id'): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    const value = req.params[paramName];
    if (!value) {
      res.status(400).json({
        success: false,
        message: `Missing required parameter: ${paramName}`,
        code: 'MISSING_PARAM',
      });
      return;
    }
    if (!mongoose.Types.ObjectId.isValid(value)) {
      res.status(400).json({
        success: false,
        message: `Invalid ${paramName}: must be a valid resource identifier`,
        code: 'INVALID_ID',
      });
      return;
    }
    next();
  };
}

export default validateRequest;
