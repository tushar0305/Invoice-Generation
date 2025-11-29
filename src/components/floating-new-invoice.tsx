'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Plus, FileText, Package, Camera, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';

/**
 * Contextual Floating Action Button (Speed Dial)
 * - Dashboard/Invoices: Speed Dial (Scan vs Manual)
 * - Stock: Add Stock Item
 */
export function FloatingNewInvoiceButton({ shopId }: { shopId: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  const style = {
    // On mobile, place above the floating bottom nav
    // Nav height (~16) + nav bottom padding (0.75rem) + gap (1rem) + safe area
    ['--fab-bottom' as any]: 'calc(5.5rem + env(safe-area-inset-bottom))',
  };

  const baseClassName = "fixed right-5 bottom-[var(--fab-bottom)] md:bottom-6 z-[100] inline-flex items-center justify-center rounded-full shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 active:scale-95 h-14 w-14 md:h-12 md:w-12 transition-transform";

  // Hide FAB on calculator screen completely
  if (pathname === `/shop/${shopId}/calculator`) {
    return null;
  }

  // Stock Page: Simple Add Button
  if (pathname === `/shop/${shopId}/stock`) {
    return (
      <Button
        onClick={() => router.push(`/shop/${shopId}/stock?action=add`)}
        aria-label="Add Stock Item"
        style={style}
        className={cn(baseClassName, "bg-[#D4AF37] hover:bg-[#C5A028] text-white")}
      >
        <Plus className="h-6 w-6 md:h-5 w-5" />
      </Button>
    );
  }

  // Hide on specific pages
  if (pathname.includes('/new') || pathname.includes('/edit') || pathname === `/shop/${shopId}/settings` || pathname === `/shop/${shopId}/invoices/scan`) {
    return null;
  }

  // Default: Speed Dial for Invoices
  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
          />
        )}
      </AnimatePresence>

      <div
        style={style}
        className="fixed right-5 bottom-[var(--fab-bottom)] md:bottom-6 z-[100] flex flex-col items-end gap-3"
      >
        <AnimatePresence>
          {isOpen && (
            <>
              {/* Scan Invoice Option */}
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.8 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 500, damping: 30 }}
              >
                <Link
                  href={`/shop/${shopId}/invoices/scan`}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 group"
                >
                  <span className="bg-background/40 backdrop-blur-2xl text-foreground px-4 py-2 rounded-2xl shadow-lg border border-border/10 text-sm font-medium hidden md:block transition-all duration-300 hover:bg-background/60 hover:scale-105">
                    Scan Invoice
                  </span>
                  <div className="h-14 w-14 rounded-2xl bg-blue-600/90 backdrop-blur-xl text-white shadow-2xl shadow-blue-500/30 flex items-center justify-center transition-all duration-300 hover:bg-blue-600 hover:scale-110 active:scale-95 border border-blue-400/20">
                    <Camera className="h-6 w-6" />
                  </div>
                </Link>
              </motion.div>

              {/* Manual Invoice Option */}
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.8 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              >
                <Link
                  href={`/shop/${shopId}/invoices/new`}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 group"
                >
                  <span className="bg-background/40 backdrop-blur-2xl text-foreground px-4 py-2 rounded-2xl shadow-lg border border-border/10 text-sm font-medium hidden md:block transition-all duration-300 hover:bg-background/60 hover:scale-105">
                    Create Manually
                  </span>
                  <div className="h-14 w-14 rounded-2xl bg-emerald-600/90 backdrop-blur-xl text-white shadow-2xl shadow-emerald-500/30 flex items-center justify-center transition-all duration-300 hover:bg-emerald-600 hover:scale-110 active:scale-95 border border-emerald-400/20">
                    <FileText className="h-6 w-6" />
                  </div>
                </Link>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Main Toggle Button - Enhanced Visibility */}
        <Button
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Create New Invoice"
          className={cn(
            "h-14 w-14 rounded-3xl shadow-2xl transition-all duration-300 ease-out border-2",
            isOpen
              ? "bg-background/60 backdrop-blur-2xl text-muted-foreground rotate-45 scale-95 border-border/30 ring-2 ring-border/10"
              : "bg-background/60 backdrop-blur-2xl text-foreground hover:bg-background/80 hover:scale-110 active:scale-95 shadow-black/20 border-border/30 ring-2 ring-white/10"
          )}
          style={{
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          }}
        >
          <Plus className="h-6 w-6" />
        </Button>
      </div>
    </>
  );
}
