'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  Package, 
  MoreHorizontal,
  UserCog,
  Banknote,
  BookOpen,
  Crown,
  Settings,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'framer-motion';

export function MotionBottomNav({ shopId }: { shopId: string }) {
  const pathname = usePathname();
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);

  // Auto-hide on scroll
  useEffect(() => {
    const container = document.getElementById('shop-main-content');
    if (!container) return;

    const handleScroll = () => {
      const currentScrollY = container.scrollTop;
      const diff = currentScrollY - lastScrollY.current;
      
      // Hide on scroll down (if moved more than 10px), show on scroll up
      if (diff > 10 && currentScrollY > 50) {
        setIsVisible(false);
        setIsMoreOpen(false); // Close menu on scroll
      } else if (diff < -10) {
        setIsVisible(true);
      }
      
      lastScrollY.current = currentScrollY;
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  const isActive = (href: string, startsWith = false) => {
    if (!pathname) return false;
    return startsWith ? pathname.startsWith(href) : pathname === href;
  };

  const mainTabs = [
    { id: 'dashboard', href: `/shop/${shopId}/dashboard`, label: 'Home', icon: LayoutDashboard, active: isActive(`/shop/${shopId}/dashboard`) },
    { id: 'invoices', href: `/shop/${shopId}/invoices`, label: 'Invoices', icon: FileText, active: isActive(`/shop/${shopId}/invoices`, true) },
    { id: 'customers', href: `/shop/${shopId}/customers`, label: 'Customers', icon: Users, active: isActive(`/shop/${shopId}/customers`) },
    { id: 'stock', href: `/shop/${shopId}/stock`, label: 'Stock', icon: Package, active: isActive(`/shop/${shopId}/stock`) },
  ];

  const moreItems = [
    { href: `/shop/${shopId}/staff`, label: 'Staff', icon: UserCog },
    { href: `/shop/${shopId}/loans`, label: 'Loans', icon: Banknote },
    { href: `/shop/${shopId}/khata`, label: 'Khata Book', icon: BookOpen },
    { href: `/shop/${shopId}/loyalty`, label: 'Loyalty', icon: Crown },
    { href: `/shop/${shopId}/settings`, label: 'Settings', icon: Settings },
  ];

  const isMoreActive = moreItems.some(item => isActive(item.href, true));

  return (
    <>
      {/* Overflow Menu (More Tab) */}
      <AnimatePresence>
        {isMoreOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMoreOpen(false)}
              className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
            />
            
            {/* Menu */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed bottom-24 right-4 z-50 w-48 overflow-hidden rounded-2xl bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border border-white/20 shadow-2xl ring-1 ring-black/5"
            >
              <div className="p-2 space-y-1">
                {moreItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMoreOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                      isActive(item.href, true)
                        ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                        : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                    )}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Bottom Navigation Bar */}
      <motion.div
        initial={{ y: 0 }}
        animate={{ y: isVisible ? 0 : 100 }}
        transition={{ type: "spring", damping: 20, stiffness: 300 }}
        className="fixed bottom-6 inset-x-4 z-50 flex justify-center pointer-events-none"
      >
        <nav className="pointer-events-auto flex items-center gap-1 p-1.5 rounded-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-white/20 shadow-lg shadow-black/5 ring-1 ring-black/5 dark:ring-white/10">
          {mainTabs.map((tab) => (
            <Link
              key={tab.id}
              href={tab.href}
              className="relative flex flex-col items-center justify-center w-14 h-14 rounded-full group"
            >
              {tab.active && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-gradient-to-b from-amber-500/20 to-amber-500/5 rounded-full"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              
              <span className={cn(
                "relative z-10 transition-all duration-300",
                tab.active ? "text-amber-600 dark:text-amber-400 -translate-y-1" : "text-gray-500 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-200"
              )}>
                <tab.icon className={cn("w-6 h-6", tab.active && "fill-current")} strokeWidth={tab.active ? 2.5 : 2} />
              </span>
              
              {tab.active && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="absolute bottom-2.5 w-1 h-1 bg-amber-500 rounded-full"
                />
              )}
            </Link>
          ))}

          {/* More Tab */}
          <button
            onClick={() => setIsMoreOpen(!isMoreOpen)}
            className="relative flex flex-col items-center justify-center w-14 h-14 rounded-full group"
          >
            {(isMoreActive || isMoreOpen) && (
              <motion.div
                layoutId="activeTab"
                className="absolute inset-0 bg-gradient-to-b from-amber-500/20 to-amber-500/5 rounded-full"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
            
            <span className={cn(
              "relative z-10 transition-all duration-300",
              (isMoreActive || isMoreOpen) ? "text-amber-600 dark:text-amber-400 -translate-y-1" : "text-gray-500 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-200"
            )}>
              {isMoreOpen ? (
                <X className="w-6 h-6" strokeWidth={2.5} />
              ) : (
                <MoreHorizontal className="w-6 h-6" strokeWidth={2} />
              )}
            </span>

            {(isMoreActive || isMoreOpen) && (
              <motion.span
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute bottom-2.5 w-1 h-1 bg-amber-500 rounded-full"
              />
            )}
          </button>
        </nav>
      </motion.div>
    </>
  );
}
