'use client';

import { Loader2 } from 'lucide-react';

// This root page is now primarily a loading fallback.
// The main redirection logic is handled by AuthWrapper.tsx
export default function Home() {
  return (
    <div className="flex h-screen items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin" />
    </div>
  );
}
