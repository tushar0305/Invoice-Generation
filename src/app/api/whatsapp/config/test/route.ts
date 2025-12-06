import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/supabase/server';
import { testConnection } from '@/lib/whatsapp/client';

// POST - Test WhatsApp connection without saving
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { phone_number_id, access_token } = body;

        if (!phone_number_id || !access_token) {
            return NextResponse.json({ error: 'Phone Number ID and Access Token required' }, { status: 400 });
        }

        // Test connection
        const result = await testConnection(phone_number_id, access_token);

        if (result.success) {
            return NextResponse.json({
                success: true,
                display_name: result.displayName,
                message: 'Connection successful!',
            });
        } else {
            return NextResponse.json({
                success: false,
                error: result.error,
            }, { status: 400 });
        }
    } catch (error: any) {
        console.error('WhatsApp test connection error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
