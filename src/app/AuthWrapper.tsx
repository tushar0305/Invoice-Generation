'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useUser } from '@/firebase';
import { Loader2 } from 'lucide-react';

const protectedRoutes = ['/dashboard'];
const publicRoutes = ['/login'];

export default function AuthWrapper({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isUserLoading) {
      // Don't do anything while the user state is loading
      return;
    }

    const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));

    if (!user && isProtectedRoute) {
      // If user is not logged in and trying to access a protected route, redirect to login
      router.replace('/login');
    } else if (user && (pathname === '/login' || pathname === '/')) {
      // If user is logged in and on the login page or root, redirect to dashboard
      router.replace('/dashboard');
    }
  }, [user, isUserLoading, router, pathname]);

  // While loading, or if a redirect is imminent, show a loader to prevent flash of content
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  if (isUserLoading || (!user && isProtectedRoute) || (user && (pathname === '/login' || pathname === '/'))) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}
