import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    const {
        data: { user },
    } = await supabase.auth.getUser()

    // Protected routes pattern
    const isProtectedRoute = request.nextUrl.pathname.startsWith('/shop') ||
        request.nextUrl.pathname.startsWith('/onboarding') ||
        request.nextUrl.pathname.startsWith('/admin')

    // Auth routes pattern
    const isAuthRoute = request.nextUrl.pathname === '/login' ||
        request.nextUrl.pathname === '/signup' ||
        request.nextUrl.pathname === '/'

    // 1. If not logged in and trying to access protected route -> Redirect to Login
    if (!user && isProtectedRoute) {
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        return NextResponse.redirect(url)
    }

    // 2. If logged in and trying to access auth route -> Redirect to Shop or Onboarding
    if (user && isAuthRoute) {
        // Check onboarding status and shop roles
        const { data: prefs } = await supabase
            .from('user_preferences')
            .select('onboarding_completed, last_active_shop_id')
            .eq('user_id', user.id)
            .maybeSingle()

        // Check if user has any shop roles (might be invited staff)
        const { data: roles } = await supabase
            .from('user_shop_roles')
            .select('shop_id, role')
            .eq('user_id', user.id)
            .eq('is_active', true)
            .limit(1)
            .maybeSingle()

        const url = request.nextUrl.clone()

        // If user has a shop role, redirect to that shop (staff/invited user)
        if (roles?.shop_id) {
            url.pathname = `/shop/${roles.shop_id}/dashboard`
        } else if (prefs?.last_active_shop_id) {
            url.pathname = `/shop/${prefs.last_active_shop_id}/dashboard`
        } else if (!prefs?.onboarding_completed) {
            url.pathname = '/onboarding/shop-setup'
        } else {
            // Fallback if no shop found but onboarding complete (rare)
            url.pathname = '/onboarding/shop-setup'
        }

        return NextResponse.redirect(url)
    }

    // 3. Legacy /dashboard redirect
    // If user hits /dashboard, we try to redirect them to their active shop
    if (user && request.nextUrl.pathname.startsWith('/dashboard')) {
        const { data: prefs } = await supabase
            .from('user_preferences')
            .select('last_active_shop_id')
            .eq('user_id', user.id)
            .single()

        if (prefs?.last_active_shop_id) {
            const url = request.nextUrl.clone()
            // Replace /dashboard with /shop/[id]/dashboard
            // Example: /dashboard/invoices -> /shop/123/invoices
            // Wait, the new structure is /shop/[id]/invoices, NOT /shop/[id]/dashboard/invoices
            // But the user requested /shop/[id]/dashboard (Overview)

            const path = request.nextUrl.pathname.replace('/dashboard', '')
            // If path is empty (just /dashboard), it becomes /shop/[id]/dashboard
            // If path is /invoices, it becomes /shop/[id]/invoices

            if (path === '' || path === '/') {
                url.pathname = `/shop/${prefs.last_active_shop_id}/dashboard`
            } else {
                url.pathname = `/shop/${prefs.last_active_shop_id}${path}`
            }

            return NextResponse.redirect(url)
        }
    }

    return response
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon (favicon folder)
         * - public folder files
         */
        '/((?!_next/static|_next/image|favicon/|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
