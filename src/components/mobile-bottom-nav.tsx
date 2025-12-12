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
    Megaphone,
    X,
    Store,
    Plus,
    CreditCard
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export function MobileBottomNav({ shopId }: { shopId: string }) {
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

    const moreItems = [
        { href: `/shop/${shopId}/stock`, label: 'Stock', icon: Package },
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
                            className="fixed bottom-20 right-4 z-50 w-56 overflow-hidden rounded-2xl bg-white/90 dark:bg-[#0c0a09]/95 backdrop-blur-xl border border-[#D4AF37]/20 shadow-2xl ring-1 ring-black/5"
                        >
                            <div className="p-2 space-y-1">
                                {moreItems.map((item) => (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={() => setIsMoreOpen(false)}
                                        className={cn(
                                            "flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-colors",
                                            isActive(item.href, true)
                                                ? "bg-[#D4AF37]/10 text-[#D4AF37] dark:text-[#D4AF37]"
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

            {/* Fixed Bottom Glass Bar */}
            <div className={cn(
                "fixed bottom-0 left-0 right-0 z-50 bg-white/80 dark:bg-[#0c0a09]/80 backdrop-blur-xl border-t border-[#D4AF37]/20 pb-[env(safe-area-inset-bottom)] transition-transform duration-300 ease-in-out",
                isVisible ? "translate-y-0" : "translate-y-full"
            )}>
                <nav className="flex items-center justify-between px-2 h-16 relative">

                    {/* Left Tabs */}
                    <div className="flex flex-1 justify-around">
                        <Link href={`/shop/${shopId}/dashboard`} className="flex flex-col items-center gap-0.5 p-1 group">
                            <LayoutDashboard className={cn("w-6 h-6 transition-colors", isActive(`/shop/${shopId}/dashboard`) ? "text-[#D4AF37] fill-current" : "text-gray-400 group-hover:text-gray-600 dark:text-gray-500")} strokeWidth={1.5} />
                            <span className={cn("text-[10px] font-medium transition-colors", isActive(`/shop/${shopId}/dashboard`) ? "text-[#D4AF37]" : "text-gray-400")}>Home</span>
                        </Link>
                        <Link href={`/shop/${shopId}/invoices`} className="flex flex-col items-center gap-0.5 p-1 group">
                            <FileText className={cn("w-6 h-6 transition-colors", isActive(`/shop/${shopId}/invoices`, true) ? "text-[#D4AF37] fill-current" : "text-gray-400 group-hover:text-gray-600 dark:text-gray-500")} strokeWidth={1.5} />
                            <span className={cn("text-[10px] font-medium transition-colors", isActive(`/shop/${shopId}/invoices`, true) ? "text-[#D4AF37]" : "text-gray-400")}>Invoices</span>
                        </Link>
                    </div>

                    {/* Center FAB (New Invoice) */}
                    <div className="-mt-8 mx-2 relative z-10">
                        <Link
                            href={`/shop/${shopId}/invoices/new`}
                            className="flex flex-col items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-[#D4AF37] to-amber-600 shadow-[0_4px_14px_0_rgba(212,175,55,0.39)] hover:scale-105 active:scale-95 transition-transform border-4 border-white dark:border-[#0c0a09]"
                        >
                            <Plus className="w-7 h-7 text-white" strokeWidth={2.5} />
                        </Link>
                    </div>

                    {/* Right Tabs */}
                    <div className="flex flex-1 justify-around">
                        <Link href={`/shop/${shopId}/customers`} className="flex flex-col items-center gap-0.5 p-1 group">
                            <Users className={cn("w-6 h-6 transition-colors", isActive(`/shop/${shopId}/customers`) ? "text-[#D4AF37] fill-current" : "text-gray-400 group-hover:text-gray-600 dark:text-gray-500")} strokeWidth={1.5} />
                            <span className={cn("text-[10px] font-medium transition-colors", isActive(`/shop/${shopId}/customers`) ? "text-[#D4AF37]" : "text-gray-400")}>Clients</span>
                        </Link>

                        <button
                            onClick={() => setIsMoreOpen(!isMoreOpen)}
                            className="flex flex-col items-center gap-0.5 p-1 group"
                        >
                            <div className={cn("relative transition-colors", (isMoreActive || isMoreOpen) ? "text-[#D4AF37]" : "text-gray-400 group-hover:text-gray-600 dark:text-gray-500")}>
                                {isMoreOpen ? <X className="w-6 h-6" strokeWidth={1.5} /> : <MoreHorizontal className="w-6 h-6" strokeWidth={1.5} />}
                            </div>
                            <span className={cn("text-[10px] font-medium transition-colors", (isMoreActive || isMoreOpen) ? "text-[#D4AF37]" : "text-gray-400")}>More</span>
                        </button>
                    </div>

                </nav>
            </div>
        </>
    );
}
