'use client';

import { useUser } from '@/supabase/provider';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export function AuthWrapper({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // If auth state is determined and there's no user, redirect to login.
    // Skip redirect for public paths: login and root (landing page)
    if (!isUserLoading && !user && pathname !== '/login' && pathname !== '/') {
      router.replace('/login');
    }
    // If the user is logged in and on the login page, redirect to dashboard.
    if (!isUserLoading && user && pathname === '/login') {
      router.replace('/dashboard');
    }
  }, [user, isUserLoading, router, pathname]);

  // While loading, show a full-screen loader.
  // Allow rendering for public paths even without user
  if (isUserLoading || (!user && pathname !== '/login' && pathname !== '/')) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // If user is loaded and on the correct page, render children.
  return <>{children}</>;
}
