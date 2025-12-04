import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { withAuth, checkShopAccess, successResponse, errorResponse } from '@/lib/api/utils';
import { validate, UpdateStockItemSchema } from '@/lib/api/validation';
import { createAuditLogger } from '@/lib/api/audit';

/**
 * PUT /api/v1/stock/[itemId]
 * 
 * Updates a stock item.
 */
export const PUT = withAuth(async (
    req: NextRequest,
    { user, supabase, params }
) => {
    const { itemId } = params;
    const body = await req.json();
    const input = validate(UpdateStockItemSchema, body);

    // Fetch item to check shop access
    const { data: item, error: fetchError } = await supabase
        .from('stock_items')
        .select('shop_id')
        .eq('id', itemId)
        .single();

    if (fetchError || !item) {
        return errorResponse('Stock item not found', 404, 'NOT_FOUND');
    }

    // Check permissions
    const { hasAccess, role } = await checkShopAccess(
        supabase,
        user.id,
        item.shop_id,
        ['owner', 'manager']
    );

    if (!hasAccess) {
        return errorResponse('Insufficient permissions', 403, 'FORBIDDEN');
    }

    // Execute DB function
    const { data, error } = await supabase.rpc('update_stock_item', {
        p_item_id: itemId,
        p_shop_id: item.shop_id,
        p_name: input.name,
        p_description: input.description || null,
        p_purity: input.purity,
        p_base_price: input.basePrice,
        p_base_weight: input.baseWeight || null,
        p_making_charge: input.makingChargePerGram,
        p_quantity: input.quantity,
        p_unit: input.unit,
        p_category: input.category || null,
        p_is_active: input.isActive,
        p_user_id: user.id
    });

    if (error) {
        console.error('[Update Stock Error]', error);
        return errorResponse('Failed to update stock item', 500, 'UPDATE_FAILED');
    }

    // Audit
    const auditLogger = createAuditLogger(supabase, user.id, item.shop_id);
    await auditLogger.logUpdate('stock_item', itemId, { name: input.name, role });

    // ✅ Cache invalidation
    revalidatePath(`/shop/${item.shop_id}/stock`);

    return successResponse(data, 200);
});

/**
 * DELETE /api/v1/stock/[itemId]
 * 
 * Deletes a stock item.
 */
export const DELETE = withAuth(async (
    req: NextRequest,
    { user, supabase, params }
) => {
    const { itemId } = params;

    // Fetch item to check shop access
    const { data: item, error: fetchError } = await supabase
        .from('stock_items')
        .select('shop_id')
        .eq('id', itemId)
        .single();

    if (fetchError || !item) {
        return errorResponse('Stock item not found', 404, 'NOT_FOUND');
    }

    // Check permissions
    const { hasAccess, role } = await checkShopAccess(
        supabase,
        user.id,
        item.shop_id,
        ['owner', 'manager']
    );

    if (!hasAccess) {
        return errorResponse('Insufficient permissions', 403, 'FORBIDDEN');
    }

    // Execute DB function
    const { data, error } = await supabase.rpc('delete_stock_item', {
        p_item_id: itemId,
        p_shop_id: item.shop_id,
        p_user_id: user.id
    });

    if (error) {
        console.error('[Delete Stock Error]', error);
        return errorResponse('Failed to delete stock item', 500, 'DELETE_FAILED');
    }

    // Audit
    const auditLogger = createAuditLogger(supabase, user.id, item.shop_id);
    await auditLogger.logDelete('stock_item', itemId, { role });

    // ✅ Cache invalidation
    revalidatePath(`/shop/${item.shop_id}/stock`);

    return successResponse({ message: 'Item deleted' }, 200);
});
