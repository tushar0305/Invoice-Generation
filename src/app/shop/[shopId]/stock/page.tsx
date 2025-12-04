/**
 * Stock Page - Server Component
 * Fetches inventory data server-side with filtering
 */

import { Suspense } from 'react';
import { createClient } from '@/supabase/server';
import { StockClient } from './client';
import { Loader2 } from 'lucide-react';
import type { StockItem } from '@/lib/definitions';

import { MobileStockList } from '@/components/mobile/mobile-stock-list';

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

    // Fetch all items for mobile view (client-side filtering)
    // and filtered items for desktop view (server-side filtering)
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
            <MobileStockList shopId={shopId} items={items} />
            <div className="hidden md:block">
                <StockClient
                    initialItems={filteredItems}
                    shopId={shopId}
                    counts={counts}
                    initialFilter={filter || 'all'}
                    initialSearch={q || ''}
                />
            </div>
        </Suspense>
    );
}
