import CircuitBreaker from 'opossum';

export const createCircuitBreaker = <TArgs extends any[], TResult>(
  action: (...args: TArgs) => Promise<TResult>,
  options?: CircuitBreaker.Options
) => {
  const breaker = new CircuitBreaker(action, {
    timeout: 3000, 
    errorThresholdPercentage: 50, 
    resetTimeout: 30000, 
    ...options,
  });

  breaker.fallback((...args: any[]) => {
    
    return Promise.reject(new Error('Service currently unavailable due to high failure rate (Circuit Open)'));
  });

  return breaker;
};
