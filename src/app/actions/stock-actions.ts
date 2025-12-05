'use server';

import { createClient } from '@/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const stockItemSchema = z.object({
    name: z.string().trim().min(1, 'Item name is required'),
    description: z.string().trim().optional().nullable(),
    purity: z.string().trim().min(1, 'Purity is required'),
    basePrice: z.coerce.number().min(0).default(0),
    // baseWeight removed
    makingChargePerGram: z.coerce.number().min(0).default(0),
    quantity: z.coerce.number().min(0).default(0),
    unit: z.string().trim().min(1, 'Unit is required'),
    category: z.string().trim().optional().nullable(),
    isActive: z.boolean().default(true),
    shopId: z.string().uuid(),
    userId: z.string(),
});

export async function createStockItemAction(data: z.infer<typeof stockItemSchema>) {
    const supabase = await createClient();

    try {
        const validated = stockItemSchema.parse(data);

        const { error } = await supabase.from('stock_items').insert({
            shop_id: validated.shopId,
            // created_by: validated.userId, // Not in schema, or handled by default? Schema has no created_by column in stock_items? Wait, let me check schema again.
            // Schema has deleted_by but not created_by? Let me check.
            // Schema: created_at, updated_at, deleted_at, deleted_by. No created_by.
            name: validated.name,
            description: validated.description,
            purity: validated.purity,
            base_price: validated.basePrice,
            // base_weight: validated.baseWeight, // Removed
            making_charge_per_gram: validated.makingChargePerGram,
            quantity: validated.quantity,
            unit: validated.unit,
            category: validated.category,
            is_active: validated.isActive,
        });

        if (error) throw error;

        revalidatePath(`/shop/${validated.shopId}/stock`);
        return { success: true };
    } catch (error: any) {
        console.error('Create stock item error:', error);
        return { success: false, error: error.message };
    }
}

export async function updateStockItemAction(id: string, data: z.infer<typeof stockItemSchema>) {
    const supabase = await createClient();

    try {
        const validated = stockItemSchema.parse(data);

        const { error } = await supabase
            .from('stock_items')
            .update({
                // updated_by: validated.userId, // Removed
                name: validated.name,
                description: validated.description,
                purity: validated.purity,
                base_price: validated.basePrice,
                // base_weight: validated.baseWeight, // Removed
                making_charge_per_gram: validated.makingChargePerGram,
                quantity: validated.quantity,
                unit: validated.unit,
                category: validated.category,
                is_active: validated.isActive,
                updated_at: new Date().toISOString(),
            })
            .eq('id', id)
            .eq('shop_id', validated.shopId);

        if (error) throw error;

        revalidatePath(`/shop/${validated.shopId}/stock`);
        return { success: true };
    } catch (error: any) {
        console.error('Update stock item error:', error);
        return { success: false, error: error.message };
    }
}
