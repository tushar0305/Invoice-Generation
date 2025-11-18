'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, FileText, Users, Package, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

export function MobileBottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  const isActive = (href: string, startsWith = false) => {
    if (!pathname) return false;
    return startsWith ? pathname.startsWith(href) : pathname === href;
  };

  const items = [
    { href: '/dashboard', label: 'Home', icon: LayoutDashboard, active: isActive('/dashboard') && pathname === '/dashboard' },
    { href: '/dashboard/invoices', label: 'Invoices', icon: FileText, active: isActive('/dashboard/invoices', true) },
    { href: '/dashboard/customers', label: 'Customers', icon: Users, active: isActive('/dashboard/customers') },
    { href: '/dashboard/stock', label: 'Stock', icon: Package, active: isActive('/dashboard/stock') },
    { href: '/dashboard/settings', label: 'Settings', icon: Settings, active: isActive('/dashboard/settings') },
  ];

  return (
    <div className="print:hidden fixed inset-x-0 bottom-0 z-40 md:hidden">
      <div className="relative w-full">
        <nav
          className="overflow-hidden rounded-t-2xl border-t bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60 shadow-lg"
          style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 0px)' }}
        >
          <ul className="grid grid-cols-5 items-center justify-between">
            {items.map((item) => (
              <li
                key={item.href}
                className={cn(
                  'relative border-t-2 border-transparent',
                  item.active && 'border-primary'
                )}
              >
                <Link
                  href={item.href}
                  aria-current={item.active ? 'page' : undefined}
                  className={cn(
                    'flex h-14 flex-col items-center justify-center gap-1 text-[11px]',
                    item.active ? 'text-primary font-medium' : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="leading-none">{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </div>
  );
}
