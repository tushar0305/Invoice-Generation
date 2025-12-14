import { NextResponse } from 'next/server';
import { createClient } from '@/supabase/server';
import type { UpdateInventoryItemPayload } from '@/lib/inventory-types';

// GET /api/v1/inventory/[itemId] - Get single item by ID or tag_id
export async function GET(
    request: Request,
    { params }: { params: Promise<{ itemId: string }> }
) {
    try {
        const { itemId } = await params;
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Try to find by tag_id first (most common), then by id
        // Use separate queries to avoid UUID parsing issues
        let data = null;
        let error = null;

        // First, try tag_id (more common - tag_ids are strings like "SA-G22-000002")
        const tagQuery = await supabase
            .from('inventory_items')
            .select('*')
            .eq('tag_id', itemId)
            .single();

        if (tagQuery.data) {
            data = tagQuery.data;
        } else if (tagQuery.error?.code !== 'PGRST116') {
            // Only try ID lookup if tag lookup failed for reasons other than "not found"
            error = tagQuery.error;
        } else {
            // Try as UUID if tag_id not found
            const idQuery = await supabase
                .from('inventory_items')
                .select('*')
                .eq('id', itemId)
                .single();
            
            if (idQuery.data) {
                data = idQuery.data;
            } else {
                error = idQuery.error;
            }
        }

        if (error) {
            if (error.code === 'PGRST116') {
                return NextResponse.json({ error: 'Item not found' }, { status: 404 });
            }
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Get status history
        const { data: history } = await supabase
            .from('inventory_status_history')
            .select('*')
            .eq('item_id', data.id)
            .order('created_at', { ascending: false })
            .limit(20);

        return NextResponse.json({ item: data, history: history || [] });
    } catch (error: any) {
        console.error('Inventory GET error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// PUT /api/v1/inventory/[itemId] - Update item
export async function PUT(
    request: Request,
    { params }: { params: Promise<{ itemId: string }> }
) {
    try {
        const { itemId } = await params;
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body: UpdateInventoryItemPayload = await request.json();

        // Build update object (only include provided fields)
        const updateData: Record<string, any> = { updated_by: user.id };

        const allowedFields = [
            'name', 'category', 'hsn_code',
            'gross_weight', 'net_weight', 'stone_weight', 'wastage_percent',
            'making_charge_type', 'making_charge_value', 'stone_value',
            'status', 'location'
        ];

        for (const field of allowedFields) {
            if (body[field as keyof UpdateInventoryItemPayload] !== undefined) {
                updateData[field] = body[field as keyof UpdateInventoryItemPayload];
            }
        }

        // First get the item to ensure it exists
        const getQuery = await supabase
            .from('inventory_items')
            .select('id')
            .eq('tag_id', itemId)
            .single();

        let itemUuid = null;
        if (getQuery.data) {
            itemUuid = getQuery.data.id;
        } else {
            // Try as UUID
            itemUuid = itemId;
        }

        const { data, error } = await supabase
            .from('inventory_items')
            .update(updateData)
            .eq('id', itemUuid)
            .select()
            .single();

        if (error) {
            console.error('Error updating inventory item:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ item: data });
    } catch (error: any) {
        console.error('Inventory PUT error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE /api/v1/inventory/[itemId] - Soft delete (set status to MELTED/DAMAGED)
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ itemId: string }> }
) {
    try {
        const { itemId } = await params;
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // First get the item to ensure it exists
        const getQuery = await supabase
            .from('inventory_items')
            .select('id')
            .eq('tag_id', itemId)
            .single();

        let itemUuid = null;
        if (getQuery.data) {
            itemUuid = getQuery.data.id;
        } else {
            // Try as UUID
            itemUuid = itemId;
        }

        // Soft delete - mark as MELTED (or could be a hard delete if needed)
        const { error } = await supabase
            .from('inventory_items')
            .update({ status: 'MELTED', updated_by: user.id })
            .eq('id', itemUuid);

        if (error) {
            console.error('Error deleting inventory item:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Inventory DELETE error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
