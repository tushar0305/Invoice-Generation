
import { createClient } from '@/supabase/server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const shopId = searchParams.get('shopId');
    const query = searchParams.get('q') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');

    if (!shopId) {
        return NextResponse.json({ error: 'Shop ID is required' }, { status: 400 });
    }

    const supabase = await createClient();
    const offset = (page - 1) * pageSize;

    try {
        const [dataResult, countResult] = await Promise.all([
            supabase.rpc('search_customers', {
                p_shop_id: shopId,
                p_query: query,
                p_limit: pageSize,
                p_offset: offset
            }),
            supabase.rpc('search_customers_count', {
                p_shop_id: shopId,
                p_query: query
            })
        ]);

        if (dataResult.error) throw dataResult.error;
        if (countResult.error) throw countResult.error;

        return NextResponse.json({
            data: dataResult.data,
            meta: {
                total: countResult.data,
                page,
                pageSize,
                totalPages: Math.ceil(countResult.data / pageSize)
            }
        });
    } catch (error: any) {
        console.error('Search API Error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to search customers' },
            { status: 500 }
        );
    }
}
