'use server';

import { createClient } from '@/supabase/server';
import { revalidatePath } from 'next/cache';

export async function updateShopUpiId(shopId: string, upiId: string) {
    const supabase = await createClient();

    const { error } = await supabase
        .from('shops')
        .update({ upi_id: upiId })
        .eq('id', shopId);

    if (error) {
        console.error('Error updating UPI ID:', error);
        throw new Error('Failed to update UPI ID');
    }

    revalidatePath(`/shop/${shopId}`);
}

export async function getShopUpiId(shopId: string) {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('shops')
        .select('upi_id')
        .eq('id', shopId)
        .single();

    if (error) {
        console.error('Error fetching UPI ID:', error);
        return null;
    }

    return data.upi_id;
}
