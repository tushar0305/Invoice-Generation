import { supabase } from '@/supabase/client';
import { InventoryItem } from '@/lib/inventory-types';

export async function getInventoryItems(shopId: string, limit: number = 50): Promise<InventoryItem[]> {
    const { data, error } = await supabase
        .from('inventory_items')
        .select('*')
        .eq('shop_id', shopId)
        .eq('status', 'IN_STOCK')
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) {
        console.error('Error fetching inventory items:', error);
        return [];
    }

    return (data || []) as unknown as InventoryItem[];
}
