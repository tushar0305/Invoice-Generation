import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/supabase/server';

// POST - Seed mock templates for testing
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { shopId } = body;

        if (!shopId) {
            return NextResponse.json({ error: 'Shop ID required' }, { status: 400 });
        }

        // Check user has access
        const { data: role } = await supabase
            .from('user_shop_roles')
            .select('role')
            .eq('user_id', user.id)
            .eq('shop_id', shopId)
            .single();

        if (!role) {
            return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }

        // Mock templates for testing
        const mockTemplates = [
            {
                shop_id: shopId,
                name: 'festival_offer',
                category: 'MARKETING',
                language: 'en',
                body: 'Hello {{1}}! 🎉 Celebrate this festive season with exclusive offers at our store. Get up to 20% OFF on gold jewellery. Visit us today!',
                header_text: '✨ Festival Special Offer!',
                footer: 'Reply STOP to unsubscribe',
                status: 'APPROVED',
                meta_template_id: 'mock_festival_123',
            },
            {
                shop_id: shopId,
                name: 'payment_reminder',
                category: 'UTILITY',
                language: 'en',
                body: 'Hi {{1}}, this is a friendly reminder that your payment of ₹{{2}} is pending. Please visit our store or contact us for any queries.',
                header_text: '💳 Payment Reminder',
                footer: null,
                status: 'APPROVED',
                meta_template_id: 'mock_payment_456',
            },
            {
                shop_id: shopId,
                name: 'new_arrival',
                category: 'MARKETING',
                language: 'en',
                body: 'Dear {{1}}, we have exciting new arrivals in our collection! Be the first to explore our latest designs. Visit us today! 💎',
                header_text: '🆕 New Arrivals',
                footer: 'Reply STOP to unsubscribe',
                status: 'APPROVED',
                meta_template_id: 'mock_arrival_789',
            },
            {
                shop_id: shopId,
                name: 'thank_you',
                category: 'UTILITY',
                language: 'en',
                body: 'Thank you {{1}} for your purchase! We hope you love your new jewellery. Looking forward to serving you again. 🙏',
                header_text: '🙏 Thank You!',
                footer: null,
                status: 'APPROVED',
                meta_template_id: 'mock_thanks_101',
            },
        ];

        // Insert templates (upsert to avoid duplicates)
        const { data: inserted, error } = await supabase
            .from('whatsapp_templates')
            .upsert(mockTemplates, {
                onConflict: 'shop_id,name',
                ignoreDuplicates: false
            })
            .select();

        if (error) throw error;

        return NextResponse.json({
            success: true,
            count: inserted?.length || mockTemplates.length,
            message: `Added ${mockTemplates.length} mock templates for testing`,
            templates: inserted,
        });
    } catch (error: any) {
        console.error('Seed templates error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
