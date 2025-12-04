import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/supabase/client';
import type { Invoice } from '@/lib/definitions';

/**
 * Hook to fetch invoices with React Query caching
 */
export function useInvoices(shopId: string | undefined) {
    return useQuery({
        queryKey: ['invoices', shopId],
        queryFn: async () => {
            if (!shopId) return [];

            const { data, error } = await supabase
                .from('invoices')
                .select('*')
                .eq('shop_id', shopId);

            if (error) throw error;

            return (data ?? []).map((r: any) => ({
                id: r.id,
                userId: r.user_id,
                shopId: r.shop_id,
                createdBy: r.created_by,
                invoiceNumber: r.invoice_number,
                customerName: r.customer_name,
                customerAddress: r.customer_address || '',
                customerState: r.customer_state || '',
                customerPincode: r.customer_pincode || '',
                customerPhone: r.customer_phone || '',
                invoiceDate: r.invoice_date,
                discount: Number(r.discount) || 0,
                sgst: Number(r.sgst) || 0,
                cgst: Number(r.cgst) || 0,
                status: r.status,
                grandTotal: Number(r.grand_total) || 0,
                createdAt: r.created_at,
                updatedAt: r.updated_at,
            } as Invoice));
        },
        enabled: !!shopId, // Only run query if shopId exists
        staleTime: 30 * 1000, // Consider data fresh for 30 seconds (dashboard needs fresher data)
    });
}

/**
 * Hook to fetch stock items with caching
 */
export function useStockItems(shopId: string | undefined) {
    return useQuery({
        queryKey: ['stock', shopId],
        queryFn: async () => {
            if (!shopId) return [];

            const { data, error } = await supabase
                .from('stock_items')
                .select('*')
                .eq('shop_id', shopId)
                .eq('deleted_at', null);

            if (error) throw error;
            return data || [];
        },
        enabled: !!shopId,
        staleTime: 5 * 60 * 1000, // Stock changes less frequently - 5 minutes
    });
}

/**
 * Hook to fetch customers with caching
 */
export function useCustomers(shopId: string | undefined) {
    return useQuery({
        queryKey: ['customers', shopId],
        queryFn: async () => {
            if (!shopId) return [];

            const { data, error } = await supabase
                .from('customers')
                .select('*')
                .eq('shop_id', shopId)
                .eq('deleted_at', null);

            if (error) throw error;
            return data || [];
        },
        enabled: !!shopId,
        staleTime: 2 * 60 * 1000, // 2 minutes
    });
}

/**
 * Hook to invalidate cache after mutations
 */
export function useInvalidateQueries() {
    const queryClient = useQueryClient();

    return {
        invalidateInvoices: (shopId: string) => {
            queryClient.invalidateQueries({ queryKey: ['invoices', shopId] });
        },
        invalidateStock: (shopId: string) => {
            queryClient.invalidateQueries({ queryKey: ['stock', shopId] });
        },
        invalidateCustomers: (shopId: string) => {
            queryClient.invalidateQueries({ queryKey: ['customers', shopId] });
        },
        invalidateAll: (shopId: string) => {
            queryClient.invalidateQueries({ queryKey: ['invoices', shopId] });
            queryClient.invalidateQueries({ queryKey: ['stock', shopId] });
            queryClient.invalidateQueries({ queryKey: ['customers', shopId] });
        },
    };
}
