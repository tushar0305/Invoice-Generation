
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import {
    getCatalogueSettings, // Use this instead of getShopBySlug
    getPublicProducts,
    getCatalogueCategories,
    incrementView
} from '@/actions/catalogue-actions';
// Import StoreClient from the existing store implementation
// We need to import it using relative path or alias. 
// Since StoreClient is default export or named? It's named export.
// It is located at src/app/store/[slug]/store-client.tsx
import { StoreClient } from '@/app/store/[slug]/store-client';

export const dynamic = 'force-dynamic';

interface Props {
    params: Promise<{ shopId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { shopId } = await params;
    const shop = await getCatalogueSettings(shopId);

    if (!shop || !shop.is_active) return { title: 'Catalogue Not Found' };

    return {
        title: `${shop.shop_display_name} | Digital Catalogue`,
        description: shop.about_text || `Browse latest collection from ${shop.shop_display_name}`,
    };
}

export default async function CatalogueByIdPage({ params }: Props) {
    const { shopId } = await params;
    const shop = await getCatalogueSettings(shopId);

    if (!shop || !shop.is_active) notFound();

    // Parallel fetch for speed
    const [products, categories] = await Promise.all([
        getPublicProducts(shopId),
        getCatalogueCategories(shopId)
    ]);

    // Track View (non-blocking)
    incrementView(shopId, 'page_view').catch(console.error);

    return (
        <StoreClient
            shop={shop}
            initialProducts={products}
            categories={categories}
        />
    );
}
