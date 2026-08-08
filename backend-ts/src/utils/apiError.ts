/**
 * A typed application error. Throwing `ApiError` lets the error-handler
 * middleware respond with a precise HTTP status code instead of always 500.
 */
export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly details?: unknown;
  public readonly code?: string;

  constructor(
    statusCode: number,
    message: string,
    options: { isOperational?: boolean; details?: unknown; code?: string } = {},
  ) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.isOperational = options.isOperational ?? true;
    this.details = options.details;
    this.code = options.code;
    Object.setPrototypeOf(this, ApiError.prototype);
    Error.captureStackTrace?.(this, this.constructor);
  }


  static badRequest(message = 'Bad Request', details?: unknown): ApiError {
    return new ApiError(400, message, { details, code: 'BAD_REQUEST' });
  }

  static unauthorized(message = 'Unauthorized'): ApiError {
    return new ApiError(401, message, { code: 'UNAUTHORIZED' });
  }

  static forbidden(message = 'Forbidden'): ApiError {
    return new ApiError(403, message, { code: 'FORBIDDEN' });
  }

  static notFound(message = 'Not Found'): ApiError {
    return new ApiError(404, message, { code: 'NOT_FOUND' });
  }

  static conflict(message = 'Conflict'): ApiError {
    return new ApiError(409, message, { code: 'CONFLICT' });
  }

  static unprocessableEntity(message = 'Unprocessable Entity', details?: unknown): ApiError {
    return new ApiError(422, message, { details, code: 'UNPROCESSABLE_ENTITY' });
  }

  static tooManyRequests(message = 'Too many requests, please try again later.'): ApiError {
    return new ApiError(429, message, { code: 'TOO_MANY_REQUESTS' });
  }


  static internal(message = 'Internal Server Error'): ApiError {
    return new ApiError(500, message, { isOperational: false, code: 'INTERNAL_ERROR' });
  }

  static serviceUnavailable(message = 'Service temporarily unavailable'): ApiError {
    return new ApiError(503, message, { isOperational: true, code: 'SERVICE_UNAVAILABLE' });
  }


  /**
   * Safely convert any unknown thrown value into an ApiError.
   * Use in catch blocks where you receive `unknown`.
   */
  static fromUnknown(error: unknown, fallbackMessage = 'An unexpected error occurred'): ApiError {
    if (error instanceof ApiError) return error;
    if (error instanceof Error) {
      return new ApiError(500, error.message || fallbackMessage, {
        isOperational: false,
        code: 'INTERNAL_ERROR',
      });
    }
    return new ApiError(500, fallbackMessage, { isOperational: false, code: 'INTERNAL_ERROR' });
  }

  /** Return true when the status code is in the 4xx range (client error). */
  get isClientError(): boolean {
    return this.statusCode >= 400 && this.statusCode < 500;
  }

  /** Return true when the status code is in the 5xx range (server error). */
  get isServerError(): boolean {
    return this.statusCode >= 500;
  }

  toJSON(): Record<string, unknown> {
    return {
      success: false,
      message: this.message,
      code: this.code,
      ...(this.details !== undefined ? { details: this.details } : {}),
    };
  }
}

export default ApiError;
