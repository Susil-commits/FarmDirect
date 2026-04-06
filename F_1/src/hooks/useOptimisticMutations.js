import { useQueryClient, useMutation } from '@tanstack/react-query';

/**
 * Hook for mutations with optimistic updates
 * Automatically updates cache before API call completes
 */
export const useOptimisticMutation = (
  mutationFn,
  queryKey,
  optimisticDataFn,
  options = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onMutate: async (variables) => {
      // Cancel pending queries
      await queryClient.cancelQueries({
        queryKey: Array.isArray(queryKey) ? queryKey : [queryKey],
      });

      // Get previous data for rollback
      const previousData = queryClient.getQueryData(
        Array.isArray(queryKey) ? queryKey : [queryKey]
      );

      // Optimistic update
      const optimisticData = optimisticDataFn(
        previousData, 
        variables
      );

      queryClient.setQueryData(
        Array.isArray(queryKey) ? queryKey : [queryKey],
        optimisticData
      );

      return { previousData };
    },

    onSuccess: (data, variables, context) => {
      // Revalidate the query after success
      queryClient.invalidateQueries({
        queryKey: Array.isArray(queryKey) ? queryKey : [queryKey],
      });

      if (options.onSuccess) {
        options.onSuccess(data, variables, context);
      }
    },

    onError: (error, variables, context) => {
      // Rollback to previous data on error
      if (context?.previousData) {
        queryClient.setQueryData(
          Array.isArray(queryKey) ? queryKey : [queryKey],
          context.previousData
        );
      }

      if (options.onError) {
        options.onError(error, variables, context);
      }
    },

    ...options,
  });
};

/**
 * Hook for adding item optimistically
 * Common pattern for add to cart, add to wishlist, etc.
 */
export const useAddItemMutation = (
  mutationFn,
  queryKey,
  options = {}
) => {
  return useOptimisticMutation(
    mutationFn,
    queryKey,
    (previousData, variables) => {
      if (!previousData || !previousData.items) return previousData;

      return {
        ...previousData,
        items: [...previousData.items, variables],
        count: (previousData.count || 0) + 1,
      };
    },
    options
  );
};

/**
 * Hook for removing item optimistically
 * Common pattern for remove from cart, remove from wishlist, etc.
 */
export const useRemoveItemMutation = (
  mutationFn,
  queryKey,
  options = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onMutate: async (itemId) => {
      // Cancel pending queries
      await queryClient.cancelQueries({
        queryKey: Array.isArray(queryKey) ? queryKey : [queryKey],
      });

      // Get previous data
      const previousData = queryClient.getQueryData(
        Array.isArray(queryKey) ? queryKey : [queryKey]
      );

      // Optimistic remove
      if (previousData?.items) {
        queryClient.setQueryData(
          Array.isArray(queryKey) ? queryKey : [queryKey],
          {
            ...previousData,
            items: previousData.items.filter(item => item.id !== itemId),
            count: Math.max(0, (previousData.count || 1) - 1),
          }
        );
      }

      return { previousData };
    },

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: Array.isArray(queryKey) ? queryKey : [queryKey],
      });

      if (options.onSuccess) {
        options.onSuccess();
      }
    },

    onError: (error, itemId, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(
          Array.isArray(queryKey) ? queryKey : [queryKey],
          context.previousData
        );
      }

      if (options.onError) {
        options.onError(error);
      }
    },

    ...options,
  });
};

/**
 * Hook for updating item optimistically
 */
export const useUpdateItemMutation = (
  mutationFn,
  queryKey,
  updateFn,
  options = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onMutate: async (variables) => {
      await queryClient.cancelQueries({
        queryKey: Array.isArray(queryKey) ? queryKey : [queryKey],
      });

      const previousData = queryClient.getQueryData(
        Array.isArray(queryKey) ? queryKey : [queryKey]
      );

      if (previousData?.items) {
        queryClient.setQueryData(
          Array.isArray(queryKey) ? queryKey : [queryKey],
          {
            ...previousData,
            items: previousData.items.map(item =>
              updateFn(item, variables)
            ),
          }
        );
      }

      return { previousData };
    },

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: Array.isArray(queryKey) ? queryKey : [queryKey],
      });

      if (options.onSuccess) {
        options.onSuccess();
      }
    },

    onError: (error, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(
          Array.isArray(queryKey) ? queryKey : [queryKey],
          context.previousData
        );
      }

      if (options.onError) {
        options.onError(error);
      }
    },

    ...options,
  });
};

/**
 * Batch invalidation utility
 * Invalidate multiple queries at once
 */
export const useInvalidateQueries = () => {
  const queryClient = useQueryClient();

  return (queryKeys) => {
    queryKeys.forEach(key => {
      queryClient.invalidateQueries({ queryKey: key });
    });
  };
};

/**
 * Prefetch utility
 * Prefetch queries before they're needed
 */
export const usePrefetchQueries = () => {
  const queryClient = useQueryClient();

  return (queries) => {
    queries.forEach(({ queryKey, queryFn }) => {
      queryClient.prefetchQuery({ queryKey, queryFn });
    });
  };
};

/**
 * Mutation with automatic cache invalidation
 */
export const useMutationWithInvalidation = (
  mutationFn,
  invalidateKeys = [],
  options = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onSuccess: async (...args) => {
      // Invalidate specified queries
      for (const key of invalidateKeys) {
        await queryClient.invalidateQueries({ queryKey: key });
      }

      if (options.onSuccess) {
        options.onSuccess(...args);
      }
    },
    ...options,
  });
};

/**
 * Hook to reset all cache
 */
export const useClearCache = () => {
  const queryClient = useQueryClient();
  return () => queryClient.clear();
};

/**
 * Hook to get infinite query data
 * Useful for combining pages from infinite queries
 */
export const useInfiniteQueryData = (queryKey) => {
  const queryClient = useQueryClient();
  const data = queryClient.getQueryData(queryKey);

  if (!data?.pages) return [];

  return data.pages.reduce((acc, page) => {
    return [...acc, ...(page.items || page.data || [])];
  }, []);
};

export default {
  useOptimisticMutation,
  useAddItemMutation,
  useRemoveItemMutation,
  useUpdateItemMutation,
  useInvalidateQueries,
  usePrefetchQueries,
  useMutationWithInvalidation,
  useClearCache,
  useInfiniteQueryData,
};
