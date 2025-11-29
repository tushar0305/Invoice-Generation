import { supabase } from '@/supabase/client';
import type { Shop, UserShopRole } from '@/lib/definitions';

/**
 * Service layer for shop and role-related database operations
 */

export async function getUserShops(userId: string): Promise<Shop[]> {
    const { data, error } = await supabase
        .from('user_shop_roles')
        .select(`
      shop_id,
      role,
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
        .eq('is_active', true);

    if (error) throw error;

    return (data || [])
        .filter((r: any) => r.shops) // Filter out any null shops
        .map((r: any) => ({
            id: r.shops.id,
            shopName: r.shops.shop_name,
            gstNumber: r.shops.gst_number,
            panNumber: r.shops.pan_number,
            address: r.shops.address,
            state: r.shops.state,
            pincode: r.shops.pincode,
            phoneNumber: r.shops.phone_number,
            email: r.shops.email,
            logoUrl: r.shops.logo_url,
            templateId: r.shops.template_id,
            cgstRate: r.shops.cgst_rate,
            sgstRate: r.shops.sgst_rate,
            isActive: r.shops.is_active,
            createdBy: r.shops.created_by,
            createdAt: r.shops.created_at,
            updatedAt: r.shops.updated_at,
        } as Shop));
}

export async function getUserShopRoles(userId: string): Promise<UserShopRole[]> {
    const { data, error } = await supabase
        .from('user_shop_roles')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true);

    if (error) throw error;

    return (data || []).map((r: any) => ({
        id: r.id,
        userId: r.user_id,
        shopId: r.shop_id,
        role: r.role,
        inviteCode: r.invite_code,
        invitedBy: r.invited_by,
        invitedAt: r.invited_at,
        acceptedAt: r.accepted_at,
        isActive: r.is_active,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
    } as UserShopRole));
}

export async function getShopById(shopId: string): Promise<Shop | null> {
    const { data, error } = await supabase
        .from('shops')
        .select('*')
        .eq('id', shopId)
        .single();

    if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        throw error;
    }

    return {
        id: data.id,
        shopName: data.shop_name,
        gstNumber: data.gst_number,
        panNumber: data.pan_number,
        address: data.address,
        state: data.state,
        pincode: data.pincode,
        phoneNumber: data.phone_number,
        email: data.email,
        logoUrl: data.logo_url,
        templateId: data.template_id,
        cgstRate: data.cgst_rate,
        sgstRate: data.sgst_rate,
        isActive: data.is_active,
        createdBy: data.created_by,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
    } as Shop;
}

export async function getUserRoleForShop(userId: string, shopId: string) {
    const { data, error } = await supabase
        .from('user_shop_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('shop_id', shopId)
        .eq('is_active', true)
        .maybeSingle();

    if (error) throw error;
    return data?.role || null;
}

export async function updateLastActiveShop(userId: string, shopId: string) {
    const { error } = await supabase
        .from('user_preferences')
        .update({ last_active_shop_id: shopId })
        .eq('user_id', userId);

    if (error) throw error;
}

export async function getLastActiveShop(userId: string): Promise<string | null> {
    const { data, error } = await supabase
        .from('user_preferences')
        .select('last_active_shop_id')
        .eq('user_id', userId)
        .maybeSingle();

    if (error) throw error;
    return data?.last_active_shop_id || null;
}

export async function getUserPreferences(userId: string) {
    const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

    if (error) throw error;
    return data;
}

export async function updateShop(shopId: string, updates: Partial<Shop>) {
    const updateData: any = {};

    if (updates.shopName !== undefined) updateData.shop_name = updates.shopName;
    if (updates.gstNumber !== undefined) updateData.gst_number = updates.gstNumber;
    if (updates.panNumber !== undefined) updateData.pan_number = updates.panNumber;
    if (updates.address !== undefined) updateData.address = updates.address;
    if (updates.state !== undefined) updateData.state = updates.state;
    if (updates.pincode !== undefined) updateData.pincode = updates.pincode;
    if (updates.phoneNumber !== undefined) updateData.phone_number = updates.phoneNumber;
    if (updates.email !== undefined) updateData.email = updates.email;
    if (updates.logoUrl !== undefined) updateData.logo_url = updates.logoUrl;
    if (updates.templateId !== undefined) updateData.template_id = updates.templateId;
    if (updates.cgstRate !== undefined) updateData.cgst_rate = updates.cgstRate;
    if (updates.sgstRate !== undefined) updateData.sgst_rate = updates.sgstRate;
    if (updates.isActive !== undefined) updateData.is_active = updates.isActive;

    const { error } = await supabase
        .from('shops')
        .update(updateData)
        .eq('id', shopId);

    if (error) throw error;
}
