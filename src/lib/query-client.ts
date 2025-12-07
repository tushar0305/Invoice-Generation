import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            // Data is fresh for 2 minutes (reduces unnecessary refetches)
            staleTime: 1000 * 60 * 2,
            // Keep unused data in cache for 15 minutes
            gcTime: 1000 * 60 * 15,
            // Retry failed requests once with exponential backoff
            retry: 1,
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
            // Don't refetch on window focus (less aggressive, better for slow connections)
            refetchOnWindowFocus: false,
            // Don't refetch on reconnect automatically (user can refresh manually)
            refetchOnReconnect: false,
            // Don't refetch on mount if data is still fresh
            refetchOnMount: false,
            // Use structural sharing to prevent unnecessary re-renders
            structuralSharing: true,
            // Network mode: always try cache first
            networkMode: 'offlineFirst',
        },
        mutations: {
            // Retry mutations once
            retry: 1,
            // Network mode for mutations
            networkMode: 'online',
        },
    },
});
