'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, FileText, Users, Package, Calculator } from 'lucide-react';
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
    { href: '/dashboard/calculator', label: 'Calculator', icon: Calculator, active: isActive('/dashboard/calculator') },
  ];

  return (
    <div className="print:hidden fixed inset-x-0 bottom-0 z-40 md:hidden pointer-events-none">
      {/* Floating container with padding from edges */}
      <div className="relative w-full px-4 pb-[calc(env(safe-area-inset-bottom)+0.75rem)]">
        <nav
          className="pointer-events-auto relative overflow-hidden rounded-3xl bg-background/40 backdrop-blur-2xl supports-[backdrop-filter]:bg-background/40 border border-border/10 shadow-2xl shadow-black/10"
          style={{
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          }}
        >
          {/* Subtle gradient overlay for depth */}
          <div className="absolute inset-0 bg-gradient-to-t from-background/10 to-transparent pointer-events-none" />

          {/* Inner glow effect */}
          <div className="absolute inset-0 rounded-3xl ring-1 ring-inset ring-white/10 pointer-events-none" />

          <ul className="relative grid grid-cols-5 items-center justify-between py-2">
            {items.map((item) => (
              <li key={item.href} className="relative">
                <Link
                  href={item.href}
                  aria-current={item.active ? 'page' : undefined}
                  className={cn(
                    'group relative flex h-14 flex-col items-center justify-center gap-1',
                    'transition-all duration-300 ease-out',
                    'active:scale-90',
                  )}
                >
                  {/* Active indicator - iOS style pill */}
                  {item.active && (
                    <div className="absolute inset-x-2 inset-y-1 rounded-xl bg-primary/15 backdrop-blur-sm border border-primary/20 shadow-lg shadow-primary/10 transition-all duration-300" />
                  )}

                  {/* Icon with smooth transitions */}
                  <div className="relative z-10">
                    <item.icon
                      className={cn(
                        "h-6 w-6 transition-all duration-300 ease-out",
                        item.active
                          ? 'text-primary scale-110 drop-shadow-md'
                          : 'text-muted-foreground group-hover:text-foreground group-hover:scale-105'
                      )}
                    />
                  </div>

                  {/* Label with fade effect */}
                  <span
                    className={cn(
                      "relative z-10 text-[10px] font-medium tracking-wide leading-none transition-all duration-300",
                      item.active
                        ? 'text-primary opacity-100 scale-100'
                        : 'text-muted-foreground/80 opacity-90 group-hover:text-foreground group-hover:opacity-100'
                    )}
                  >
                    {item.label}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </div>
  );
}
