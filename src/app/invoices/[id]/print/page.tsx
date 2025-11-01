'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function PrintInvoiceRedirectPage({ params }: { params: { id: string } }) {
  const router = useRouter();

  useEffect(() => {
    router.replace(`/dashboard/invoices/${params.id}/print`);
  }, [router, params.id]);

  return (
    <div className="flex h-screen items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin" />
    </div>
  );
}
