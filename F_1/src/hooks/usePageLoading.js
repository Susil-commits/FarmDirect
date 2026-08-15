import { useEffect } from 'react';
import { useLoading } from './/useLoading';

export function usePageLoading(loadingMessage = 'Loading...') {
  const { startLoading, stopLoading } = useLoading();

  useEffect(() => {
    startLoading(loadingMessage);
    
    return () => {
      stopLoading();
    };
       
  }, [loadingMessage]);

  return { startLoading, stopLoading };
}
