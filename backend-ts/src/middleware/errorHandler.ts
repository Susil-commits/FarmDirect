import type { ErrorRequestHandler } from 'express';
import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { ApiError } from '../utils/apiError.js';

interface MongooseValidationError extends Error {
  errors: Record<string, { message: string }>;
}

interface MongooseDuplicateKeyError extends Error {
  code: number;
  keyPattern: Record<string, unknown>;
}

export const errorHandler: ErrorRequestHandler = (err, req, res, _next): void => {
  if (err instanceof ApiError) {
    if (!err.isOperational) {
      console.error(`[${req.headers['x-request-id'] ?? 'no-id'}] Non-operational ApiError:`, err);
    }
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      code: err.code,
      ...(err.details !== undefined ? { details: err.details } : {}),
      ...(env.isDev && { stack: err.stack }),
    });
    return;
  }

  if (err instanceof mongoose.Error.CastError) {
    res.status(400).json({ success: false, message: `Invalid value for field: ${err.path}`, code: 'INVALID_ID' });
    return;
  }

  if (err instanceof mongoose.Error.ValidationError) {
    const e = err as MongooseValidationError;
    const messages = Object.values(e.errors).map((error) => error.message);
    res.status(400).json({ success: false, message: 'Validation Error', errors: messages, code: 'VALIDATION_ERROR' });
    return;
  }

  const dupErr = err as MongooseDuplicateKeyError;
  if (dupErr.code === 11000) {
    const field = Object.keys(dupErr.keyPattern ?? {})[0] ?? 'field';
    res.status(409).json({ success: false, message: `${field} already exists`, code: 'DUPLICATE_KEY' });
    return;
  }

  if (err instanceof SyntaxError && 'body' in err) {
    res.status(400).json({ success: false, message: 'Malformed JSON in request body', code: 'INVALID_JSON' });
    return;
  }

  if (err.name === 'JsonWebTokenError') {
    res.status(401).json({ success: false, message: 'Invalid token', code: 'INVALID_TOKEN' });
    return;
  }
  if (err.name === 'TokenExpiredError') {
    res.status(401).json({ success: false, message: 'Token expired', code: 'TOKEN_EXPIRED' });
    return;
  }
  if (err.name === 'NotBeforeError') {
    res.status(401).json({ success: false, message: 'Token not yet active', code: 'TOKEN_NOT_ACTIVE' });
    return;
  }

  if (err.name === 'MulterError') {
    const message = err.code === 'LIMIT_FILE_SIZE'
      ? 'File is too large. Please upload a smaller file.'
      : err.code === 'LIMIT_FILE_COUNT'
        ? 'Too many files uploaded at once.'
        : err.message || 'File upload error';
    res.status(400).json({ success: false, message, code: 'FILE_UPLOAD_ERROR' });
    return;
  }

  if (err.message?.includes('Not allowed by CORS')) {
    res.status(403).json({ success: false, message: 'Cross-origin request blocked', code: 'CORS_ERROR' });
    return;
  }

  const reqId = req.headers['x-request-id'] ?? 'no-id';
  console.error(`[${reqId}] Unhandled Error: ${err.message ?? err}`);
  if (err.stack) {
    console.error(err.stack);
  }

  const statusCode = typeof err.status === 'number' ? err.status :
    typeof err.statusCode === 'number' ? err.statusCode : 500;

  res.status(statusCode).json({
    success: false,
    message: env.isProd && statusCode >= 500 ? 'An internal error occurred. Please try again.' : (err.message || 'Internal Server Error'),
    code: 'INTERNAL_ERROR',
    ...(env.isDev && { stack: err.stack }),
  });
};

export default errorHandler;
