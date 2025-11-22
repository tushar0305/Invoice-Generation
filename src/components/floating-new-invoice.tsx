'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Plus, FileText, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Contextual Floating Action Button
 * - Dashboard/Invoices: Create New Invoice
 * - Stock: Add Stock Item
 */
export function FloatingNewInvoiceButton() {
  const pathname = usePathname();
  const router = useRouter();

  const style = {
    // On mobile, place above the bottom nav (h-14 ~ 3.5rem) + 1rem gap + safe area
    // We use a CSS var to allow Tailwind's arbitrary value
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore - CSS var is fine
    ['--fab-bottom' as any]: 'calc(4.5rem + env(safe-area-inset-bottom))',
  };

  const className = "fixed right-5 bottom-[var(--fab-bottom)] md:bottom-6 z-50 inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 active:scale-95 h-14 w-14 md:h-12 md:w-12";

  // Hide FAB on calculator screen completely
  if (pathname === '/dashboard/calculator') {
    return null;
  }

  if (pathname === '/dashboard/stock') {
    return (
      <Button
        onClick={() => router.push('/dashboard/stock?action=add')}
        aria-label="Add Stock Item"
        style={style}
        className={className}
      >
        <Plus className="h-6 w-6 md:h-5 md:w-5" />
      </Button>
    );
  }

  // Default: New Invoice (Dashboard, Invoices, or others)
  // Hide on specific pages if needed (e.g., settings, or inside a form)
  if (pathname.includes('/new') || pathname.includes('/edit') || pathname === '/dashboard/settings') {
    return null;
  }

  return (
    <Link
      href="/dashboard/invoices/new"
      aria-label="Create New Invoice"
      style={style}
      className={className}
    >
      <Plus className="h-6 w-6 md:h-5 md:w-5" />
    </Link>
  );
}
