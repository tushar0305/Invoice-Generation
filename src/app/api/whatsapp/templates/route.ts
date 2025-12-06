import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/supabase/server';
import { decryptToken, fetchTemplates } from '@/lib/whatsapp/client';

// GET - List templates from database
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const shopId = request.nextUrl.searchParams.get('shopId');
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

        const { data: templates, error } = await supabase
            .from('whatsapp_templates')
            .select('*')
            .eq('shop_id', shopId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        return NextResponse.json({ templates: templates || [] });
    } catch (error: any) {
        console.error('Templates GET error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST - Sync templates from Meta API
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { shopId, action } = body;

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

        // SYNC action - fetch from Meta and update database
        if (action === 'sync') {
            // Get config
            const { data: config, error: configError } = await supabase
                .from('whatsapp_configs')
                .select('*')
                .eq('shop_id', shopId)
                .single();

            if (configError || !config || config.status !== 'connected') {
                return NextResponse.json({ error: 'WhatsApp not connected' }, { status: 400 });
            }

            // Fetch templates from Meta
            const accessToken = decryptToken(config.access_token_encrypted);
            const { templates: metaTemplates, error: fetchError } = await fetchTemplates(
                config.waba_id,
                accessToken
            );

            if (fetchError) {
                return NextResponse.json({ error: fetchError }, { status: 400 });
            }

            // Upsert templates
            let synced = 0;
            for (const mt of metaTemplates) {
                const bodyComponent = mt.components?.find((c: any) => c.type === 'BODY');
                const headerComponent = mt.components?.find((c: any) => c.type === 'HEADER');
                const footerComponent = mt.components?.find((c: any) => c.type === 'FOOTER');
                const buttonsComponent = mt.components?.find((c: any) => c.type === 'BUTTONS');

                await supabase
                    .from('whatsapp_templates')
                    .upsert({
                        shop_id: shopId,
                        name: mt.name,
                        category: mt.category || 'MARKETING',
                        language: mt.language || 'en',
                        body: bodyComponent?.text || '',
                        header_text: headerComponent?.text || null,
                        footer: footerComponent?.text || null,
                        buttons: buttonsComponent?.buttons || null,
                        meta_template_id: mt.id,
                        status: mt.status || 'PENDING',
                    }, { onConflict: 'shop_id,name' });

                synced++;
            }

            return NextResponse.json({
                success: true,
                synced,
                message: `Synced ${synced} templates from Meta`
            });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (error: any) {
        console.error('Templates POST error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
