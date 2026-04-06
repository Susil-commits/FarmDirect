import React, { createContext, useCallback } from 'react';
import {
  useProducts,
  useCart,
  useWishlist,
  useNotifications,
} from '../hooks/useApiQueries.js';
import { useInvalidateQueries } from '../hooks/useOptimisticMutations.js';

export const DataContext = createContext();

/**
 * DataProvider Component
 * Centralized data management using React Query
 * Handles caching, syncing, and invalidation
 */
export const DataProvider = ({ children }) => {
  // Fetch common data
  const { data: products, isLoading: productsLoading, error: productsError } = useProducts();
  const { data: cart, isLoading: cartLoading } = useCart();
  const { data: wishlist, isLoading: wishlistLoading } = useWishlist();
  const { data: notifications, isLoading: notificationsLoading } = useNotifications();

  // Invalidation utilities
  const invalidateQueries = useInvalidateQueries();

  // Data refresh utilities
  const refreshCart = useCallback(() => {
    invalidateQueries([['cart']]);
  }, [invalidateQueries]);

  const refreshWishlist = useCallback(() => {
    invalidateQueries([['wishlist']]);
  }, [invalidateQueries]);

  const refreshNotifications = useCallback(() => {
    invalidateQueries([['notifications']]);
  }, [invalidateQueries]);

  const refreshProducts = useCallback(() => {
    invalidateQueries([['products']]);
  }, [invalidateQueries]);

  const refreshAll = useCallback(() => {
    refreshProducts();
    refreshCart();
    refreshWishlist();
    refreshNotifications();
  }, [refreshProducts, refreshCart, refreshWishlist, refreshNotifications]);

  // Computed values
  const cartTotal = cart?.total || 0;
  const cartItemCount = cart?.items?.length || 0;
  const wishlistCount = wishlist?.items?.length || 0;
  const unreadNotifications = notifications?.filter(n => !n.read) || [];
  const unreadCount = unreadNotifications.length;

  // Global loading state
  const isLoading = productsLoading || cartLoading || wishlistLoading || notificationsLoading;

  const value = {
    // Data
    products,
    cart,
    wishlist,
    notifications,

    // Computed
    cartTotal,
    cartItemCount,
    wishlistCount,
    unreadCount,
    unreadNotifications,

    // Loading states
    isLoading,
    productsLoading,
    cartLoading,
    wishlistLoading,
    notificationsLoading,

    // Errors
    productsError,

    // Refresh methods
    refreshCart,
    refreshWishlist,
    refreshNotifications,
    refreshProducts,
    refreshAll,
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};

/**
 * Hook to use data context
 */
export const useData = () => {
  const context = React.useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within DataProvider');
  }
  return context;
};

export default DataProvider;
