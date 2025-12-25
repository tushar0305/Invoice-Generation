import { Suspense } from 'react';
import { createClient } from '@/supabase/server';
import { InventoryClient } from './client';
import { Loader2 } from 'lucide-react';

function InventoryLoading() {
    return (
        <div className="flex h-[50vh] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    );
}

export default async function InventoryPage({
    params,
    searchParams,
}: {
    params: Promise<{ shopId: string }>;
    searchParams: Promise<{
        status?: string;
        metal_type?: string;
        q?: string;
        page?: string;
        limit?: string;
    }>;
}) {
    const { shopId } = await params;
    const { status, metal_type, q, page: pageParam, limit: limitParam } = await searchParams;
    const supabase = await createClient();

    const page = Number(pageParam) || 1;
    const limit = Number(limitParam) || 10;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    // Build query with filters
    let query = supabase
        .from('inventory_items')
        .select('*', { count: 'exact' })
        .eq('shop_id', shopId)
        .order('created_at', { ascending: false })
        .range(from, to);

    if (status && status !== 'all') {
        query = query.eq('status', status);
    }
    if (metal_type) {
        query = query.eq('metal_type', metal_type);
    }
    if (q) {
        query = query.or(`name.ilike.%${q}%,tag_id.ilike.%${q}%,category.ilike.%${q}%`);
    }

    const { data: items, count } = await query;

    // Get counts for filter badges
    const [allCount, inStockCount, reservedCount, soldCount] = await Promise.all([
        supabase.from('inventory_items').select('*', { count: 'exact', head: true }).eq('shop_id', shopId),
        supabase.from('inventory_items').select('*', { count: 'exact', head: true }).eq('shop_id', shopId).eq('status', 'IN_STOCK'),
        supabase.from('inventory_items').select('*', { count: 'exact', head: true }).eq('shop_id', shopId).eq('status', 'RESERVED'),
        supabase.from('inventory_items').select('*', { count: 'exact', head: true }).eq('shop_id', shopId).eq('status', 'SOLD'),
    ]);

    return (
        <Suspense fallback={<InventoryLoading />}>
            <InventoryClient
                initialItems={items || []}
                shopId={shopId}
                initialFilter={status || 'all'}
                initialSearch={q || ''}
                pagination={{
                    currentPage: page,
                    totalPages: Math.ceil((count || 0) / limit),
                    totalCount: count || 0,
                    limit,
                }}
                counts={{
                    all: allCount.count || 0,
                    inStock: inStockCount.count || 0,
                    reserved: reservedCount.count || 0,
                    sold: soldCount.count || 0,
                }}
            />
        </Suspense>
    );
}
