import { supabase } from '@/supabase/client';
import type { Customer } from '@/lib/definitions';

export async function getCustomers(shopId: string, limit = 100) {
    const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('shop_id', shopId)
        .order('updated_at', { ascending: false })
        .limit(limit);

    if (error) {
        console.error('Error fetching customers:', error);
        return [];
    }

    return data.map((c: any) => ({
        id: c.id,
        userId: c.user_id,
        shopId: c.shop_id,
        name: c.name,
        email: c.email,
        phone: c.phone,
        address: c.address,
        state: c.state,
        pincode: c.pincode,
        gstNumber: c.gst_number,
        loyaltyPoints: c.loyalty_points || 0,
        totalSpent: c.total_spent || 0,
        lastVisitAt: c.last_visit_at,
        notes: c.notes,
        tags: c.tags,
        createdAt: c.created_at,
        updatedAt: c.updated_at,
    }));
}

export async function searchCustomers(shopId: string, query: string) {
    const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('shop_id', shopId)
        .ilike('name', `%${query}%`)
        .limit(20);

    if (error) {
        console.error('Error searching customers:', error);
        return [];
    }

    return data.map((c: any) => ({
        id: c.id,
        userId: c.user_id,
        shopId: c.shop_id,
        name: c.name,
        email: c.email,
        phone: c.phone,
        address: c.address,
        state: c.state,
        pincode: c.pincode,
        gstNumber: c.gst_number,
        loyaltyPoints: c.loyalty_points || 0,
        totalSpent: c.total_spent || 0,
        lastVisitAt: c.last_visit_at,
        notes: c.notes,
        tags: c.tags,
        createdAt: c.created_at,
        updatedAt: c.updated_at,
    }));
}
