import React from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import queryClient from '../../config/queryClient.js';

let ReactQueryDevtools = null;
if (import.meta.env.DEV) {
  ReactQueryDevtools = React.lazy(() =>
    import('@tanstack/react-query-devtools').then((d) => ({
      default: d.ReactQueryDevtools,
    }))
  );
}

export const QueryProvider = ({ children }) => {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      
      {}
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
