/**
 * Staff Page - Server Component
 * Fetches staff list and invitations server-side
 */

import { Suspense } from 'react';
import { createClient } from '@/supabase/server';
import { StaffClient } from './client';
import { MobileStaffList } from '@/components/mobile/mobile-staff-list';
import { Skeleton } from '@/components/ui/skeleton';

// Loading component for Suspense boundary
function StaffLoading() {
    return (
        <div className="space-y-6 p-6 pb-24 md:pb-6 max-w-[1800px] mx-auto">
            <div className="flex justify-between items-center">
                <div className="space-y-2">
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-4 w-64" />
                </div>
                <Skeleton className="h-10 w-32" />
            </div>
            <div className="grid gap-4 md:grid-cols-3">
                <Skeleton className="h-32 rounded-xl border border-border" />
                <Skeleton className="h-32 rounded-xl border border-border" />
                <Skeleton className="h-32 rounded-xl border border-border" />
            </div>
            <Skeleton className="h-96 w-full rounded-xl border border-border" />
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
            <MobileStaffList 
                shopId={shopId} 
                staff={mappedStaff} 
                invitations={inviteData} 
                currentUserId={user?.id || ''} 
            />
            <div className="hidden md:block">
                <StaffClient
                    initialStaff={mappedStaff}
                    initialInvitations={inviteData}
                    shopId={shopId}
                    currentUserId={user?.id || ''}
                />
            </div>
        </Suspense>
    );
}
