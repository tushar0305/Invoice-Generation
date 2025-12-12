import { createClient } from '@/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
    const supabase = await createClient();

    // 1. Get User
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Not logged in' }, { status: 401 });

    // 2. Get First Shop
    const { data: role } = await supabase.from('user_shop_roles').select('shop_id').eq('user_id', user.id).limit(1).single();
    if (!role) return NextResponse.json({ error: 'No shop found' }, { status: 404 });
    const shopId = role.shop_id;

    // 3. Get Usage Before
    const { data: usageBefore } = await supabase.from('shop_usage_limits').select('customers_added').eq('shop_id', shopId).order('updated_at', { ascending: false }).limit(1).single();

    // 4. Create Dummy Customer to Trigger Event
    const dummyPhone = `+91999${Math.floor(100000 + Math.random() * 900000)}`;
    const { data: newCust, error: insertError } = await supabase.from('customers').insert({
        shop_id: shopId,
        name: 'Debug Test Customer',
        phone: dummyPhone,
        address: 'Debug Address',
        loyalty_points: 0
    }).select().single();

    if (insertError) return NextResponse.json({ error: 'Failed to create customer', details: insertError }, { status: 500 });

    // 5. Get Usage After
    const { data: usageAfter } = await supabase.from('shop_usage_limits').select('customers_added').eq('shop_id', shopId).order('updated_at', { ascending: false }).limit(1).single();

    // 6. Check Usage Events
    const { data: events } = await supabase.from('usage_events').select('*').eq('shop_id', shopId).order('created_at', { ascending: false }).limit(5);

    return NextResponse.json({
        shopId,
        customerCreated: newCust.id,
        usageBefore: usageBefore?.customers_added || 0,
        usageAfter: usageAfter?.customers_added || 0,
        success: (usageAfter?.customers_added || 0) > (usageBefore?.customers_added || 0),
        recentEvents: events
    });
}
