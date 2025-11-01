import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const hasToken = request.cookies.has('firebaseIdToken');
  const { pathname } = request.nextUrl;

  // Allow access to login and signup pages regardless of auth status
  if (pathname.startsWith('/login') || pathname.startsWith('/signup')) {
    // If logged in, redirect to dashboard from login/signup
    if (hasToken) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.next();
  }

  // If trying to access a protected route without a token, redirect to login
  if (!hasToken && pathname !== '/login') {
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
     * - login
     */
    '/((?!api|_next/static|_next/image|favicon.ico|login).*)',
  ],
};
