import { useEffect } from 'react';
import { useLoading } from '../context/LoadingContext';

/**
 * Hook to manage page loading state
 * Automatically starts loading when component mounts and provides methods to control it
 * 
 * @param {string} loadingMessage - Message to display while loading
 * @returns {Object} { startLoading, stopLoading } - Methods to control loading state
 * 
 * @example
 * function MyPage() {
 *   const { startLoading, stopLoading } = usePageLoading('Loading data...');
 *   
 *   useEffect(() => {
 *     // Fetch data
 *     fetchData().finally(() => stopLoading());
 *   }, []);
 * }
 */
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
