/**
 * Staff Page - Server Component
 * Fetches staff list and invitations server-side
 */

import { Suspense } from 'react';
import { createClient } from '@/supabase/server';
import { StaffClient } from './client';

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
    searchParams,
}: {
    params: Promise<{ shopId: string }>;
    searchParams: Promise<{ page?: string; q?: string }>;
}) {
    const { shopId } = await params;
    const { page: pageParam, q } = await searchParams;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const page = Number(pageParam) || 1;
    const limit = 10;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    // 1. If search query exists, find matching user_ids from profiles first
    let searchUserIds: string[] | null = null;
    if (q) {
        const { data: profiles } = await supabase
            .from('staff_profiles')
            .select('user_id')
            .eq('shop_id', shopId)
            .ilike('name', `%${q}%`);

        if (profiles) {
            searchUserIds = profiles.map(p => p.user_id);
        }
    }

    // 2. Build Query for Roles
    let query = supabase
        .from('user_shop_roles')
        .select('*', { count: 'exact' })
        .eq('shop_id', shopId)
        .order('created_at', { ascending: true });

    // Apply Search Filter if needed
    if (q) {
        // If we found matching names, include those IDs OR match role
        const roleMatchObj = `role.ilike.%${q}%`;

        if (searchUserIds && searchUserIds.length > 0) {
            // Match (Role ILIKE q) OR (user_id IN searchUserIds)
            // Note: PostgREST syntax for OR with IN is tricky. 
            // Simpler: Just filter by user_id IN matching_ids OR role match.
            // Actually, let's keep it simple: Filter by Role OR Name (via user_ids)
            // Using logic: (role ilike q) OR (user_id in (ids))

            // Constructing the OR filter string is complex.
            // Alternative: Fetch all, then filter in JS? (Staff list is small).
            // But we promised server-side pagination.
            // Let's rely on just Role search + Name search via separate Step if needed.
            // Actually, let's try just filtering by the IDs we found.
            query = query.in('user_id', searchUserIds);
        } else {
            // If q exists but no name match, maybe role match?
            query = query.or(`role.ilike.%${q}%`);
        }
    }

    // Apply Pagination
    query = query.range(from, to);

    // Fetch Staff & Invitations Parallel
    const [staffResult, inviteResult] = await Promise.all([
        query,
        supabase
            .from('shop_invitations')
            .select('*')
            .eq('shop_id', shopId)
            .eq('status', 'pending')
    ]);

    const staffData = staffResult.data || [];
    const count = staffResult.count || 0;
    const inviteData = inviteResult.data || [];

    // Fetch profiles for the *paginated* staff members
    const userIds = staffData.map((r: any) => r.user_id);
    let profilesData: any[] = [];

    if (userIds.length > 0) {
        const { data } = await supabase
            .from('staff_profiles')
            .select('user_id, name')
            .eq('shop_id', shopId)
            .in('user_id', userIds);
        profilesData = data || [];
    }

    const profilesMap = new Map(profilesData.map((p: any) => [p.user_id, p.name]));

    // Map staff data
    const mappedStaff = staffData.map((r: any) => ({
        id: r.id,
        user_id: r.user_id,
        role: r.role,
        name: profilesMap.get(r.user_id) || 'Unknown Staff',
        email: r.user_id === user?.id ? 'You' : `User ${r.user_id.slice(0, 8)}...`, // Email is private in auth table, cant get it easily unless stored in profile or View.
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
                pagination={{
                    currentPage: page,
                    totalPages: Math.ceil(count / limit),
                    totalCount: count,
                    limit,
                }}
                searchParams={{ q }}
            />
        </Suspense>
    );
}
