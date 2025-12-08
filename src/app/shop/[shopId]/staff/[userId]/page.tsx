import { Suspense } from 'react';
import { createClient } from '@/supabase/server';
import { StaffDetailsClient } from './staff-details-client';
import { getStaffPayments, getStaffAttendance } from '@/app/actions/staff-actions';
import { Skeleton } from '@/components/ui/skeleton';

function StaffDetailsLoading() {
    return (
        <div className="space-y-6 p-6 max-w-[1200px] mx-auto">
            <div className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2">
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-4 w-32" />
                </div>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
                <Skeleton className="h-32 rounded-xl" />
                <Skeleton className="h-32 rounded-xl" />
                <Skeleton className="h-32 rounded-xl" />
            </div>
            <Skeleton className="h-96 w-full rounded-xl" />
        </div>
    );
}

export default async function StaffDetailsPage({
    params,
}: {
    params: Promise<{ shopId: string; userId: string }>;
}) {
    const { shopId, userId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Fetch staff details and profile
    // We fetch them separately to handle cases where staff_profile might be missing
    // or the foreign key relationship isn't explicitly defined for a join
    const [staffRoleResult, staffProfileResult] = await Promise.all([
        supabase
            .from('user_shop_roles')
            .select('*')
            .eq('shop_id', shopId)
            .eq('user_id', userId)
            .single(),
        supabase
            .from('staff_profiles')
            .select('name')
            .eq('shop_id', shopId)
            .eq('user_id', userId)
            .maybeSingle()
    ]);

    const staffRole = staffRoleResult.data;
    const staffProfile = staffProfileResult.data;

    if (!staffRole) {
        return <div className="p-8">Staff member not found</div>;
    }

    // Fetch current user's role to determine permissions
    const { data: currentUserRoleData } = await supabase
        .from('user_shop_roles')
        .select('role')
        .eq('shop_id', shopId)
        .eq('user_id', user?.id)
        .single();

    const currentUserRole = currentUserRoleData?.role || 'staff';

    // Fetch payments and attendance
    const [payments, attendance] = await Promise.all([
        getStaffPayments(shopId, userId),
        getStaffAttendance(shopId, userId)
    ]);

    const staffDetails = {
        id: staffRole.id,
        user_id: staffRole.user_id,
        role: staffRole.role,
        name: staffProfile?.name || 'Unknown Staff',
        email: `User ${staffRole.user_id.slice(0, 8)}...`, // We don't have email in user_shop_roles, would need auth.users join which is tricky from client
        joined_at: staffRole.created_at,
        is_active: staffRole.is_active,
    };

    return (
        <Suspense fallback={<StaffDetailsLoading />}>
            <StaffDetailsClient
                shopId={shopId}
                staff={staffDetails}
                payments={payments || []}
                attendance={attendance || []}
                currentUserRole={currentUserRole}
            />
        </Suspense>
    );
}
