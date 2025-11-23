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

        const { email, password, role, shopId, name } = await req.json()

        if (!email || !password || !role || !shopId || !name) {
            throw new Error('Missing required fields')
        }

        // 2. Verify ownership of the shop
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SERVICE_ROLE_KEY') ?? ''
        )

        const { data: roleData, error: roleError } = await supabaseAdmin
            .from('user_shop_roles')
            .select('role')
            .eq('user_id', user.id)
            .eq('shop_id', shopId)
            .eq('role', 'owner')
            .single()

        if (roleError || !roleData) {
            throw new Error('Permission denied. Only owners can create staff.')
        }

        // 3. Create new user
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { full_name: name }
        })

        if (createError) throw createError
        if (!newUser.user) throw new Error('Failed to create user')

        // 4. Assign role
        const { error: assignError } = await supabaseAdmin
            .from('user_shop_roles')
            .insert({
                user_id: newUser.user.id,
                shop_id: shopId,
                role: role,
                invited_by: user.id,
                accepted_at: new Date().toISOString(),
            })

        if (assignError) {
            // Rollback
            await supabaseAdmin.auth.admin.deleteUser(newUser.user.id)
            throw new Error('Failed to assign role: ' + assignError.message)
        }

        // 5. Create preferences
        await supabaseAdmin
            .from('user_preferences')
            .insert({
                user_id: newUser.user.id,
                last_active_shop_id: shopId
            })

        return new Response(JSON.stringify({ success: true, message: 'Staff member created successfully' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }
})
