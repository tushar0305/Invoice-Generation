import { NextResponse } from 'next/server';
import { createClient } from '@/supabase/server';
import { PURITY_OPTIONS } from '@/lib/inventory-types';
import type { CreateInventoryItemPayload } from '@/lib/inventory-types';

export async function POST(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body: { items: CreateInventoryItemPayload[] } = await request.json();
        const items = body.items;

        if (!items || !Array.isArray(items) || items.length === 0) {
            return NextResponse.json({ error: 'No items provided' }, { status: 400 });
        }

        // Validate all items
        for (const item of items) {
            if (!item.shop_id) return NextResponse.json({ error: 'shop_id is required for all items' }, { status: 400 });
            if (!item.metal_type) return NextResponse.json({ error: 'metal_type is required' }, { status: 400 });
            // Relaxed validation for bulk, but good to check criticals
        }

        // Prepare data for insertion (including defaults)
        const itemsToInsert = items.map(item => ({
            shop_id: item.shop_id,
            name: item.name || null, // DB trigger likely handles this if null, but we usually set it
            metal_type: item.metal_type,
            purity: item.purity,
            category: item.category || null,
            sub_category: item.sub_category || null,
            collection: item.collection || null,
            huid: item.huid || null,
            hsn_code: item.hsn_code || null,
            gross_weight: item.gross_weight,
            net_weight: item.net_weight,
            stone_weight: item.stone_weight || 0,
            wastage_percent: item.wastage_percent || 0,
            making_charge_type: item.making_charge_type || 'PER_GRAM',
            making_charge_value: item.making_charge_value || 0,
            stone_value: item.stone_value || 0,
            created_by: user.id,
            status: 'IN_STOCK' // explicitly set for bulk
        }));

        const { data, error } = await supabase
            .from('inventory_items')
            .insert(itemsToInsert)
            .select();

        if (error) {
            console.error('Bulk create error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ count: data.length, items: data }, { status: 201 });

    } catch (error: any) {
        console.error('Bulk API error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
