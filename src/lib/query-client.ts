import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            // Cache data for 5 minutes
            staleTime: 1000 * 60 * 5,
            // Keep unused data for 30 minutes
            gcTime: 1000 * 60 * 30,
            // Retry failed requests 3 times
            retry: 3,
            // Refetch on window focus
            refetchOnWindowFocus: false,
        },
    },
});
