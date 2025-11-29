import { Suspense } from 'react';
import { EditInvoiceRedirectClient } from './client';
import { Loader2 } from 'lucide-react';

function LoadingFallback() {
  return (
    <div className="flex h-screen items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin" />
    </div>
  );
}

export default function EditInvoiceRedirectPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <EditInvoiceRedirectClient />
    </Suspense>
  );
}
