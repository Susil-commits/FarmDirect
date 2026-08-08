import CircuitBreaker from 'opossum';

export const createCircuitBreaker = <TArgs extends any[], TResult>(
  action: (...args: TArgs) => Promise<TResult>,
  options?: CircuitBreaker.Options
) => {
  const breaker = new CircuitBreaker(action, {
    timeout: 3000, // If function takes longer than 3 seconds, trigger a failure
    errorThresholdPercentage: 50, // When 50% of requests fail, trip the breaker
    resetTimeout: 30000, // After 30 seconds, try again
    ...options,
  });

  breaker.fallback((...args: any[]) => {
    // If action fails or circuit is open, we can optionally handle it here.
    // However, usually we just want it to throw a fast error if the circuit is open.
    return Promise.reject(new Error('Service currently unavailable due to high failure rate (Circuit Open)'));
  });

  return breaker;
};
