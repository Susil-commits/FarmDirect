import { useContext } from 'react';
import { RealtimeContext } from '../context/RealtimeContext';

export const useRealtime = () => {
  const ctx = useContext(RealtimeContext);
  if (!ctx) {
    throw new Error('useRealtime must be used within a RealtimeProvider');
  }
  return ctx;
};
