import {
  isTransientTransactionError,
  calculateBackoffWithJitter,
} from '../utils/transactionRetry.js';

describe('Transaction Retry, Deadlock Mitigation & Jitter Backoff', () => {
  it('correctly identifies MongoDB WriteConflict (code 112)', () => {
    const errorWithCode = { code: 112, message: 'WriteConflict error' };
    expect(isTransientTransactionError(errorWithCode)).toBe(true);

    const errorWithCodeName = { codeName: 'WriteConflict', message: 'Conflicting concurrent write' };
    expect(isTransientTransactionError(errorWithCodeName)).toBe(true);
  });

  it('correctly identifies TransientTransactionError label', () => {
    const errorWithLabel = {
      message: 'Transaction aborted due to network partition',
      hasErrorLabel: (label: string) => label === 'TransientTransactionError',
    };
    expect(isTransientTransactionError(errorWithLabel)).toBe(true);
  });

  it('rejects permanent or validation errors from retrying', () => {
    const validationError = new Error('ValidationError: Crop quantity cannot be negative');
    expect(isTransientTransactionError(validationError)).toBe(false);

    const castError = { name: 'CastError', message: 'Cast to ObjectId failed' };
    expect(isTransientTransactionError(castError)).toBe(false);
  });

  it('calculates exponential backoff with jitter within bounded range', () => {
    const initialDelay = 50;
    const maxDelay = 1000;
    const jitterFactor = 0.25;

    for (let attempt = 1; attempt <= 4; attempt++) {
      const delay = calculateBackoffWithJitter(attempt, initialDelay, maxDelay, jitterFactor);
      const baseExpected = Math.min(maxDelay, initialDelay * Math.pow(2, attempt));
      const minExpected = Math.round(baseExpected * (1.0 - jitterFactor));
      const maxExpected = Math.round(baseExpected * (1.0 + jitterFactor));

      expect(delay).toBeGreaterThanOrEqual(minExpected);
      expect(delay).toBeLessThanOrEqual(maxExpected);
    }
  });

  it('clamps delay to maxDelayMs even at high attempt counts', () => {
    const maxDelay = 500;
    const delay = calculateBackoffWithJitter(10, 50, maxDelay, 0.2);
    expect(delay).toBeLessThanOrEqual(maxDelay * 1.25);
  });
});
