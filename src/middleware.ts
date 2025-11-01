import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const hasToken = request.cookies.has('firebaseIdToken');
  const { pathname } = request.nextUrl;

  // If the user is logged in and tries to access the login page, redirect to dashboard
  if (hasToken && pathname.startsWith('/login')) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  
  // If the user is not logged in and tries to access a protected route, redirect to login
  if (!hasToken && !pathname.startsWith('/login')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
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
     * - / (the root path which redirects to /dashboard or /login)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
    '/', // This ensures the root is also covered by the middleware
  ],
};
