import { supabase } from '@/supabase/client';
import type { Customer } from '@/lib/definitions';

export async function getCustomers(shopId: string, limit = 100, offset = 0) {
    const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('shop_id', shopId)
        .is('deleted_at', null)
        .order('updated_at', { ascending: false })
        .range(offset, offset + limit - 1);

    if (error) {
        console.error('Error fetching customers:', error);
        return [];
    }

    return data.map(mapCustomer);
}

export async function searchCustomers(shopId: string, query: string, limit = 50) {
    if (!query.trim()) {
        return getCustomers(shopId, limit);
    }

    const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('shop_id', shopId)
        .is('deleted_at', null)
        .or(`name.ilike.%${query}%,phone.ilike.%${query}%`)
        .order('name', { ascending: true })
        .limit(limit);

    if (error) {
        console.error('Error searching customers:', error);
        return [];
    }

    return data.map(mapCustomer);
}

// Check if phone number already exists for a shop
export async function checkPhoneExists(shopId: string, phone: string, excludeCustomerId?: string): Promise<boolean> {
    let query = supabase
        .from('customers')
        .select('id')
        .eq('shop_id', shopId)
        .eq('phone', phone)
        .is('deleted_at', null);

    if (excludeCustomerId) {
        query = query.neq('id', excludeCustomerId);
    }

    const { data } = await query.maybeSingle();
    return !!data;
}

// Get total customer count for pagination
export async function getCustomerCount(shopId: string): Promise<number> {
    const { count, error } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true })
        .eq('shop_id', shopId)
        .is('deleted_at', null);

    if (error) {
        console.error('Error getting customer count:', error);
        return 0;
    }

    return count || 0;
}

// Helper to map DB row to Customer type
function mapCustomer(c: any): Customer {
    return {
        id: c.id,
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
        notes: c.notes,
        tags: c.tags,
        createdAt: c.created_at,
        updatedAt: c.updated_at,
    };
}
