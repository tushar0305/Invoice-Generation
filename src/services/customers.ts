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
        if (process.env.NODE_ENV === 'development') {
            console.error('Error fetching customers:', error);
        }
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
        if (process.env.NODE_ENV === 'development') {
            console.error('Error searching customers:', error);
        }
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
        if (process.env.NODE_ENV === 'development') {
            console.error('Error getting customer count:', error);
        }
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

export async function upsertCustomer(
    shopId: string,
    data: {
        name: string;
        phone: string;
        address?: string;
        state?: string;
        pincode?: string;
        email?: string;
        gstNumber?: string;
    }
): Promise<string | null> {
    try {
        // Atomic Upsert based on (shop_id, phone) constraint
        // Note: You must have a unique constraint on (shop_id, phone) for this to work atomically
        const { data: result, error } = await supabase
            .from('customers')
            .upsert(
                {
                    shop_id: shopId,
                    phone: data.phone,
                    name: data.name,
                    address: data.address,
                    state: data.state,
                    pincode: data.pincode,
                    email: data.email,
                    gst_number: data.gstNumber,
                    updated_at: new Date().toISOString(),
                },
                {
                    onConflict: 'shop_id, phone',
                    ignoreDuplicates: false,
                }
            )
            .select('id')
            .single();

        if (error) {
            if (process.env.NODE_ENV === 'development') {
                console.error('Error upserting customer:', error);
            }
            throw error;
        }

        return result?.id || null;
    } catch (err) {
        // Fallback for cases where constraint might not match exactly or other DB errors
        if (process.env.NODE_ENV === 'development') {
            console.error('Upsert failed, trying sequential logic:', err);
        }

        // Fallback manual check (less safe but better than crashing if upsert fails due to missing constraint)
        const { data: existing } = await supabase
            .from('customers')
            .select('id')
            .eq('shop_id', shopId)
            .eq('phone', data.phone)
            .maybeSingle();

        if (existing) {
            await supabase.from('customers').update({
                name: data.name,
                address: data.address,
                state: data.state,
                pincode: data.pincode,
                email: data.email,
            }).eq('id', existing.id);
            return existing.id;
        } else {
            const { data: newC } = await supabase.from('customers').insert({
                shop_id: shopId,
                phone: data.phone,
                name: data.name,
                address: data.address,
                state: data.state,
                pincode: data.pincode,
                email: data.email,
            }).select('id').single();
            return newC?.id || null;
        }
    }
}
