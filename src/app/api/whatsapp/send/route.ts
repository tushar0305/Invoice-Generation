import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/supabase/server';
import { decryptToken, sendTemplateMessage } from '@/lib/whatsapp/client';

// POST - Send WhatsApp message
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { shopId, templateName, phoneNumber, variables, customerId } = body;

        if (!shopId || !templateName || !phoneNumber) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
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

        // Get WhatsApp config
        const { data: config, error: configError } = await supabase
            .from('whatsapp_configs')
            .select('*')
            .eq('shop_id', shopId)
            .single();

        if (configError || !config) {
            return NextResponse.json({ error: 'WhatsApp not configured' }, { status: 400 });
        }

        if (config.status !== 'connected') {
            return NextResponse.json({ error: 'WhatsApp connection not active' }, { status: 400 });
        }

        // Decrypt token
        const accessToken = decryptToken(config.access_token_encrypted);

        // Get template for language
        const { data: template } = await supabase
            .from('whatsapp_templates')
            .select('language')
            .eq('shop_id', shopId)
            .eq('name', templateName)
            .single();

        // Send message
        const result = await sendTemplateMessage(
            config.phone_number_id,
            accessToken,
            phoneNumber,
            templateName,
            template?.language || 'en',
            variables || []
        );

        // Log message
        await supabase.from('whatsapp_messages').insert({
            shop_id: shopId,
            customer_id: customerId || null,
            phone_number: phoneNumber,
            variables: variables ? { values: variables } : null,
            meta_message_id: result.messageId || null,
            status: result.success ? 'sent' : 'failed',
            error_message: result.error || null,
        });

        if (result.success) {
            return NextResponse.json({
                success: true,
                messageId: result.messageId,
                message: 'Message sent successfully'
            });
        } else {
            return NextResponse.json({
                success: false,
                error: result.error
            }, { status: 400 });
        }
    } catch (error: any) {
        console.error('WhatsApp send error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
