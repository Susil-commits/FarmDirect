
import React, { createContext, useCallback } from 'react';
import {
  useProducts,
  useCart,
  useWishlist,
  useNotifications,
} from '../hooks/useApiQueries.js';
import { useInvalidateQueries } from '../hooks/useOptimisticMutations.js';

export const DataContext = createContext();

export const DataProvider = ({ children }) => {
  
  const { data: products, isLoading: productsLoading, error: productsError } = useProducts();
  const { data: cart, isLoading: cartLoading } = useCart();
  const { data: wishlist, isLoading: wishlistLoading } = useWishlist();
  const { data: notifications, isLoading: notificationsLoading } = useNotifications();

  const invalidateQueries = useInvalidateQueries();

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

  const cartTotal = cart?.total || 0;
  const cartItemCount = cart?.items?.length || 0;
  const wishlistCount = wishlist?.items?.length || 0;
  const unreadNotifications = notifications?.filter(n => !n.read) || [];
  const unreadCount = unreadNotifications.length;

  const isLoading = productsLoading || cartLoading || wishlistLoading || notificationsLoading;

  const value = {
    
    products,
    cart,
    wishlist,
    notifications,

    cartTotal,
    cartItemCount,
    wishlistCount,
    unreadCount,
    unreadNotifications,

    isLoading,
    productsLoading,
    cartLoading,
    wishlistLoading,
    notificationsLoading,

    productsError,

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

export default DataProvider;
