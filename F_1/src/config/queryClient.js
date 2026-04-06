import { QueryClient } from '@tanstack/react-query';

/**
 * React Query Configuration
 * Centralized setup for caching, retries, and other options
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // How long data is considered fresh (in ms)
      staleTime: 1000 * 60 * 5, // 5 minutes

      // How long to keep data in cache when unused (in ms)
      gcTime: 1000 * 60 * 10, // 10 minutes (formerly cacheTime)

      // Number of retry attempts on failure
      retry: 1,

      // Retry delay (exponential backoff)
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

      // Automatically refetch when window regains focus
      refetchOnWindowFocus: true,

      // Number of times to refetch when window gains focus
      refetchOnReconnect: true,

      // Don't refetch when component mounts if data exists
      refetchOnMount: false,

      // Throw error to nearest error boundary
      throwOnError: false,

      // Enable query suspension (for Suspense)
      suspense: false,
    },

    mutations: {
      // Retry mutations once on failure
      retry: 1,

      // Retry delay for mutations
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

      // Throw error for mutations
      throwOnError: false,
    },
  },

  // Custom logger for debug mode
  logger: {
    log: (...args) => console.log('[React Query]', ...args),
    warn: (...args) => console.warn('[React Query]', ...args),
    error: (...args) => console.error('[React Query]', ...args),
  },
});

export default queryClient;
