import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // 1. Verify the user calling the function
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
        )

        const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
        if (userError || !user) throw new Error('Unauthorized')

        const { staffRoleId, shopId } = await req.json()

        if (!staffRoleId || !shopId) {
            throw new Error('Missing required fields')
        }

        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SERVICE_ROLE_KEY') ?? ''
        )

        // 2. Verify ownership of the shop
        const { data: roleData, error: roleError } = await supabaseAdmin
            .from('user_shop_roles')
            .select('role')
            .eq('user_id', user.id)
            .eq('shop_id', shopId)
            .eq('role', 'owner')
            .single()

        if (roleError || !roleData) {
            throw new Error('Permission denied. Only owners can delete staff.')
        }

        // 3. Get the staff member's user_id
        const { data: staffRole, error: staffError } = await supabaseAdmin
            .from('user_shop_roles')
            .select('user_id, role')
            .eq('id', staffRoleId)
            .single()

        if (staffError || !staffRole) {
            throw new Error('Staff member not found')
        }

        // Prevent deleting owners
        if (staffRole.role === 'owner') {
            throw new Error('Cannot delete shop owner')
        }

        const staffUserId = staffRole.user_id

        // 4. Delete the role assignment
        const { error: deleteRoleError } = await supabaseAdmin
            .from('user_shop_roles')
            .delete()
            .eq('id', staffRoleId)

        if (deleteRoleError) throw new Error('Failed to delete role: ' + deleteRoleError.message)

        // 5. Delete the user from Auth
        const { error: deleteUserError } = await supabaseAdmin.auth.admin.deleteUser(staffUserId)

        if (deleteUserError) {
            console.error('Failed to delete user from auth:', deleteUserError)
            // Don't throw here - the role is already deleted, which is the main goal
        }

        return new Response(JSON.stringify({ success: true, message: 'Staff member deleted successfully' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }
})
