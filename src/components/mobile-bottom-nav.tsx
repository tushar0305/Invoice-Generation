'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, FileText, Users, Package, Calculator } from 'lucide-react';
import { cn } from '@/lib/utils';

export function MobileBottomNav({ shopId }: { shopId: string }) {
  const pathname = usePathname();

  const isActive = (href: string, startsWith = false) => {
    if (!pathname) return false;
    return startsWith ? pathname.startsWith(href) : pathname === href;
  };

  const items = [
    { href: `/shop/${shopId}/dashboard`, label: 'Home', icon: LayoutDashboard, active: isActive(`/shop/${shopId}/dashboard`) && pathname === `/shop/${shopId}/dashboard` },
    { href: `/shop/${shopId}/invoices`, label: 'Invoices', icon: FileText, active: isActive(`/shop/${shopId}/invoices`, true) },
    { href: `/shop/${shopId}/customers`, label: 'Customers', icon: Users, active: isActive(`/shop/${shopId}/customers`) },
    { href: `/shop/${shopId}/stock`, label: 'Stock', icon: Package, active: isActive(`/shop/${shopId}/stock`) },
    { href: `/shop/${shopId}/calculator`, label: 'Calculator', icon: Calculator, active: isActive(`/shop/${shopId}/calculator`) },
  ];

  return (
    <div className="print:hidden fixed inset-x-0 bottom-0 z-40 md:hidden pointer-events-none">
      {/* Floating container with padding from edges */}
      <div className="relative w-full px-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)]">
        <nav
          className={cn(
            "pointer-events-auto relative overflow-hidden",
            "rounded-[18px]",
            // Consistent glass effect
            "bg-white/70 dark:bg-gray-900/70",
            "backdrop-blur-xl saturate-150",
            // Subtle gold-tinted border
            "border border-amber-100/30 dark:border-amber-900/20",
            // Soft shadow
            "shadow-[0_4px_20px_rgba(139,97,38,0.08),0_1px_4px_rgba(0,0,0,0.05)]",
            "dark:shadow-[0_4px_20px_rgba(0,0,0,0.3),0_1px_4px_rgba(212,175,55,0.03)]"
          )}
          style={{
            backdropFilter: 'blur(20px) saturate(150%)',
            WebkitBackdropFilter: 'blur(20px) saturate(150%)',
          }}
        >
          {/* Subtle warm gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-amber-50/5 via-transparent to-white/10 dark:from-amber-900/5 dark:to-transparent pointer-events-none" />

          {/* Top highlight line */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 dark:via-white/8 to-transparent" />

          {/* Inner glow ring */}
          <div className="absolute inset-0 rounded-[18px] ring-1 ring-inset ring-white/15 dark:ring-white/5 pointer-events-none" />

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
                  {/* Active indicator with subtle gold glow */}
                  {item.active && (
                    <>
                      {/* Background pill */}
                      <div className={cn(
                        "absolute inset-x-2.5 inset-y-1.5",
                        "rounded-[14px]",
                        "bg-gradient-to-b from-amber-100/60 to-amber-50/40",
                        "dark:from-amber-800/25 dark:to-amber-900/15",
                        "border border-amber-200/40 dark:border-amber-700/25",
                        "shadow-[0_1px_8px_rgba(212,175,55,0.15)]",
                        "dark:shadow-[0_1px_8px_rgba(212,175,55,0.08)]",
                        "transition-all duration-200"
                      )} />
                      {/* Subtle glow */}
                      <div className="absolute inset-x-6 bottom-2 h-3 bg-amber-400/20 dark:bg-amber-500/10 blur-lg rounded-full" />
                    </>
                  )}

                  {/* Icon with consistent sizing */}
                  <div className="relative z-10">
                    <item.icon
                      className={cn(
                        "h-5 w-5 transition-all duration-200 ease-out",
                        item.active
                          ? 'text-amber-600 dark:text-amber-400 scale-105'
                          : 'text-gray-500/60 dark:text-gray-400/50 group-hover:text-gray-600 dark:group-hover:text-gray-300'
                      )}
                    />
                  </div>

                  {/* Label with improved typography */}
                  <span
                    className={cn(
                      "relative z-10 text-[10px] font-semibold tracking-wide leading-none transition-all duration-200",
                      item.active
                        ? 'text-amber-700 dark:text-amber-400'
                        : 'text-gray-500/60 dark:text-gray-500/50 group-hover:text-gray-600 dark:group-hover:text-gray-400'
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
