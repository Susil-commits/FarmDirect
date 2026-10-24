import mongoose, { type ClientSession } from 'mongoose';
import logger from './logger.js';

export interface RetryOptions {
  maxRetries?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  jitterFactor?: number; // e.g. 0.25 means +/- 25% jitter
}

/**
 * Checks whether an error is a transient write conflict or transaction error
 * that can be safely retried.
 */
export function isTransientTransactionError(err: any): boolean {
  if (!err) return false;

  // MongoDB error code 112 is WriteConflict
  if (err.code === 112 || err.codeName === 'WriteConflict') {
    return true;
  }

  // MongoDB error labels
  if (err.hasErrorLabel && typeof err.hasErrorLabel === 'function') {
    if (
      err.hasErrorLabel('TransientTransactionError') ||
      err.hasErrorLabel('UnknownTransactionCommitResult')
    ) {
      return true;
    }
  }

  // Message checks for fallback
  const message = String(err.message || err);
  return (
    message.includes('WriteConflict') ||
    message.includes('TransientTransactionError') ||
    message.includes('Transaction with provided number')
  );
}

/**
 * Calculates exponential backoff delay with randomized jitter.
 * Formula: delay = min(maxDelayMs, initialDelayMs * 2^attempt) * (1 - jitter + random * 2 * jitter)
 */
export function calculateBackoffWithJitter(
  attempt: number,
  initialDelayMs = 50,
  maxDelayMs = 2000,
  jitterFactor = 0.25,
): number {
  const baseDelay = Math.min(maxDelayMs, initialDelayMs * Math.pow(2, attempt));
  const minMultiplier = 1.0 - jitterFactor;
  const maxMultiplier = 1.0 + jitterFactor;
  const randomizedMultiplier = minMultiplier + Math.random() * (maxMultiplier - minMultiplier);
  return Math.round(baseDelay * randomizedMultiplier);
}

/**
 * Executes a transactional operation within a MongoDB ClientSession,
 * automatically retrying with exponential backoff and jitter upon WriteConflict
 * or TransientTransactionError.
 */
export async function withTransactionRetry<T>(
  txnFn: (session: ClientSession) => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const maxRetries = options.maxRetries ?? 3;
  const initialDelayMs = options.initialDelayMs ?? 50;
  const maxDelayMs = options.maxDelayMs ?? 1500;
  const jitterFactor = options.jitterFactor ?? 0.25;

  let attempt = 0;

  while (true) {
    const session = await mongoose.startSession();
    try {
      let result: T;
      await session.withTransaction(async () => {
        result = await txnFn(session);
      });
      return result!;
    } catch (err: any) {
      attempt++;

      if (attempt <= maxRetries && isTransientTransactionError(err)) {
        const delay = calculateBackoffWithJitter(attempt, initialDelayMs, maxDelayMs, jitterFactor);
        logger.warn(
          {
            attempt,
            maxRetries,
            delayMs: delay,
            err: err?.message || err,
          },
          'Transient transaction error / WriteConflict encountered. Retrying transaction with backoff.',
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }

      // Non-retryable error or exceeded maximum retries
      throw err;
    } finally {
      await session.endSession();
    }
  }
}
