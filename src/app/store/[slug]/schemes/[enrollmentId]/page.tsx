import { createClient } from '@/supabase/server';
import { notFound } from 'next/navigation';
import { DigitalPassbook } from '@/components/schemes/digital-passbook';
import { Metadata } from 'next';

interface PageProps {
    params: {
        slug: string;
        enrollmentId: string;
    };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    return {
        title: 'My Gold Passbook',
        description: 'Track your gold savings scheme progress.',
    };
}

export default async function SchemePassbookPage({ params }: PageProps) {
    const supabase = await createClient();
    const { slug, enrollmentId } = params;

    // 1. Get Shop by Slug
    const { data: shop } = await supabase
        .from('catalogue_settings')
        .select('shop_id, shop_display_name, logo_url')
        .eq('public_slug', slug)
        .single();

    if (!shop) return notFound();

    // 2. Get Enrollment with Scheme Details
    const { data: enrollment } = await supabase
        .from('scheme_enrollments')
        .select(`
            *,
            scheme:schemes(*)
        `)
        .eq('id', enrollmentId)
        .eq('shop_id', shop.shop_id)
        .single();

    if (!enrollment) return notFound();

    // 3. Get Transactions
    const { data: transactions } = await supabase
        .from('scheme_transactions')
        .select('*')
        .eq('enrollment_id', enrollmentId)
        .order('payment_date', { ascending: false });

    return (
        <DigitalPassbook
            enrollment={enrollment as any}
            transactions={transactions || []}
            shopName={shop.shop_display_name}
            shopLogo={shop.logo_url}
        />
    );
}
