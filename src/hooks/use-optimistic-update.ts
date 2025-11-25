'use client';

import { useState, useCallback } from 'react';
import { useToast } from './use-toast';
import { ErrorSeverity, errorHandler } from '@/lib/error-handler';

interface OptimisticOptions<T> {
    onSuccess?: (data: T) => void;
    onError?: (error: Error) => void;
    successMessage?: string;
    errorMessage?: string;
}

export function useOptimisticUpdate<T>() {
    const [isOptimistic, setIsOptimistic] = useState(false);
    const { toast } = useToast();

    const execute = useCallback(
        async (
            updateFn: () => Promise<T>,
            optimisticUpdate: () => void,
            rollback: () => void,
            options?: OptimisticOptions<T>
        ) => {
            try {
                setIsOptimistic(true);

                // Apply optimistic update immediately
                optimisticUpdate();

                // Show instant success feedback
                if (options?.successMessage) {
                    toast({
                        title: "Success",
                        description: options.successMessage,
                    });
                }

                // Execute actual update in background
                const result = await updateFn();

                setIsOptimistic(false);
                options?.onSuccess?.(result);

                return result;
            } catch (error) {
                // Rollback optimistic changes
                rollback();
                setIsOptimistic(false);

                // Handle error
                const errorMsg = options?.errorMessage || 'Operation failed';
                errorHandler.handle(error, ErrorSeverity.MEDIUM, {
                    action: 'optimistic_update',
                });

                toast({
                    title: "Error",
                    description: errorMsg,
                    variant: "destructive",
                });

                options?.onError?.(error as Error);
                throw error;
            }
        },
        [toast]
    );

    return { execute, isOptimistic };
}
