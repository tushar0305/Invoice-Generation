'use server';

import { createClient } from '@/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const inviteSchema = z.object({
    email: z.string().email(),
    role: z.enum(['manager', 'staff']),
    shopId: z.string(),
});

const createStaffSchema = z.object({
    email: z.string().email(),
    name: z.string().min(2, 'Name must be at least 2 characters'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    role: z.enum(['manager', 'staff']),
    shopId: z.string(),
});

const paymentSchema = z.object({
    shopId: z.string(),
    staffUserId: z.string(),
    amount: z.number().positive(),
    paymentType: z.enum(['salary', 'bonus', 'advance', 'commission']),
    notes: z.string().optional(),
    paymentDate: z.date(),
});

const attendanceSchema = z.object({
    shopId: z.string(),
    staffUserId: z.string(),
    date: z.date(),
    status: z.enum(['present', 'absent', 'half_day', 'leave']),
    notes: z.string().optional(),
});

export async function inviteStaffAction(formData: z.infer<typeof inviteSchema>) {
    const supabase = await createClient();
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Unauthorized');

        // Only owners can invite staff
        const { data: roleData } = await supabase
            .from('user_shop_roles')
            .select('role')
            .eq('shop_id', formData.shopId)
            .eq('user_id', user.id)
            .single();

        if (!roleData || roleData.role !== 'owner') {
            throw new Error('Only shop owners can invite staff');
        }

        // Insert invitation record
        const { error } = await supabase
            .from('shop_invitations')
            .insert({
                shop_id: formData.shopId,
                email: formData.email,
                role: formData.role,
                invited_by: user.id,
            });

        if (error) throw error;

        // Optionally send email here (omitted)

        revalidatePath(`/shop/${formData.shopId}/staff`);
        return { success: true };
    } catch (error: any) {
        console.error('inviteStaffAction error:', error);
        return { success: false, error: error.message };
    }
}

export async function createStaffAction(formData: z.infer<typeof createStaffSchema>) {
    const supabase = await createClient();
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Unauthorized');

        // Check permissions
        const { data: roleData } = await supabase
            .from('user_shop_roles')
            .select('role')
            .eq('shop_id', formData.shopId)
            .eq('user_id', user.id)
            .single();

        if (!roleData || !['owner', 'manager'].includes(roleData.role)) {
            throw new Error('Permission denied');
        }

        // Initialize Admin Client
        const { createClient: createAdminClient } = await import('@supabase/supabase-js');
        const supabaseAdmin = createAdminClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
            }
        );

        // 1. Create User
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email: formData.email,
            password: formData.password,
            email_confirm: true,
            user_metadata: {
                role: formData.role
            }
        });

        if (createError) throw createError;
        if (!newUser.user) throw new Error('Failed to create user');

        // 2. Assign Role
        const { error: roleError } = await supabaseAdmin
            .from('user_shop_roles')
            .insert({
                user_id: newUser.user.id,
                shop_id: formData.shopId,
                role: formData.role
            });

        if (roleError) {
            // Rollback user creation if role assignment fails? 
            // Ideally yes, but for now just throw
            await supabaseAdmin.auth.admin.deleteUser(newUser.user.id);
            throw roleError;
        }

        // 3. Create Staff Profile
        const { error: profileError } = await supabaseAdmin
            .from('staff_profiles')
            .insert({
                user_id: newUser.user.id,
                shop_id: formData.shopId,
                name: formData.name,
            });

        if (profileError) {
            console.error('Error creating staff profile:', profileError);
            // Non-critical, can be created later
        }

        revalidatePath(`/shop/${formData.shopId}/staff`);
        return { success: true };
    } catch (error: any) {
        console.error('createStaffAction error:', error);
        return { success: false, error: error.message };
    }
}

export async function removeStaffAction(staffId: string, shopId: string) {
    const supabase = await createClient();
    try {
        // Verify permissions (Owner only for removing staff)
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Unauthorized');

        const { data: roleData } = await supabase
            .from('user_shop_roles')
            .select('role')
            .eq('shop_id', shopId)
            .eq('user_id', user.id)
            .single();

        if (roleData?.role !== 'owner') {
            throw new Error('Only owners can remove staff');
        }

        // Soft delete or hard delete? For now, we'll just deactivate them in user_shop_roles
        // Actually, let's delete the role to remove access completely
        const { error } = await supabase
            .from('user_shop_roles')
            .delete()
            .eq('id', staffId);

        if (error) {
            console.error('Error removing staff:', error);
            throw new Error('Failed to remove staff member. They may have associated records.');
        }

        revalidatePath(`/shop/${shopId}/staff`);
        return { success: true };
    } catch (error: any) {
        console.error('removeStaffAction error:', error);
        return { success: false, error: error.message };
    }
}

export async function recordPaymentAction(formData: z.infer<typeof paymentSchema>) {
    const supabase = await createClient();
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Unauthorized');

        // Get staff_id from staff_profiles using user_id
        let { data: staffProfile } = await supabase
            .from('staff_profiles')
            .select('id')
            .eq('user_id', formData.staffUserId)
            .eq('shop_id', formData.shopId)
            .single();

        if (!staffProfile) {
            // Auto-create profile if it doesn't exist
            const { data: newProfile, error: createError } = await supabase
                .from('staff_profiles')
                .insert({
                    shop_id: formData.shopId,
                    user_id: formData.staffUserId,
                    // We might need other fields, but assuming defaults or nulls are allowed
                })
                .select('id')
                .single();

            if (createError) {
                console.error('Failed to auto-create staff profile:', createError);
                throw new Error('Staff profile not found and could not be created');
            }
            staffProfile = newProfile;
        }

        const { error } = await supabase.from('staff_payments').insert({
            shop_id: formData.shopId,
            staff_id: staffProfile.id,
            amount: formData.amount,
            payment_type: formData.paymentType,
            description: formData.notes,
            payment_date: formData.paymentDate.toISOString().split('T')[0],
            created_by: user.id,
        });

        if (error) throw error;

        revalidatePath(`/shop/${formData.shopId}/staff`);
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function markAttendanceAction(formData: z.infer<typeof attendanceSchema>) {
    const supabase = await createClient();
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Unauthorized');

        // Get staff_id from staff_profiles using user_id
        let { data: staffProfile } = await supabase
            .from('staff_profiles')
            .select('id')
            .eq('user_id', formData.staffUserId)
            .eq('shop_id', formData.shopId)
            .single();

        if (!staffProfile) {
            // Auto-create profile if it doesn't exist
            const { data: newProfile, error: createError } = await supabase
                .from('staff_profiles')
                .insert({
                    shop_id: formData.shopId,
                    user_id: formData.staffUserId,
                })
                .select('id')
                .single();

            if (createError) {
                console.error('Failed to auto-create staff profile:', createError);
                throw new Error('Staff profile not found and could not be created');
            }
            staffProfile = newProfile;
        }

        const { error } = await supabase.from('staff_attendance').upsert({
            shop_id: formData.shopId,
            staff_id: staffProfile.id,
            date: formData.date.toISOString().split('T')[0],
            status: formData.status,
            notes: formData.notes,
        }, {
            onConflict: 'staff_id, date'
        });

        if (error) throw error;

        revalidatePath(`/shop/${formData.shopId}/staff`);
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function getStaffPayments(shopId: string, staffUserId: string) {
    const supabase = await createClient();

    // Get staff_id from staff_profiles using user_id
    const { data: staffProfile } = await supabase
        .from('staff_profiles')
        .select('id')
        .eq('user_id', staffUserId)
        .eq('shop_id', shopId)
        .single();

    if (!staffProfile) {
        return [];
    }

    const { data, error } = await supabase
        .from('staff_payments')
        .select('*')
        .eq('shop_id', shopId)
        .eq('staff_id', staffProfile.id)
        .order('payment_date', { ascending: false });

    if (error) throw error;
    return data;
}

export async function getStaffAttendance(shopId: string, staffUserId: string) {
    const supabase = await createClient();

    // Get staff_id from staff_profiles using user_id
    const { data: staffProfile } = await supabase
        .from('staff_profiles')
        .select('id')
        .eq('user_id', staffUserId)
        .eq('shop_id', shopId)
        .single();

    if (!staffProfile) {
        return [];
    }

    const { data, error } = await supabase
        .from('staff_attendance')
        .select('*')
        .eq('shop_id', shopId)
        .eq('staff_id', staffProfile.id)
        .order('date', { ascending: false })
        .limit(30); // Last 30 days

    if (error) throw error;
    return data;
}
