import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/supabase/server';
import { encryptToken, decryptToken, testConnection } from '@/lib/whatsapp/client';

// GET - Fetch WhatsApp config for a shop
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

        // Check user has access to shop
        const { data: role } = await supabase
            .from('user_shop_roles')
            .select('role')
            .eq('user_id', user.id)
            .eq('shop_id', shopId)
            .single();

        if (!role) {
            return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }

        // Fetch config (without token)
        const { data: config, error } = await supabase
            .from('whatsapp_configs')
            .select('id, phone_number, waba_id, phone_number_id, display_name, status, created_at, updated_at')
            .eq('shop_id', shopId)
            .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows
            throw error;
        }

        return NextResponse.json({ config: config || null });
    } catch (error: any) {
        console.error('WhatsApp config GET error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST - Save or update WhatsApp config
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        let { shopId, phone_number, waba_id, phone_number_id, access_token, display_name } = body;

        // For testing mode, allow dummy values
        if (body.skip_validation) {
            phone_number = phone_number || '+91 0000000000';
            waba_id = waba_id || 'test_waba_id';
            phone_number_id = phone_number_id || 'test_phone_id';
            access_token = access_token || 'test_token';
        }

        if (!shopId || !phone_number || !waba_id || !phone_number_id || !access_token) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Check user is owner
        const { data: role } = await supabase
            .from('user_shop_roles')
            .select('role')
            .eq('user_id', user.id)
            .eq('shop_id', shopId)
            .single();

        if (!role || role.role !== 'owner') {
            return NextResponse.json({ error: 'Only shop owners can configure WhatsApp' }, { status: 403 });
        }

        // Skip connection test if skip_validation flag is set (for UI testing)
        let finalDisplayName = display_name;
        if (!body.skip_validation) {
            const connectionResult = await testConnection(phone_number_id, access_token);
            if (!connectionResult.success) {
                return NextResponse.json({
                    error: 'Connection test failed',
                    details: connectionResult.error
                }, { status: 400 });
            }
            finalDisplayName = display_name || connectionResult.displayName;
        }

        // Encrypt token
        const encryptedToken = encryptToken(access_token);

        // Upsert config
        const { data: config, error } = await supabase
            .from('whatsapp_configs')
            .upsert({
                shop_id: shopId,
                phone_number,
                waba_id,
                phone_number_id,
                access_token_encrypted: encryptedToken,
                display_name: finalDisplayName || 'WhatsApp Business',
                status: 'connected',
                updated_at: new Date().toISOString(),
            }, { onConflict: 'shop_id' })
            .select('id, phone_number, display_name, status')
            .single();

        if (error) throw error;

        return NextResponse.json({
            success: true,
            config,
            message: 'WhatsApp connected successfully'
        });
    } catch (error: any) {
        console.error('WhatsApp config POST error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE - Disconnect WhatsApp
export async function DELETE(request: NextRequest) {
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

        // Check user is owner
        const { data: role } = await supabase
            .from('user_shop_roles')
            .select('role')
            .eq('user_id', user.id)
            .eq('shop_id', shopId)
            .single();

        if (!role || role.role !== 'owner') {
            return NextResponse.json({ error: 'Only owners can disconnect WhatsApp' }, { status: 403 });
        }

        const { error } = await supabase
            .from('whatsapp_configs')
            .delete()
            .eq('shop_id', shopId);

        if (error) throw error;

        return NextResponse.json({ success: true, message: 'WhatsApp disconnected' });
    } catch (error: any) {
        console.error('WhatsApp config DELETE error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
