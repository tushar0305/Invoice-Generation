'use client';

import Link from 'next/link';
import { Plus } from 'lucide-react';

/**
 * Floating New Invoice button that stays above the mobile bottom nav
 * and at the bottom-right on larger screens.
 */
export function FloatingNewInvoiceButton() {
  return (
    <Link
      href="/dashboard/invoices/new"
      aria-label="Create New Invoice"
      style={{
        // On mobile, place above the bottom nav (h-14 ~ 3.5rem) + 1rem gap + safe area
        // We use a CSS var to allow Tailwind's arbitrary value
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore - CSS var is fine
        ['--fab-bottom' as any]: 'calc(4.5rem + env(safe-area-inset-bottom))',
      }}
      className="fixed right-5 bottom-[var(--fab-bottom)] md:bottom-6 z-50 inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 active:scale-95 h-12 w-12"
    >
      <Plus className="h-5 w-5" />
    </Link>
  );
}
