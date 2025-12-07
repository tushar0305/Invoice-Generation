import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/supabase/client';
import type { Invoice } from '@/lib/definitions';

// Query key factories for consistent key generation
export const queryKeys = {
    invoices: (shopId: string) => ['invoices', shopId] as const,
    stock: (shopId: string) => ['stock', shopId] as const,
    customers: (shopId: string) => ['customers', shopId] as const,
    dashboard: (shopId: string) => ['dashboard', shopId] as const,
    all: (shopId: string) => [shopId] as const,
};

/**
 * Hook to fetch invoices with React Query caching
 */
export function useInvoices(shopId: string | undefined) {
    return useQuery({
        queryKey: queryKeys.invoices(shopId || ''),
        queryFn: async () => {
            if (!shopId) return [];

            const { data, error } = await supabase
                .from('invoices')
                .select('*')
                .eq('shop_id', shopId)
                .order('created_at', { ascending: false })
                .limit(100); // Limit to last 100 for performance

            if (error) throw error;

            return (data ?? []).map((r: any) => ({
                id: r.id,
                userId: r.user_id,
                shopId: r.shop_id,
                createdBy: r.created_by,
                invoiceNumber: r.invoice_number,
                customerId: r.customer_id,
                customerSnapshot: r.customer_snapshot,
                invoiceDate: r.invoice_date,
                status: r.status,
                subtotal: Number(r.subtotal) || 0,
                discount: Number(r.discount) || 0,
                cgstAmount: Number(r.cgst_amount) || 0,
                sgstAmount: Number(r.sgst_amount) || 0,
                grandTotal: Number(r.grand_total) || 0,
                notes: r.notes,
                createdByName: r.created_by_name,
                createdAt: r.created_at,
                updatedAt: r.updated_at,
            } as Invoice));
        },
        enabled: !!shopId,
        staleTime: 30 * 1000, // 30 seconds - dashboard needs fresher data
        gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
    });
}

/**
 * Hook to fetch stock items with caching
 */
export function useStockItems(shopId: string | undefined) {
    return useQuery({
        queryKey: queryKeys.stock(shopId || ''),
        queryFn: async () => {
            if (!shopId) return [];

            const { data, error } = await supabase
                .from('stock_items')
                .select('*')
                .eq('shop_id', shopId)
                .is('deleted_at', null)
                .order('name', { ascending: true });

            if (error) throw error;
            return data || [];
        },
        enabled: !!shopId,
        staleTime: 5 * 60 * 1000, // Stock changes less frequently - 5 minutes
        gcTime: 15 * 60 * 1000, // Keep in cache for 15 minutes
    });
}

/**
 * Hook to fetch customers with caching
 */
export function useCustomers(shopId: string | undefined) {
    return useQuery({
        queryKey: queryKeys.customers(shopId || ''),
        queryFn: async () => {
            if (!shopId) return [];

            const { data, error } = await supabase
                .from('customers')
                .select('*')
                .eq('shop_id', shopId)
                .is('deleted_at', null)
                .order('name', { ascending: true });

            if (error) throw error;
            return data || [];
        },
        enabled: !!shopId,
        staleTime: 2 * 60 * 1000, // 2 minutes
        gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    });
}

/**
 * Hook to invalidate cache after mutations
 * Now with optimistic updates and proper cache invalidation
 */
export function useInvalidateQueries() {
    const queryClient = useQueryClient();

    return {
        invalidateInvoices: (shopId: string) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.invoices(shopId) });
            // Also invalidate dashboard since it depends on invoices
            queryClient.invalidateQueries({ queryKey: queryKeys.dashboard(shopId) });
        },
        invalidateStock: (shopId: string) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.stock(shopId) });
        },
        invalidateCustomers: (shopId: string) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.customers(shopId) });
        },
        invalidateAll: (shopId: string) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.all(shopId) });
        },
        // Prefetch data for better UX
        prefetchInvoices: async (shopId: string) => {
            await queryClient.prefetchQuery({
                queryKey: queryKeys.invoices(shopId),
                queryFn: async () => {
                    const { data } = await supabase
                        .from('invoices')
                        .select('*')
                        .eq('shop_id', shopId)
                        .order('created_at', { ascending: false })
                        .limit(100);
                    return data || [];
                },
            });
        },
        prefetchStock: async (shopId: string) => {
            await queryClient.prefetchQuery({
                queryKey: queryKeys.stock(shopId),
                queryFn: async () => {
                    const { data } = await supabase
                        .from('stock_items')
                        .select('*')
                        .eq('shop_id', shopId)
                        .is('deleted_at', null);
                    return data || [];
                },
            });
        },
    };
}
