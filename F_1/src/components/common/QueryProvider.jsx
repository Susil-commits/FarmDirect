import React from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import queryClient from '../../config/queryClient.js';

// Conditionally import devtools only in development
let ReactQueryDevtools = null;
if (process.env.NODE_ENV === 'development') {
  ReactQueryDevtools = React.lazy(() =>
    import('@tanstack/react-query-devtools').then((d) => ({
      default: d.ReactQueryDevtools,
    }))
  );
}

/**
 * QueryProvider Component
 * Wraps the entire app with React Query functionality
 * Includes optional devtools for debugging in development mode
 */
export const QueryProvider = ({ children }) => {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      
      {/* React Query Devtools for debugging cache - development only */}
      {ReactQueryDevtools && (
        <React.Suspense fallback={null}>
          <ReactQueryDevtools 
            initialIsOpen={false}
            buttonPosition="bottom-right"
          />
        </React.Suspense>
      )}
    </QueryClientProvider>
  );
};

export default QueryProvider;
