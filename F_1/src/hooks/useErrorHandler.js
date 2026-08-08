import { useCallback } from 'react';
import { useToast } from './useToast';

/**
 * Centralized error handler hook.
 *
 * Maps any backend/network error to a user-facing toast message.
 * All components should use this instead of individual try/catch → console.error patterns.
 *
 * @example
 * const { handleError, formatApiError } = useErrorHandler();
 * try { ... } catch (err) { handleError(err, 'Loading crops'); }
 */
export function useErrorHandler() {
  const toast = useToast();

  /**
   * Format an API error into a user-friendly string.
   * Works with: axios error objects, backend JSON error shapes, raw Error, strings.
   */
  const formatApiError = useCallback((error, context = '') => {
    if (!error) return 'An unexpected error occurred';

    const message = error?.message || error?.data?.message || error?.response?.data?.message;
    const statusCode = error?.status || error?.statusCode || error?.response?.status;

    if (statusCode === 401) return 'Your session has expired. Please log in again.';
    if (statusCode === 403) {
      const code = error?.code || error?.data?.code;
      if (code === 'KYC_REQUIRED') return 'KYC verification required. Please complete your verification first.';
      if (code === 'ACCOUNT_SUSPENDED') return error?.data?.details?.suspensionReason ? `Account suspended: ${error.data.details.suspensionReason}` : 'Your account has been suspended.';
      return 'You do not have permission to perform this action.';
    }
    if (statusCode === 404) return context ? `${context}: not found.` : 'The requested resource was not found.';
    if (statusCode === 409) return message || 'This record already exists. Please check for duplicates.';
    if (statusCode === 422) return message || 'The data provided is invalid. Please check your inputs.';
    if (statusCode === 429) return 'Too many requests. Please wait a moment and try again.';
    if (statusCode >= 500) return 'A server error occurred. Our team has been notified. Please try again later.';

    if (!error.response && (error.code === 'ECONNREFUSED' || message?.includes('Network Error') || message?.includes('Failed to fetch'))) {
      return 'Unable to connect to the server. Please check your internet connection.';
    }
    if (message?.includes('timeout') || message?.includes('ETIMEDOUT')) {
      return 'The request timed out. Please try again.';
    }
    if (message?.includes('Refresh cooldown')) {
      return null;
    }

    return message || 'An unexpected error occurred. Please try again.';
  }, []);

  /**
   * Handle an error: format it and show the appropriate toast.
   * Returns the formatted message string for inline use.
   */
  const handleError = useCallback((error, context = '') => {
    if (error?.message === 'Refresh cooldown active') return null;

    const statusCode = error?.status || error?.statusCode || error?.response?.status;

    if ((statusCode === 400 || statusCode === 422) && error?.errors && typeof error.errors === 'object') {
      const fieldErrors = Object.values(error.errors).filter(Boolean);
      if (fieldErrors.length > 0) {
        const messages = fieldErrors.slice(0, 3).join(' • ');
        toast?.error?.(messages);
        return messages;
      }
    }

    const message = formatApiError(error, context);
    if (!message) return null;

    if (statusCode === 401) {
      toast?.warning?.(message);
    } else if (statusCode === 429) {
      toast?.warning?.(message);
    } else {
      toast?.error?.(message);
    }

    return message;
  }, [toast, formatApiError]);

  /**
   * Handle a network offline error specifically.
   */
  const handleNetworkError = useCallback(() => {
    toast?.error?.('You appear to be offline. Please check your connection and try again.');
  }, [toast]);

  return { handleError, formatApiError, handleNetworkError };
}

export default useErrorHandler;
