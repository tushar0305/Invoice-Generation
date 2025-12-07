// ... imports
import { Suspense } from 'react';
import { createClient } from '@/supabase/server';
import { StockClient } from './client';
import { Loader2 } from 'lucide-react';

// Loading component for Suspense boundary
function StockLoading() {
    return (
        <div className="flex h-[50vh] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    );
}

export default async function StockPage({
    params,
    searchParams,
}: {
    params: Promise<{ shopId: string }>;
    searchParams: Promise<{ filter?: string; q?: string; page?: string; limit?: string }>;
}) {
    const { shopId } = await params;
    const { filter, q, page: pageParam, limit: limitParam } = await searchParams;
    const supabase = await createClient();

    const page = Number(pageParam) || 1;
    const limit = Number(limitParam) || 50;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    // Fetch all items with pagination
    let query = supabase
        .from('stock_items')
        .select('*', { count: 'exact' })
        .eq('shop_id', shopId)
        .order('created_at', { ascending: false })
        .range(from, to);

    // Apply filters server-side
    // Note: This logic needs adjustment because we're fetching paginated data based on filters.
    // The previous code fetched ALL items then filtered in memory.
    // We must move filtering to the database query for pagination to work correctly.

    if (filter) {
        if (filter === 'low') {
            query = query.gt('quantity', 0).lt('quantity', 3);
        } else if (filter === 'out') {
            query = query.eq('quantity', 0);
        }
    }

    if (q) {
        // Simple case-insensitive search on name, purity, category
        // Note: ILIKE might be slow on large datasets without indexes, but better than memory filtering 2k items.
        // Complex OR conditions in Supabase can be tricky with other filters.
        // Using a comprehensive OR for search:
        query = query.or(`name.ilike.%${q}%,purity.ilike.%${q}%,category.ilike.%${q}%`);
    }

    const { data: itemsData, count } = await query;

    // Fetch counts separately to show in badges even when filtered
    // We need "all", "low", "out" counts regardless of current filter
    // This requires separate queries or a single query with conditional counts (less trivial in Supabase JS client)
    // For now, let's fire parallel count queries. It's safe/fast enough.
    const [countAll, countLow, countOut] = await Promise.all([
        supabase.from('stock_items').select('*', { count: 'exact', head: true }).eq('shop_id', shopId),
        supabase.from('stock_items').select('*', { count: 'exact', head: true }).eq('shop_id', shopId).gt('quantity', 0).lt('quantity', 3),
        supabase.from('stock_items').select('*', { count: 'exact', head: true }).eq('shop_id', shopId).eq('quantity', 0)
    ]);

    const counts = {
        all: countAll.count || 0,
        low: countLow.count || 0,
        out: countOut.count || 0
    };

    // Map to simplified object for components, explicit casting for safety
    const items = (itemsData || []).map((r: any) => ({
        id: r.id,
        userId: r.user_id,
        shopId: r.shop_id,
        createdBy: r.created_by,
        updatedBy: r.updated_by,
        name: r.name,
        description: r.description || undefined,
        purity: r.purity,
        basePrice: Number(r.base_price) || 0,
        baseWeight: r.base_weight != null ? Number(r.base_weight) : undefined,
        makingChargePerGram: Number(r.making_charge_per_gram) || 0,
        quantity: Number(r.quantity) || 0,
        unit: r.unit,
        category: r.category || undefined,
        isActive: !!r.is_active,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
    }));

    return (
        <Suspense fallback={<StockLoading />}>
            <StockClient
                initialItems={items}
                counts={counts}
                initialFilter={filter || 'all'}
                initialSearch={q || ''}
                shopId={shopId}
                pagination={{
                    currentPage: page,
                    totalPages: Math.ceil((count || 0) / limit),
                    totalCount: count || 0,
                    limit: limit
                }}
            />
        </Suspense>
    );
}
