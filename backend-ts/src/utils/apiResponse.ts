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

/** Shorthand for HTTP 201 Created with a standard success body. */
export function sendCreated<T>(res: Response, payload: ApiResponse<T>): Response {
  return res.status(201).json({
    success: true,
    ...payload,
  });
}

/** HTTP 204 No Content — no body. */
export function sendNoContent(res: Response): void {
  res.status(204).end();
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
