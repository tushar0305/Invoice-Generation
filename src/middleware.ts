import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const hasToken = request.cookies.has('firebaseIdToken');
  const { pathname } = request.nextUrl;

  // If the user is logged in, and tries to access the login page, redirect them to the dashboard.
  if (hasToken && pathname.startsWith('/login')) {
      const dashboardUrl = new URL('/dashboard', request.url);
      return NextResponse.redirect(dashboardUrl);
  }
  
  // If the user is not logged in and tries to access a protected route, redirect to login.
  if (!hasToken && !pathname.startsWith('/login')) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }
  
  // Otherwise, allow the request to proceed.
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - / (the root path, which is now handled by src/app/page.tsx)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|login|$).*)',
    // We explicitly include /login to handle the redirect-if-logged-in case
    '/login',
    '/dashboard/:path*',
    '/invoices/:path*',
    '/customers/:path*',
  ],
};
