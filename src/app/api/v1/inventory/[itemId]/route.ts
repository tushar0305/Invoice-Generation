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

        // Try to find by id first, then by tag_id
        let query = supabase
            .from('inventory_items')
            .select('*, customer:reserved_for_customer_id(id, name, phone)')
            .or(`id.eq.${itemId},tag_id.eq.${itemId}`)
            .single();

        const { data, error } = await query;

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
            'name', 'category', 'subcategory', 'hsn_code',
            'gross_weight', 'net_weight', 'stone_weight', 'wastage_percent',
            'making_charge_type', 'making_charge_value', 'stone_value',
            'purchase_cost', 'selling_price', 'location',
            'status', 'reserved_for_customer_id', 'reserved_until',
            'description', 'internal_notes', 'images'
        ];

        for (const field of allowedFields) {
            if (body[field as keyof UpdateInventoryItemPayload] !== undefined) {
                updateData[field] = body[field as keyof UpdateInventoryItemPayload];
            }
        }

        const { data, error } = await supabase
            .from('inventory_items')
            .update(updateData)
            .or(`id.eq.${itemId},tag_id.eq.${itemId}`)
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

        // Soft delete - mark as MELTED (or could be a hard delete if needed)
        const { error } = await supabase
            .from('inventory_items')
            .update({ status: 'MELTED', updated_by: user.id })
            .or(`id.eq.${itemId},tag_id.eq.${itemId}`);

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
