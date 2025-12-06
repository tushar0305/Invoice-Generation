import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import {
    getShopBySlug,
    getPublicProducts,
    getCatalogueCategories,
    incrementView
} from '@/actions/catalogue-actions';
import { StoreClient } from './store-client';

export const dynamic = 'force-dynamic';

interface Props {
    params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    const shop = await getShopBySlug(slug);

    if (!shop) return { title: 'Store Not Found' };

    return {
        title: `${shop.shop_display_name} | Digital Catalogue`,
        description: shop.about_text || `Browse latest collection from ${shop.shop_display_name}`,
    };
}

export default async function StorePage({ params }: Props) {
    const { slug } = await params;
    const shop = await getShopBySlug(slug);

    if (!shop) notFound();

    // Parallel fetch for speed
    const [products, categories] = await Promise.all([
        getPublicProducts(shop.shop_id),
        getCatalogueCategories(shop.shop_id)
    ]);

    // Track View (non-blocking)
    incrementView(shop.shop_id, 'page_view').catch(console.error);

    return (
        <StoreClient
            shop={shop}
            initialProducts={products}
            categories={categories}
        />
    );
}
