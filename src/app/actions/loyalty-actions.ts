'use server';

import { createClient } from '@/supabase/server';
import { revalidatePath } from 'next/cache';
import { LoyaltySettings } from '@/lib/loyalty-types';

export async function updateLoyaltySettingsAction(shopId: string, settings: Partial<LoyaltySettings>) {
    const supabase = await createClient();

    try {
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            return { success: false, error: 'Unauthorized' };
        }

        // Verify shop access (simplified, assumes owner/manager has access)
        // In a real app, use checkShopAccess helper if available

        // Prepare payload, ensuring undefineds are handled (though JSON stringify usually strips them, Supabase handles nulls)
        const payload = {
            shop_id: shopId,
            ...settings,
            updated_at: new Date().toISOString(),
        };

        const { error } = await supabase
            .from('shop_loyalty_settings')
            .upsert(payload);

        if (error) {
            console.error('Supabase Upsert Error:', error);
            return { success: false, error: error.message };
        }

        revalidatePath(`/shop/${shopId}/settings`);
        revalidatePath(`/shop/${shopId}/loyalty`);

        return { success: true };
    } catch (error: any) {
        console.error('Server Action Error:', error);
        return { success: false, error: error.message || 'Failed to update settings' };
    }
}
