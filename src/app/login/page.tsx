
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { LoginPageClient } from './client';

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen grid place-items-center bg-[#FDFBF7]"><Loader2 className="h-8 w-8 animate-spin text-gold-500" /></div>}>
      <LoginPageClient />
    </Suspense>
  );
}
