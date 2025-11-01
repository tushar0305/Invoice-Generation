import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const hasToken = request.cookies.has('firebaseIdToken');
  const { pathname } = request.nextUrl;

  // Allow requests to the login page, regardless of token status for now.
  // The login page itself or the root page will handle redirecting logged-in users.
  if (pathname.startsWith('/login')) {
      return NextResponse.next();
  }
  
  // If the user is not logged in and tries to access a protected route, redirect to login.
  if (!hasToken && !pathname.startsWith('/login')) {
    // We construct a new URL object for the login page.
    const loginUrl = new URL('/login', request.url);
    // We use NextResponse.redirect() to perform the redirection.
    return NextResponse.redirect(loginUrl);
  }
  
  // If the user has a token or is accessing the login page, allow the request to proceed.
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
     * - / (the root path, which is handled by src/app/page.tsx)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|login|$).*)',
    // We explicitly exclude the root path which is just "/" (or empty string in some contexts)
    // and the /login path. The root path is now the main router.
    '/dashboard/:path*',
    '/invoices/:path*',
    '/customers/:path*',
  ],
};
