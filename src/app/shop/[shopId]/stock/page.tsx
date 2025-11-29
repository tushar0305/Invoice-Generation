/**
 * Stock Page - Server Component
 * Fetches inventory data server-side with filtering
 */

import { Suspense } from 'react';
import { createClient } from '@/supabase/server';
import { StockClient } from './client';
import { Loader2 } from 'lucide-react';
import type { StockItem } from '@/lib/definitions';

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
    searchParams: Promise<{ filter?: string; q?: string }>;
}) {
    const { shopId } = await params;
    const { filter, q } = await searchParams;
    const supabase = await createClient();

    // 1. Get counts for tabs (all, low, out)
    // We need separate queries or a way to count filtered groups.
    // For performance, we can fetch all items (if not too many) or run count queries.
    // Given stock usually isn't massive for small shops, fetching all ID+quantity might be okay,
    // but let's do it properly with count queries to be scalable.

    // Actually, to avoid multiple round trips, let's fetch all items for this shop 
    // if we assume < 1000 items. If > 1000, we should paginate.
    // For now, let's stick to the pattern of fetching what's needed for the view.
    // But we need counts for the tabs...
    // Let's fetch all items (lightweight select) to calculate counts client-side or server-side?
    // The previous implementation fetched ALL items and filtered client-side.
    // To keep it performant but scalable, let's fetch filtered items for the list,
    // and maybe a separate lightweight query for counts if needed.
    // OR, just fetch all items like before but on the server?
    // Fetching 500 items on server is faster than sending 500 items to client.
    // Let's fetch ALL items on server, calculate counts, AND apply filters there.
    // This avoids sending unnecessary data to client.

    const { data: allItems } = await supabase
        .from('stock_items')
        .select('*')
        .eq('shop_id', shopId)
        .order('created_at', { ascending: false });

    const items = (allItems || []).map((r: any) => ({
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

    // Calculate counts
    const counts = {
        all: items.length,
        low: items.filter(i => i.quantity > 0 && i.quantity < 3).length,
        out: items.filter(i => i.quantity === 0).length
    };

    // Apply filters server-side (in memory since we fetched all for counts)
    let filteredItems = items;

    if (filter) {
        if (filter === 'low') filteredItems = filteredItems.filter(i => i.quantity > 0 && i.quantity < 3);
        else if (filter === 'out') filteredItems = filteredItems.filter(i => i.quantity === 0);
    }

    if (q) {
        const lower = q.toLowerCase();
        filteredItems = filteredItems.filter(i =>
            i.name.toLowerCase().includes(lower) ||
            i.purity.toLowerCase().includes(lower) ||
            (i.category && i.category.toLowerCase().includes(lower))
        );
    }

    return (
        <Suspense fallback={<StockLoading />}>
            <StockClient
                initialItems={filteredItems}
                counts={counts}
                shopId={shopId}
                initialFilter={filter || 'all'}
                initialSearch={q || ''}
            />
        </Suspense>
    );
}
