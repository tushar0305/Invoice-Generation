'use server';

import { createClient } from '@/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

// Types
export interface CatalogueSettings {
    id: string;
    shop_id: string;
    public_slug: string;
    shop_display_name: string;
    about_text: string | null;
    primary_color: string;
    contact_phone: string | null;
    is_active: boolean;
    logo_url: string | null;
    banner_url: string | null;
    template_id: string; // 'basic' | 'modern' | 'premium'
}

// Validation Schema
const SettingsSchema = z.object({
    public_slug: z.string()
        .min(3, 'Slug must be at least 3 characters')
        .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'),
    shop_display_name: z.string().min(1, 'Display name is required'),
    about_text: z.string().optional(),
    primary_color: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Invalid color code'),
    contact_phone: z.string().min(10, 'Valid phone number required'),
    is_active: z.boolean(),
    template_id: z.enum(['basic', 'modern', 'premium']).default('basic'),
});

// Check if slug is available
export async function checkSlugAvailability(slug: string, currentShopId?: string) {
    const supabase = await createClient();

    let query = supabase
        .from('catalogue_settings')
        .select('shop_id')
        .eq('public_slug', slug);

    if (currentShopId) {
        query = query.neq('shop_id', currentShopId);
    }

    const { data } = await query.single();
    return !data; // True if available (no record found)
}

// Get Settings
export async function getCatalogueSettings(shopId: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('catalogue_settings')
        .select('*')
        .eq('shop_id', shopId)
        .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data as CatalogueSettings | null;
}

// Save Settings
export async function saveCatalogueSettings(shopId: string, formData: any) {
    const supabase = await createClient();

    // Sanitize slug (lowercase, replace spaces with hyphens, remove special chars)
    if (formData.public_slug) {
        formData.public_slug = formData.public_slug
            .toLowerCase()
            .trim()
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-]/g, '');
    }

    // Validate
    const validated = SettingsSchema.safeParse(formData);
    if (!validated.success) {
        return { success: false, error: validated.error.errors[0].message };
    }

    // Check slug uniqueness
    const isAvailable = await checkSlugAvailability(validated.data.public_slug, shopId);
    if (!isAvailable) {
        return { success: false, error: 'This URL is already taken. Please choose another.' };
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Unauthorized' };

    // Update or Insert
    const { error } = await supabase
        .from('catalogue_settings')
        .upsert({
            shop_id: shopId,
            ...validated.data,
            updated_at: new Date().toISOString(),
        }, { onConflict: 'shop_id' });

    if (error) {
        console.error('Save settings error:', error);
        return { success: false, error: 'Failed to save settings' };
    }

    revalidatePath(`/shop/${shopId}/catalogue`);
    return { success: true };
}

// ==========================================
// CATEGORIES
// ==========================================

export async function getCatalogueCategories(shopId: string) {
    const supabase = await createClient();
    const { data } = await supabase
        .from('catalogue_categories')
        .select('*')
        .eq('shop_id', shopId)
        .eq('is_active', true)
        .order('display_order', { ascending: true });
    return data || [];
}

export async function saveCatalogueCategory(shopId: string, name: string) {
    const supabase = await createClient();
    const slug = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');

    const { error } = await supabase.from('catalogue_categories').upsert({
        shop_id: shopId,
        name,
        slug,
        is_active: true
    }, { onConflict: 'shop_id,slug' });

    if (error) return { success: false, error: error.message };
    revalidatePath(`/shop/${shopId}/catalogue`);
    return { success: true };
}

export async function deleteCatalogueCategory(id: string, shopId: string) {
    const supabase = await createClient();
    const { error } = await supabase.from('catalogue_categories').update({ is_active: false }).eq('id', id).eq('shop_id', shopId);
    if (error) return { success: false, error: error.message };
    revalidatePath(`/shop/${shopId}/catalogue`);
    return { success: true };
}

// ==========================================
// PRODUCTS
// ==========================================

export async function getCatalogueProducts(shopId: string) {
    const supabase = await createClient();
    const { data } = await supabase
        .from('catalogue_products')
        .select(`
            *,
            category:catalogue_categories(name)
        `)
        .eq('shop_id', shopId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });
    return data || [];
}

const ProductSchema = z.object({
    id: z.string().optional(),
    name: z.string().min(1, 'Name is required'),
    category_id: z.string().optional().nullable(),
    price: z.coerce.number().min(0),
    weight_g: z.coerce.number().min(0).optional(),
    purity: z.string().optional(),
    description: z.string().optional(),
    images: z.array(z.string()).optional(),
    is_featured: z.boolean().optional(),
});

export async function saveCatalogueProduct(shopId: string, formData: any) {
    const supabase = await createClient();

    // Sanitize UUIDs
    if (formData.category_id === '') formData.category_id = null;
    if (formData.id === '') delete formData.id;

    const validated = ProductSchema.safeParse(formData);

    if (!validated.success) {
        return { success: false, error: validated.error.errors[0].message };
    }

    const { error } = await supabase.from('catalogue_products').upsert({
        shop_id: shopId,
        ...validated.data,
        updated_at: new Date().toISOString(),
        is_active: true
    });

    revalidatePath(`/shop/${shopId}/catalogue`);
    return { success: true };
}

export async function deleteCatalogueProduct(id: string, shopId: string) {
    const supabase = await createClient();
    const { error } = await supabase.from('catalogue_products').update({ is_active: false }).eq('id', id).eq('shop_id', shopId);
    if (error) return { success: false, error: error.message };
    revalidatePath(`/shop/${shopId}/catalogue`);
    return { success: true };
}

// ==========================================
// PUBLIC STOREFRONT
// ==========================================

export async function getShopBySlug(slug: string) {
    const supabase = await createClient();
    const { data } = await supabase
        .from('catalogue_settings')
        .select('*')
        .eq('public_slug', slug)
        .eq('is_active', true)
        .single();

    return data as CatalogueSettings | null;
}

export async function getPublicProducts(shopId: string, categoryId?: string) {
    const supabase = await createClient();
    let query = supabase
        .from('catalogue_products')
        .select(`
            *,
            category:catalogue_categories(name, slug)
        `)
        .eq('shop_id', shopId)
        .eq('is_active', true)
        .order('is_featured', { ascending: false })
        .order('created_at', { ascending: false });

    if (categoryId && categoryId !== 'all') {
        query = query.eq('category_id', categoryId);
    }

    const { data } = await query;
    return data || [];
}

export async function incrementView(shopId: string, type: 'page_view' | 'product_view' | 'whatsapp_click', metadata: any = {}) {
    // Use service role key to bypass RLS for public analytics
    const supabase = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    await supabase.from('catalogue_analytics').insert({
        shop_id: shopId,
        view_type: type,
        product_id: metadata?.product_id || null
    });
}

export async function getCatalogueStats(shopId: string) {
    const supabase = await createClient();

    // Get stats for last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // We can do this with a single query using RPC or multiple count queries. 
    // For simplicity/speed without custom RPC, we'll do 3 count queries in parallel.
    // Supabase JS doesn't support "COUNT(*) FILTER" directly in one go easily without view/RPC.

    const [pageViews, leadClicks, productViews] = await Promise.all([
        supabase.from('catalogue_analytics')
            .select('*', { count: 'exact', head: true })
            .eq('shop_id', shopId)
            .eq('view_type', 'page_view')
            .gte('created_at', thirtyDaysAgo.toISOString()),

        supabase.from('catalogue_analytics')
            .select('*', { count: 'exact', head: true })
            .eq('shop_id', shopId)
            .eq('view_type', 'whatsapp_click')
            .gte('created_at', thirtyDaysAgo.toISOString()),

        supabase.from('catalogue_analytics')
            .select('*', { count: 'exact', head: true })
            .eq('shop_id', shopId)
            .eq('view_type', 'product_view')
            .gte('created_at', thirtyDaysAgo.toISOString())
    ]);

    return {
        page_views: pageViews.count || 0,
        leads: leadClicks.count || 0,
        product_views: productViews.count || 0
    };
}

