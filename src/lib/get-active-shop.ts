/**
 * Server-side Active Shop Fetcher
 * Optimized for parallel queries and minimal latency
 */

import { createClient } from '@/supabase/server';
import type { Shop, UserShopRole, UserRole } from '@/lib/definitions';

export type ActiveShopData = {
    activeShop: Shop | null;
    userShops: Shop[];
    userRole: UserShopRole | null;
    theme: string | null;
};

/**
 * Fetch user's active shop data with optimized parallel queries
 * @param userId - The authenticated user's ID
 * @param requestedShopId - Optional specific shop ID from route params
 * @returns Active shop data with user's shops and role
 */
export async function getActiveShopData(
    userId: string,
    requestedShopId?: string
): Promise<ActiveShopData> {
    const supabase = await createClient();

    try {
        // ✅ PARALLEL QUERIES - 3-4x faster than sequential
        const [rolesResult, prefsResult] = await Promise.all([
            // Query 1: Get user's shop roles WITH shop data (single query via join)
            supabase
                .from('user_shop_roles')
                .select(`
          *,
          shops (
            id,
            shop_name,
            gst_number,
            pan_number,
            address,
            state,
            pincode,
            phone_number,
            email,
            logo_url,
            template_id,
            cgst_rate,
            sgst_rate,
            is_active,
            created_by,
            created_at,
            updated_at
          )
        `)
                .eq('user_id', userId)
                .eq('is_active', true),

            // Query 2: Get user preferences
            supabase
                .from('user_preferences')
                .select('last_active_shop_id, theme')
                .eq('user_id', userId)
                .maybeSingle(),
        ]);

        // Handle errors
        if (rolesResult.error) {
            console.error('Error fetching shop roles:', JSON.stringify(rolesResult.error, null, 2));
            return {
                activeShop: null,
                userShops: [],
                userRole: null,
                theme: null,
            };
        }

        // No shops found
        if (!rolesResult.data || rolesResult.data.length === 0) {
            return {
                activeShop: null,
                userShops: [],
                userRole: null,
                theme: prefsResult.data?.theme || null,
            };
        }

        // Transform shop data
        const userShops: Shop[] = rolesResult.data
            .map((role: any) => {
                if (!role.shops) return null;
                const shop = role.shops;
                return {
                    id: shop.id,
                    shopName: shop.shop_name,
                    gstNumber: shop.gst_number,
                    panNumber: shop.pan_number,
                    address: shop.address,
                    state: shop.state,
                    pincode: shop.pincode,
                    phoneNumber: shop.phone_number,
                    email: shop.email,
                    logoUrl: shop.logo_url,
                    templateId: shop.template_id,
                    cgstRate: Number(shop.cgst_rate) || 1.5,
                    sgstRate: Number(shop.sgst_rate) || 1.5,
                    isActive: shop.is_active,
                    createdBy: shop.created_by,
                    createdAt: shop.created_at,
                    updatedAt: shop.updated_at,
                };
            })
            .filter(Boolean) as Shop[];

        // Determine active shop
        let activeShopId: string | null = null;

        // Priority 1: Use requested shop ID from route if valid
        if (requestedShopId && userShops.find(s => s.id === requestedShopId)) {
            activeShopId = requestedShopId;
        }
        // Priority 2: Use last active shop from preferences
        else if (prefsResult.data && prefsResult.data.last_active_shop_id) {
            const prefShop = userShops.find(s => s.id === prefsResult.data!.last_active_shop_id);
            if (prefShop) {
                activeShopId = prefsResult.data.last_active_shop_id;
            }
        }
        // Priority 3: Use first owner shop
        if (!activeShopId) {
            const ownerRole = rolesResult.data.find((r: any) => r.role === 'owner');
            activeShopId = ownerRole?.shop_id || userShops[0]?.id || null;
        }

        // Get active shop and role
        const activeShop = userShops.find(s => s.id === activeShopId) || null;
        const roleData = rolesResult.data.find((r: any) => r.shop_id === activeShopId);

        const userRole: UserShopRole | null = roleData
            ? {
                id: roleData.id,
                userId: roleData.user_id,
                shopId: roleData.shop_id,
                role: roleData.role as UserRole,
                invitedBy: roleData.invited_by,
                invitedAt: roleData.invited_at,
                acceptedAt: roleData.accepted_at,
                isActive: roleData.is_active,
                createdAt: roleData.created_at,
                updatedAt: roleData.updated_at,
            }
            : null;

        return {
            activeShop,
            userShops,
            userRole,
            theme: prefsResult.data?.theme ?? null,
        };
    } catch (error) {
        console.error('Error in getActiveShopData:', error);
        return {
            activeShop: null,
            userShops: [],
            userRole: null,
            theme: null,
        };
    }
}

/**
 * Update user's last active shop preference
 * @param userId - The authenticated user's ID
 * @param shopId - The shop ID to set as active
 */
export async function updateActiveShop(userId: string, shopId: string): Promise<void> {
    const supabase = await createClient();

    await supabase
        .from('user_preferences')
        .upsert(
            {
                user_id: userId,
                last_active_shop_id: shopId,
                updated_at: new Date().toISOString(),
            },
            {
                onConflict: 'user_id',
            }
        );
}
