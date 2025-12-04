import { createClient } from '@/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import type { User } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';

// Type-safe error responses
export class APIError extends Error {
    constructor(
        public message: string,
        public status: number = 500,
        public code?: string
    ) {
        super(message);
        this.name = 'APIError';
    }
}

export type AuthContext = {
    user: User;
    supabase: SupabaseClient;
    params: Record<string, string>;
};

// Authenticated endpoint wrapper
export function withAuth(
    handler: (req: NextRequest, context: AuthContext) => Promise<Response>
) {
    return async (req: NextRequest, routeContext: { params: Promise<Record<string, string>> }) => {
        try {
            const supabase = await createClient();

            // Authenticate user
            const { data: { user }, error } = await supabase.auth.getUser();
            if (error || !user) {
                return NextResponse.json(
                    { error: 'Unauthorized', code: 'UNAUTHORIZED' },
                    { status: 401 }
                );
            }

            // Await params if they exist
            const params = routeContext?.params ? await routeContext.params : {};

            // Add context
            const authContext: AuthContext = {
                user,
                supabase,
                params,
            };

            // Execute handler
            return await handler(req, authContext);

        } catch (error) {
            console.error('[API Error]', error);

            if (error instanceof APIError) {
                return NextResponse.json(
                    { error: error.message, code: error.code },
                    { status: error.status }
                );
            }

            // Generic error
            return NextResponse.json(
                { error: 'Internal server error', code: 'INTERNAL_ERROR' },
                { status: 500 }
            );
        }
    };
}

// Helper to check shop access
export async function checkShopAccess(
    supabase: SupabaseClient,
    userId: string,
    shopId: string,
    requiredRoles: string[] = ['owner', 'manager', 'staff']
): Promise<{ role: string; hasAccess: boolean }> {
    const { data: userRole, error } = await supabase
        .from('user_shop_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('shop_id', shopId)
        .eq('is_active', true)
        .single();

    if (error || !userRole) {
        return { role: '', hasAccess: false };
    }

    const hasAccess = requiredRoles.includes(userRole.role);
    return { role: userRole.role, hasAccess };
}

// Helper for success responses
export function successResponse<T>(data: T, status = 200) {
    return NextResponse.json(
        { success: true, data },
        { status }
    );
}

// Helper for error responses
export function errorResponse(
    message: string,
    status = 400,
    code?: string
) {
    return NextResponse.json(
        { success: false, error: message, code },
        { status }
    );
}
