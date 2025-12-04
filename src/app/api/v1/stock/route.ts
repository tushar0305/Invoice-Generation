import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { withAuth, checkShopAccess, successResponse, errorResponse } from '@/lib/api/utils';
import { validate, StockItemSchema } from '@/lib/api/validation';
import { createAuditLogger } from '@/lib/api/audit';

/**
 * POST /api/v1/stock
 * 
 * Creates a new stock item.
 */
export const POST = withAuth(async (
    req: NextRequest,
    { user, supabase }
) => {
    const body = await req.json();
    const input = validate(StockItemSchema, body);

    // Check permissions
    const { hasAccess, role } = await checkShopAccess(
        supabase,
        user.id,
        input.shopId,
        ['owner', 'manager']
    );

    if (!hasAccess) {
        return errorResponse('Insufficient permissions', 403, 'FORBIDDEN');
    }

    // Execute DB function
    const { data, error } = await supabase.rpc('create_stock_item', {
        p_shop_id: input.shopId,
        p_user_id: user.id,
        p_name: input.name,
        p_description: input.description || null,
        p_purity: input.purity,
        p_base_price: input.basePrice,
        p_base_weight: input.baseWeight || null,
        p_making_charge: input.makingChargePerGram,
        p_quantity: input.quantity,
        p_unit: input.unit,
        p_category: input.category || null,
        p_is_active: input.isActive
    });

    if (error) {
        console.error('[Create Stock Error]', error);
        return errorResponse('Failed to create stock item', 500, 'CREATE_FAILED');
    }

    // Audit
    const auditLogger = createAuditLogger(supabase, user.id, input.shopId);
    await auditLogger.logCreate('stock_item', data.id, { name: input.name, role });

    // ✅ Cache invalidation
    revalidatePath(`/shop/${input.shopId}/stock`);

    return successResponse(data, 201);
});
