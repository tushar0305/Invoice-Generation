'use client';

import { useUser } from '@/firebase';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export function AuthWrapper({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // If auth state is determined and there's no user, redirect to login.
    if (!isUserLoading && !user) {
      router.replace('/login');
    }
    // If the user is logged in and on the login page, redirect to dashboard.
    if (!isUserLoading && user && pathname === '/login') {
      router.replace('/dashboard');
    }
  }, [user, isUserLoading, router, pathname]);

  // While loading, show a full-screen loader.
  if (isUserLoading || (!user && pathname !== '/login')) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  
  // If user is loaded and on the correct page, render children.
  return <>{children}</>;
}
