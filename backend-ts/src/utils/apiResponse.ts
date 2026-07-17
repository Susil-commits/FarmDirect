/**
 * Helper functions for sending consistent, typed JSON responses.
 */
import type { Response } from 'express';
import type { Pagination, ApiResponse } from '../types/index.js';

export function sendSuccess<T>(
  res: Response,
  payload: ApiResponse<T>,
  statusCode = 200,
): Response {
  return res.status(statusCode).json({
    success: true,
    ...payload,
  });
}

export function sendError(
  res: Response,
  message: string,
  statusCode = 400,
  extra: Record<string, unknown> = {},
): void {
  res.status(statusCode).json({
    success: false,
    message,
    ...extra,
  });
}

export function sendPaginated<T>(
  res: Response,
  data: T,
  pagination: Pagination,
  extra: Record<string, unknown> = {},
  statusCode = 200,
): Response {
  return res.status(statusCode).json({
    success: true,
    data,
    pagination,
    ...extra,
  });
}

export { Pagination };
