import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
    try {
        const cookieStore = await cookies();
        console.log('createClient: Initializing Supabase server client');
        console.log('URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Defined' : 'Undefined');

        const client = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        return cookieStore.getAll();
                    },
                    setAll(cookiesToSet) {
                        try {
                            cookiesToSet.forEach(({ name, value, options }) =>
                                cookieStore.set(name, value, options)
                            );
                        } catch {
                            // The `setAll` method was called from a Server Component.
                            // This can be ignored if you have middleware refreshing
                            // user sessions.
                        }
                    },
                },
            }
        );

        if (!client) console.error('createClient: Failed to create client');
        return client;
    } catch (error) {
        console.error('createClient: Error initializing:', error);
        throw error;
    }
}
