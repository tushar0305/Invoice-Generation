import { Suspense } from 'react';
import { createClient } from '@/supabase/server';
import { redirect } from 'next/navigation';
import { CatalogueClient } from './client';
import { getCatalogueStats } from '@/actions/catalogue-actions';

export const dynamic = 'force-dynamic';

interface Props {
    params: Promise<{ shopId: string }>;
}

export default async function CataloguePage({ params }: Props) {
    const { shopId } = await params;
    const supabase = await createClient();

    // Check auth
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/login');

    // Check shop access
    const { data: role } = await supabase
        .from('user_shop_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('shop_id', shopId)
        .single();

    if (!role) redirect('/');

    // Get Settings & Stats
    const settingsPromise = supabase
        .from('catalogue_settings')
        .select('*')
        .eq('shop_id', shopId)
        .single();

    const statsPromise = getCatalogueStats(shopId);

    const [{ data: settings }, stats] = await Promise.all([
        settingsPromise,
        statsPromise
    ]);

    return (
        <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
            <CatalogueClient
                shopId={shopId}
                initialSettings={settings}
                isOwner={role.role === 'owner'}
                stats={stats}
            />
        </Suspense>
    );
}
