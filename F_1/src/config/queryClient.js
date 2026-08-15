import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      
      staleTime: 1000 * 60 * 5, 

      gcTime: 1000 * 60 * 10, 

      retry: 1,

      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

      refetchOnWindowFocus: true,

      refetchOnReconnect: true,

      refetchOnMount: false,

      throwOnError: false,

      suspense: false,
    },

    mutations: {
      
      retry: 1,

      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

      throwOnError: false,
    },
  },

  logger: {
    log: (...args) => console.log('[React Query]', ...args),
    warn: (...args) => console.warn('[React Query]', ...args),
    error: (...args) => console.error('[React Query]', ...args),
  },
});

export default queryClient;
