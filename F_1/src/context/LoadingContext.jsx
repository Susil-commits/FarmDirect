import { createContext, useState, useContext } from 'react';

const LoadingContext = createContext();

export function LoadingProvider({ children }) {
  const [isPageLoading, setIsPageLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Loading...');

  const startLoading = (message = 'Loading...') => {
    setLoadingMessage(message);
    setIsPageLoading(true);
  };

  const stopLoading = () => {
    setIsPageLoading(false);
  };

  return (
    <LoadingContext.Provider value={{ isPageLoading, loadingMessage, startLoading, stopLoading }}>
      {children}
    </LoadingContext.Provider>
  );
}

export function useLoading() {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoading must be used within LoadingProvider');
  }
  return context;
}
