import { NextResponse } from 'next/server';
import { createClient } from '@/supabase/server';
import type { CreateInventoryItemPayload } from '@/lib/inventory-types';

// GET /api/v1/inventory - List inventory items with filters
export async function GET(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const shopId = searchParams.get('shopId');
        const status = searchParams.get('status');
        const metalType = searchParams.get('metal_type');
        const purity = searchParams.get('purity');
        const category = searchParams.get('category');
        const location = searchParams.get('location');
        const search = searchParams.get('q');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '50');
        const from = (page - 1) * limit;
        const to = from + limit - 1;

        if (!shopId) {
            return NextResponse.json({ error: 'shopId is required' }, { status: 400 });
        }

        let query = supabase
            .from('inventory_items')
            .select('*', { count: 'exact' })
            .eq('shop_id', shopId)
            .order('created_at', { ascending: false })
            .range(from, to);

        // Apply filters
        if (status) query = query.eq('status', status);
        if (metalType) query = query.eq('metal_type', metalType);
        if (purity) query = query.eq('purity', purity);
        if (category) query = query.eq('category', category);
        if (location) query = query.eq('location', location);
        if (search) {
            query = query.or(`name.ilike.%${search}%,tag_id.ilike.%${search}%,category.ilike.%${search}%`);
        }

        const { data, count, error } = await query;

        if (error) {
            console.error('Error fetching inventory:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Get counts by status for filter badges
        const [inStockCount, reservedCount, soldCount] = await Promise.all([
            supabase.from('inventory_items').select('*', { count: 'exact', head: true }).eq('shop_id', shopId).eq('status', 'IN_STOCK'),
            supabase.from('inventory_items').select('*', { count: 'exact', head: true }).eq('shop_id', shopId).eq('status', 'RESERVED'),
            supabase.from('inventory_items').select('*', { count: 'exact', head: true }).eq('shop_id', shopId).eq('status', 'SOLD'),
        ]);

        return NextResponse.json({
            items: data || [],
            pagination: {
                page,
                limit,
                total: count || 0,
                totalPages: Math.ceil((count || 0) / limit),
            },
            counts: {
                all: count || 0,
                inStock: inStockCount.count || 0,
                reserved: reservedCount.count || 0,
                sold: soldCount.count || 0,
            }
        });
    } catch (error: any) {
        console.error('Inventory API error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST /api/v1/inventory - Create new inventory item
export async function POST(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body: CreateInventoryItemPayload = await request.json();

        // Validation
        if (!body.shop_id) return NextResponse.json({ error: 'shop_id is required' }, { status: 400 });
        if (!body.name) return NextResponse.json({ error: 'name is required' }, { status: 400 });
        if (!body.metal_type) return NextResponse.json({ error: 'metal_type is required' }, { status: 400 });
        if (!body.purity) return NextResponse.json({ error: 'purity is required' }, { status: 400 });
        if (body.gross_weight === undefined || body.gross_weight <= 0) {
            return NextResponse.json({ error: 'gross_weight must be positive' }, { status: 400 });
        }
        if (body.net_weight === undefined || body.net_weight <= 0) {
            return NextResponse.json({ error: 'net_weight must be positive' }, { status: 400 });
        }

        const { data, error } = await supabase
            .from('inventory_items')
            .insert({
                shop_id: body.shop_id,
                name: body.name,
                metal_type: body.metal_type,
                purity: body.purity,
                category: body.category || null,
                subcategory: body.subcategory || null,
                hsn_code: body.hsn_code || null,
                gross_weight: body.gross_weight,
                net_weight: body.net_weight,
                stone_weight: body.stone_weight || 0,
                wastage_percent: body.wastage_percent || 0,
                making_charge_type: body.making_charge_type || 'PER_GRAM',
                making_charge_value: body.making_charge_value || 0,
                stone_value: body.stone_value || 0,
                purchase_cost: body.purchase_cost || null,
                selling_price: body.selling_price || null,
                location: body.location || 'SHOWCASE',
                source_type: body.source_type || 'VENDOR_PURCHASE',
                source_notes: body.source_notes || null,
                vendor_name: body.vendor_name || null,
                description: body.description || null,
                internal_notes: body.internal_notes || null,
                images: body.images || [],
                created_by: user.id,
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating inventory item:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ item: data }, { status: 201 });
    } catch (error: any) {
        console.error('Inventory POST error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
