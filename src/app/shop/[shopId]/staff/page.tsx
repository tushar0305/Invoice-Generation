/**
 * Staff Page - Server Component
 * Fetches staff list and invitations server-side
 */

import { Suspense } from 'react';
import { createClient } from '@/supabase/server';
import { StaffClient } from './client';
import { Loader2 } from 'lucide-react';

// Loading component for Suspense boundary
function StaffLoading() {
    return (
        <div className="flex h-[50vh] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    );
}

export default async function StaffPage({
    params,
}: {
    params: Promise<{ shopId: string }>;
}) {
    const { shopId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Parallel fetch for staff and invitations
    const [staffResult, inviteResult] = await Promise.all([
        supabase
            .from('user_shop_roles')
            .select('*')
            .eq('shop_id', shopId)
            .order('created_at', { ascending: true }),

        supabase
            .from('shop_invitations')
            .select('*')
            .eq('shop_id', shopId)
            .eq('status', 'pending')
    ]);

    const staffData = staffResult.data || [];
    const inviteData = inviteResult.data || [];

    // Map staff data
    // Note: We don't have direct access to user emails from user_shop_roles unless we have a profiles table
    // Replicating existing logic for now
    const mappedStaff = staffData.map((r: any) => ({
        id: r.id,
        user_id: r.user_id,
        role: r.role,
        email: r.user_id === user?.id ? 'You' : `User ${r.user_id.slice(0, 8)}...`,
        joined_at: r.accepted_at || r.created_at,
        is_active: r.is_active,
    }));

    return (
        <Suspense fallback={<StaffLoading />}>
            <StaffClient
                initialStaff={mappedStaff}
                initialInvitations={inviteData}
                shopId={shopId}
                currentUserId={user?.id || ''}
            />
        </Suspense>
    );
}
