import { useQuery, useMutation, useInfiniteQuery, useQueries } from '@tanstack/react-query';
import api from '../services/api.js';

/**
 * PRODUCTS HOOKS
 */

export const useProducts = (filters = {}, options = {}) => {
  return useQuery({
    queryKey: ['products', filters],
    queryFn: async () => {
      const response = await api.get('/products', { params: filters });
      return response;
    },
    ...options,
  });
};

export const useProductInfinite = (filters = {}, options = {}) => {
  return useInfiniteQuery({
    queryKey: ['products-infinite', filters],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await api.get('/products', {
        params: { ...filters, page: pageParam }
      });
      return response;
    },
    getNextPageParam: (lastPage) => {
      return lastPage.hasMore ? lastPage.nextPage : undefined;
    },
    ...options,
  });
};

export const useProduct = (productId, options = {}) => {
  return useQuery({
    queryKey: ['product', productId],
    queryFn: async () => {
      const response = await api.get(`/products/${productId}`);
      return response;
    },
    enabled: !!productId,
    staleTime: 1000 * 60 * 10, // 10 minutes for single product
    ...options,
  });
};

export const useCreateProduct = (options = {}) => {
  return useMutation({
    mutationFn: async (productData) => {
      const response = await api.post('/products', productData);
      return response;
    },
    ...options,
  });
};

export const useUpdateProduct = (options = {}) => {
  return useMutation({
    mutationFn: async ({ productId, data }) => {
      const response = await api.put(`/products/${productId}`, data);
      return response;
    },
    ...options,
  });
};

export const useDeleteProduct = (options = {}) => {
  return useMutation({
    mutationFn: async (productId) => {
      const response = await api.delete(`/products/${productId}`);
      return response;
    },
    ...options,
  });
};

/**
 * ORDERS HOOKS
 */

export const useOrders = (filters = {}, options = {}) => {
  return useQuery({
    queryKey: ['orders', filters],
    queryFn: async () => {
      const response = await api.get('/orders', { params: filters });
      return response;
    },
    staleTime: 1000 * 60 * 2, // 2 minutes for orders
    ...options,
  });
};

export const useOrder = (orderId, options = {}) => {
  return useQuery({
    queryKey: ['order', orderId],
    queryFn: async () => {
      const response = await api.get(`/orders/${orderId}`);
      return response;
    },
    enabled: !!orderId,
    ...options,
  });
};

export const useOrderTracking = (orderId, options = {}) => {
  return useQuery({
    queryKey: ['order-tracking', orderId],
    queryFn: async () => {
      const response = await api.get(`/orders/${orderId}/tracking`);
      return response;
    },
    enabled: !!orderId,
    refetchInterval: 1000 * 30, // Poll every 30 seconds
    ...options,
  });
};

export const useCreateOrder = (options = {}) => {
  return useMutation({
    mutationFn: async (orderData) => {
      const response = await api.post('/orders', orderData);
      return response;
    },
    ...options,
  });
};

export const useCancelOrder = (options = {}) => {
  return useMutation({
    mutationFn: async (orderId) => {
      const response = await api.post(`/orders/${orderId}/cancel`);
      return response;
    },
    ...options,
  });
};

/**
 * CART HOOKS
 */

export const useCart = (options = {}) => {
  return useQuery({
    queryKey: ['cart'],
    queryFn: async () => {
      const response = await api.get('/cart');
      return response;
    },
    staleTime: 1000 * 60, // 1 minute
    ...options,
  });
};

export const useAddToCart = (options = {}) => {
  return useMutation({
    mutationFn: async ({ productId, quantity }) => {
      const response = await api.post('/cart/add', { productId, quantity });
      return response;
    },
    ...options,
  });
};

export const useUpdateCartItem = (options = {}) => {
  return useMutation({
    mutationFn: async ({ itemId, quantity }) => {
      const response = await api.put(`/cart/${itemId}`, { quantity });
      return response;
    },
    ...options,
  });
};

export const useRemoveFromCart = (options = {}) => {
  return useMutation({
    mutationFn: async (itemId) => {
      const response = await api.delete(`/cart/${itemId}`);
      return response;
    },
    ...options,
  });
};

export const useClearCart = (options = {}) => {
  return useMutation({
    mutationFn: async () => {
      const response = await api.delete('/cart');
      return response;
    },
    ...options,
  });
};

/**
 * WISHLIST HOOKS
 */

export const useWishlist = (options = {}) => {
  return useQuery({
    queryKey: ['wishlist'],
    queryFn: async () => {
      const response = await api.get('/wishlist');
      return response;
    },
    ...options,
  });
};

export const useAddToWishlist = (options = {}) => {
  return useMutation({
    mutationFn: async (productId) => {
      const response = await api.post(`/wishlist/${productId}`);
      return response;
    },
    ...options,
  });
};

export const useRemoveFromWishlist = (options = {}) => {
  return useMutation({
    mutationFn: async (productId) => {
      const response = await api.delete(`/wishlist/${productId}`);
      return response;
    },
    ...options,
  });
};

/**
 * FARMERS HOOKS
 */

export const useFarmers = (filters = {}, options = {}) => {
  return useQuery({
    queryKey: ['farmers', filters],
    queryFn: async () => {
      const response = await api.get('/farmers', { params: filters });
      return response;
    },
    ...options,
  });
};

export const useFarmer = (farmerId, options = {}) => {
  return useQuery({
    queryKey: ['farmer', farmerId],
    queryFn: async () => {
      const response = await api.get(`/farmers/${farmerId}`);
      return response;
    },
    enabled: !!farmerId,
    ...options,
  });
};

export const useFarmerCrops = (farmerId, options = {}) => {
  return useQuery({
    queryKey: ['farmer-crops', farmerId],
    queryFn: async () => {
      const response = await api.get(`/farmers/${farmerId}/crops`);
      return response;
    },
    enabled: !!farmerId,
    staleTime: 1000 * 60 * 5,
    ...options,
  });
};

/**
 * REVIEWS HOOKS
 */

export const useProductReviews = (productId, options = {}) => {
  return useQuery({
    queryKey: ['reviews', productId],
    queryFn: async () => {
      const response = await api.get(`/products/${productId}/reviews`);
      return response;
    },
    enabled: !!productId,
    ...options,
  });
};

export const useCreateReview = (options = {}) => {
  return useMutation({
    mutationFn: async ({ productId, reviewData }) => {
      const response = await api.post(`/products/${productId}/reviews`, reviewData);
      return response;
    },
    ...options,
  });
};

/**
 * NOTIFICATIONS HOOKS
 */

export const useNotifications = (options = {}) => {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const response = await api.get('/notifications');
      return response;
    },
    refetchInterval: 1000 * 30, // Poll every 30 seconds
    staleTime: 1000 * 10, // 10 seconds
    ...options,
  });
};

export const useMarkNotificationRead = (options = {}) => {
  return useMutation({
    mutationFn: async (notificationId) => {
      const response = await api.put(`/notifications/${notificationId}/read`);
      return response;
    },
    ...options,
  });
};

/**
 * SEARCH HOOKS
 */

export const useSearch = (query, options = {}) => {
  return useQuery({
    queryKey: ['search', query],
    queryFn: async () => {
      const response = await api.get('/search', { params: { q: query } });
      return response;
    },
    enabled: !!query && query.length > 0,
    staleTime: 1000 * 60 * 5,
    ...options,
  });
};

export const useAutoComplete = (query, options = {}) => {
  return useQuery({
    queryKey: ['autocomplete', query],
    queryFn: async () => {
      const response = await api.get('/search/autocomplete', { params: { q: query } });
      return response;
    },
    enabled: !!query && query.length > 1,
    staleTime: 1000 * 60 * 10,
    ...options,
  });
};

/**
 * USER PROFILE HOOKS
 */

export const useUserProfile = (userId, options = {}) => {
  return useQuery({
    queryKey: ['user-profile', userId],
    queryFn: async () => {
      const response = await api.get(`/users/${userId}/profile`);
      return response;
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 10,
    ...options,
  });
};

export const useUpdateProfile = (options = {}) => {
  return useMutation({
    mutationFn: async (profileData) => {
      const response = await api.put('/users/profile', profileData);
      return response;
    },
    ...options,
  });
};

/**
 * MULTI-QUERY HOOK
 * Fetch multiple queries in parallel
 */
export const useMultipleQueries = (queries, options = {}) => {
  return useQueries({
    queries: queries.map(q => ({
      queryKey: q.queryKey,
      queryFn: q.queryFn,
      ...q.options,
    })),
    ...options,
  });
};

export default {
  // Products
  useProducts,
  useProductInfinite,
  useProduct,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,

  // Orders
  useOrders,
  useOrder,
  useOrderTracking,
  useCreateOrder,
  useCancelOrder,

  // Cart
  useCart,
  useAddToCart,
  useUpdateCartItem,
  useRemoveFromCart,
  useClearCart,

  // Wishlist
  useWishlist,
  useAddToWishlist,
  useRemoveFromWishlist,

  // Farmers
  useFarmers,
  useFarmer,
  useFarmerCrops,

  // Reviews
  useProductReviews,
  useCreateReview,

  // Notifications
  useNotifications,
  useMarkNotificationRead,

  // Search
  useSearch,
  useAutoComplete,

  // User Profile
  useUserProfile,
  useUpdateProfile,

  // Multi
  useMultipleQueries,
};
