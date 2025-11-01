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
     * - / (the root path, which is handled by src/app/page.tsx)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|/).*)',
    // We explicitly exclude the root '/' because src/app/page.tsx is now responsible
    // for the initial authenticated vs. unauthenticated routing logic.
  ],
};
