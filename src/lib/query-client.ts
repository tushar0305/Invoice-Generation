import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            // Data is fresh for 1 minute (good balance)
            staleTime: 1000 * 60,
            // Keep unused data in cache for 10 minutes
            gcTime: 1000 * 60 * 10,
            // Retry failed requests once (faster fail)
            retry: 1,
            // Don't refetch on window focus (less aggressive)
            refetchOnWindowFocus: false,
        },
    },
});
