import { useQueryClient, useMutation } from '@tanstack/react-query';

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
      
      await queryClient.cancelQueries({
        queryKey: Array.isArray(queryKey) ? queryKey : [queryKey],
      });

      const previousData = queryClient.getQueryData(
        Array.isArray(queryKey) ? queryKey : [queryKey]
      );

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
      
      queryClient.invalidateQueries({
        queryKey: Array.isArray(queryKey) ? queryKey : [queryKey],
      });

      if (options.onSuccess) {
        options.onSuccess(data, variables, context);
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
        options.onError(error, variables, context);
      }
    },

    ...options,
  });
};

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

export const useRemoveItemMutation = (
  mutationFn,
  queryKey,
  options = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onMutate: async (itemId) => {
      
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

export const useInvalidateQueries = () => {
  const queryClient = useQueryClient();

  return (queryKeys) => {
    queryKeys.forEach(key => {
      queryClient.invalidateQueries({ queryKey: key });
    });
  };
};

export const usePrefetchQueries = () => {
  const queryClient = useQueryClient();

  return (queries) => {
    queries.forEach(({ queryKey, queryFn }) => {
      queryClient.prefetchQuery({ queryKey, queryFn });
    });
  };
};

export const useMutationWithInvalidation = (
  mutationFn,
  invalidateKeys = [],
  options = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onSuccess: async (...args) => {
      
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

export const useClearCache = () => {
  const queryClient = useQueryClient();
  return () => queryClient.clear();
};

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
