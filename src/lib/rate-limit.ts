import { createClient } from '@/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function checkRateLimit(req: NextRequest, limit = 10, windowSeconds = 60) {
    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    const path = req.nextUrl.pathname;
    const key = `rate_limit:${ip}:${path}`;

    const supabase = await createClient();

    const { data: allowed, error } = await supabase.rpc('check_rate_limit', {
        p_key: key,
        p_limit: limit,
        p_window_seconds: windowSeconds
    });

    if (error) {
        console.error('Rate limit check failed:', error);
        // Fail open if DB is down? Or fail closed? 
        // Fail open to avoid blocking legitimate users during outages.
        return { allowed: true, remaining: 1 };
    }

    return { allowed: !!allowed };
}

export function rateLimitResponse() {
    return NextResponse.json(
        { error: 'Too many requests. Please try again later.', code: 'RATE_LIMIT_EXCEEDED' },
        { status: 429 }
    );
}
