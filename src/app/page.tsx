'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import { Loader2 } from 'lucide-react';

export default function Home() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    // Wait until the loading is finished before making a decision.
    if (!isUserLoading) {
      if (user) {
        // If user is authenticated, redirect to the dashboard.
        router.replace('/dashboard');
      } else {
        // If user is not authenticated, redirect to the login page.
        router.replace('/login');
      }
    }
  }, [user, isUserLoading, router]);

  // While loading, show a spinner to prevent a flash of unstyled content
  // and to indicate that something is happening.
  return (
    <div className="flex h-screen items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin" />
    </div>
  );
}
