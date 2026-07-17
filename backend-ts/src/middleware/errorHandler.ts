import type { ErrorRequestHandler } from 'express';
import { env } from '../config/env.js';
import { ApiError } from '../utils/apiError.js';

interface MongooseValidationError extends Error {
  errors: Record<string, { message: string }>;
}

interface MongooseDuplicateKeyError extends Error {
  code: number;
  keyPattern: Record<string, unknown>;
}

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next): void => {
  console.error('Error:', err.message);

  // Typed ApiError
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(err.details ? { details: err.details } : {}),
    });
    return;
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const e = err as MongooseValidationError;
    const messages = Object.values(e.errors).map((error) => error.message);
    res.status(400).json({ success: false, message: 'Validation Error', errors: messages });
    return;
  }

  // Mongoose duplicate key error
  const dupErr = err as MongooseDuplicateKeyError;
  if (dupErr.code === 11000) {
    const field = Object.keys(dupErr.keyPattern)[0];
    res.status(400).json({ success: false, message: `${field} already exists` });
    return;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    res.status(401).json({ success: false, message: 'Invalid token' });
    return;
  }
  if (err.name === 'TokenExpiredError') {
    res.status(401).json({ success: false, message: 'Token expired' });
    return;
  }

  // Multer errors
  if (err.name === 'MulterError') {
    res.status(400).json({ success: false, message: err.message || 'File upload error' });
    return;
  }

  // Default error
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(env.isDev && { stack: err.stack }),
  });
};

export default errorHandler;
