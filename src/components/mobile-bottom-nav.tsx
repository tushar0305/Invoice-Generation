'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    FileText,
    Users,
    MoreHorizontal,
    UserCog,
    Banknote,
    BookOpen,
    Crown,
    Settings,
    Plus,
    QrCode,
    PiggyBank,
    TrendingUp
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";

export function MobileBottomNav({ shopId }: { shopId: string }) {
    const pathname = usePathname();
    const [isVisible, setIsVisible] = useState(true);
    const lastScrollY = useRef(0);
    const [isOpen, setIsOpen] = useState(false);
    const [navigatingTo, setNavigatingTo] = useState<string | null>(null);

    // Reset navigating state when pathname changes
    useEffect(() => {
        setNavigatingTo(null);
    }, [pathname]);

    const handleNavClick = (href: string) => {
        if (pathname !== href) {
            setNavigatingTo(href);
            if (navigator.vibrate) navigator.vibrate(10);
        }
    };

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
        { href: `/shop/${shopId}/customers`, label: 'Customers', icon: Users },
        { href: `/shop/${shopId}/schemes`, label: 'Schemes', icon: PiggyBank },
        { href: `/shop/${shopId}/staff`, label: 'Staff', icon: UserCog },
        { href: `/shop/${shopId}/loans`, label: 'Loans', icon: Banknote },
        { href: `/shop/${shopId}/khata`, label: 'Khata Book', icon: BookOpen },
        { href: `/shop/${shopId}/loyalty`, label: 'Loyalty', icon: Crown },
        { href: `/shop/${shopId}/insights`, label: 'Analytics', icon: TrendingUp },
        { href: `/shop/${shopId}/settings`, label: 'Settings', icon: Settings },
    ];

    const isMoreActive = moreItems.some(item => isActive(item.href, true));

    return (
        <div className={cn(
            "fixed bottom-0 left-0 right-0 z-50 pb-[env(safe-area-inset-bottom)] transition-all duration-500 ease-out",
            isVisible ? "translate-y-0" : "translate-y-full"
        )}>
            {/* iPhone 17 Style Navigation Bar */}
            <div className="mx-3 mb-2">
                <div className="relative overflow-hidden rounded-[28px] shadow-[0_8px_32px_0_rgba(0,0,0,0.12)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.4)]">
                    {/* Glass Background with Gradient - Updated for Dark Theme alignment */}
                    <div className="absolute inset-0 bg-gradient-to-b from-white/90 via-white/80 to-white/70 dark:from-black/90 dark:via-black/80 dark:to-black/70 backdrop-blur-2xl" />

                    {/* Subtle Top Border Glow */}
                    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/60 dark:via-white/20 to-transparent" />

                    <nav className="relative flex items-center justify-between px-4 h-[72px]">
                        {/* Left Tabs */}
                        <div className="flex flex-1 justify-around items-center">
                            <Link
                                href={`/shop/${shopId}/dashboard`}
                                onClick={() => handleNavClick(`/shop/${shopId}/dashboard`)}
                                className="flex flex-col items-center gap-1 p-2 group relative"
                            >
                                {isActive(`/shop/${shopId}/dashboard`) && (
                                    <div className="absolute inset-0 bg-gradient-to-b from-[#D4AF37]/20 to-[#D4AF37]/5 rounded-2xl scale-110 blur-sm" />
                                )}
                                {navigatingTo === `/shop/${shopId}/dashboard` && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-black/50 rounded-2xl z-10">
                                        <div className="w-4 h-4 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
                                    </div>
                                )}
                                <div className={cn(
                                    "relative flex items-center justify-center w-11 h-11 rounded-2xl transition-all duration-300",
                                    isActive(`/shop/${shopId}/dashboard`)
                                        ? "bg-gradient-to-br from-[#D4AF37]/20 to-amber-600/20 shadow-lg shadow-[#D4AF37]/20"
                                        : "group-hover:bg-gray-100/50 dark:group-hover:bg-white/5"
                                )}>
                                    <LayoutDashboard className={cn(
                                        "w-5 h-5 transition-all duration-300",
                                        isActive(`/shop/${shopId}/dashboard`)
                                            ? "text-[#D4AF37] drop-shadow-sm"
                                            : "text-gray-500 dark:text-gray-400"
                                    )} strokeWidth={2} />
                                </div>
                                <span className={cn(
                                    "text-[10px] font-semibold transition-all duration-300",
                                    isActive(`/shop/${shopId}/dashboard`)
                                        ? "text-[#D4AF37]"
                                        : "text-gray-500 dark:text-gray-400"
                                )}>Home</span>
                            </Link>

                            <Link
                                href={`/shop/${shopId}/invoices`}
                                onClick={() => handleNavClick(`/shop/${shopId}/invoices`)}
                                className="flex flex-col items-center gap-1 p-2 group relative"
                            >
                                {isActive(`/shop/${shopId}/invoices`, true) && (
                                    <div className="absolute inset-0 bg-gradient-to-b from-[#D4AF37]/20 to-[#D4AF37]/5 rounded-2xl scale-110 blur-sm" />
                                )}
                                {navigatingTo === `/shop/${shopId}/invoices` && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-black/50 rounded-2xl z-10">
                                        <div className="w-4 h-4 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
                                    </div>
                                )}
                                <div className={cn(
                                    "relative flex items-center justify-center w-11 h-11 rounded-2xl transition-all duration-300",
                                    isActive(`/shop/${shopId}/invoices`, true)
                                        ? "bg-gradient-to-br from-[#D4AF37]/20 to-amber-600/20 shadow-lg shadow-[#D4AF37]/20"
                                        : "group-hover:bg-gray-100/50 dark:group-hover:bg-white/5"
                                )}>
                                    <FileText className={cn(
                                        "w-5 h-5 transition-all duration-300",
                                        isActive(`/shop/${shopId}/invoices`, true)
                                            ? "text-[#D4AF37] drop-shadow-sm"
                                            : "text-gray-500 dark:text-gray-400"
                                    )} strokeWidth={2} />
                                </div>
                                <span className={cn(
                                    "text-[10px] font-semibold transition-all duration-300",
                                    isActive(`/shop/${shopId}/invoices`, true)
                                        ? "text-[#D4AF37]"
                                        : "text-gray-500 dark:text-gray-400"
                                )}>Invoices</span>
                            </Link>
                        </div>

                        {/* Center FAB - Floating Action Button */}
                        <div className="mx-3 relative">
                            <Link
                                href={`/shop/${shopId}/invoices/new`}
                                onClick={() => handleNavClick(`/shop/${shopId}/invoices/new`)}
                                className="relative group"
                            >
                                {/* Glow Effect */}
                                {navigatingTo === `/shop/${shopId}/invoices/new` && (
                                    <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/10 rounded-full">
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    </div>
                                )}
                                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#D4AF37] to-amber-600 blur-xl opacity-40 group-hover:opacity-60 transition-opacity" />

                                {/* Button */}
                                <div className="relative flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-[#D4AF37] via-amber-500 to-amber-600 shadow-2xl shadow-[#D4AF37]/40 group-hover:scale-105 group-active:scale-95 transition-all duration-300 border-[3px] border-white/30 dark:border-white/20">
                                    <Plus className="w-7 h-7 text-white drop-shadow-md" strokeWidth={3} />
                                </div>
                            </Link>
                        </div>

                        {/* Right Tabs */}
                        <div className="flex flex-1 justify-around items-center">
                            <Link
                                href={`/shop/${shopId}/inventory`}
                                onClick={() => handleNavClick(`/shop/${shopId}/inventory`)}
                                className="flex flex-col items-center gap-1 p-2 group relative"
                            >
                                {isActive(`/shop/${shopId}/inventory`, true) && (
                                    <div className="absolute inset-0 bg-gradient-to-b from-[#D4AF37]/20 to-[#D4AF37]/5 rounded-2xl scale-110 blur-sm" />
                                )}
                                {navigatingTo === `/shop/${shopId}/inventory` && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-black/50 rounded-2xl z-10">
                                        <div className="w-4 h-4 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
                                    </div>
                                )}
                                <div className={cn(
                                    "relative flex items-center justify-center w-11 h-11 rounded-2xl transition-all duration-300",
                                    isActive(`/shop/${shopId}/inventory`, true)
                                        ? "bg-gradient-to-br from-[#D4AF37]/20 to-amber-600/20 shadow-lg shadow-[#D4AF37]/20"
                                        : "group-hover:bg-gray-100/50 dark:group-hover:bg-white/5"
                                )}>
                                    <QrCode className={cn(
                                        "w-5 h-5 transition-all duration-300",
                                        isActive(`/shop/${shopId}/inventory`, true)
                                            ? "text-[#D4AF37] drop-shadow-sm"
                                            : "text-gray-500 dark:text-gray-400"
                                    )} strokeWidth={2} />
                                </div>
                                <span className={cn(
                                    "text-[10px] font-semibold transition-all duration-300",
                                    isActive(`/shop/${shopId}/inventory`, true)
                                        ? "text-[#D4AF37]"
                                        : "text-gray-500 dark:text-gray-400"
                                )}>Inventory</span>
                            </Link>

                            <Sheet open={isOpen} onOpenChange={setIsOpen}>
                                <SheetTrigger asChild>
                                    <button
                                        className="flex flex-col items-center gap-1 p-2 group relative"
                                    >
                                        {(isMoreActive || isOpen) && (
                                            <div className="absolute inset-0 bg-gradient-to-b from-[#D4AF37]/20 to-[#D4AF37]/5 rounded-2xl scale-110 blur-sm" />
                                        )}
                                        <div className={cn(
                                            "relative flex items-center justify-center w-11 h-11 rounded-2xl transition-all duration-300",
                                            (isMoreActive || isOpen)
                                                ? "bg-gradient-to-br from-[#D4AF37]/20 to-amber-600/20 shadow-lg shadow-[#D4AF37]/20"
                                                : "group-hover:bg-gray-100/50 dark:group-hover:bg-white/5"
                                        )}>
                                            <MoreHorizontal className={cn(
                                                "w-5 h-5 transition-all duration-300",
                                                (isMoreActive || isOpen)
                                                    ? "text-[#D4AF37] drop-shadow-sm"
                                                    : "text-gray-500 dark:text-gray-400"
                                            )} strokeWidth={2} />
                                        </div>
                                        <span className={cn(
                                            "text-[10px] font-semibold transition-all duration-300",
                                            (isMoreActive || isOpen)
                                                ? "text-[#D4AF37]"
                                                : "text-gray-500 dark:text-gray-400"
                                        )}>More</span>
                                    </button>
                                </SheetTrigger>
                                <SheetContent side="bottom" className="rounded-t-[32px] p-0 bg-white/95 dark:bg-[#0a0a0b]/95 backdrop-blur-2xl border-t border-gray-200/50 dark:border-white/10 shadow-2xl">
                                    <SheetHeader className="p-6 border-b border-gray-100 dark:border-white/5">
                                        <div className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full mx-auto mb-4" />
                                        <SheetTitle className="text-center text-base font-bold text-gray-900 dark:text-white">Quick Menu</SheetTitle>
                                    </SheetHeader>
                                    <div className="grid grid-cols-4 gap-4 p-6 pb-8">
                                        {moreItems.map((item) => (
                                            <Link
                                                key={item.href}
                                                href={item.href}
                                                onClick={() => {
                                                    setIsOpen(false);
                                                }}
                                                className="flex flex-col items-center gap-2.5 group"
                                            >
                                                <div className={cn(
                                                    "flex items-center justify-center w-14 h-14 rounded-3xl transition-all duration-300 shadow-lg",
                                                    isActive(item.href, true)
                                                        ? "bg-gradient-to-br from-[#D4AF37] to-amber-600 text-white shadow-[#D4AF37]/30"
                                                        : "bg-gradient-to-br from-gray-100 to-gray-200 dark:from-white/5 dark:to-white/10 text-gray-600 dark:text-gray-300 group-hover:scale-105"
                                                )}>
                                                    <item.icon className="w-6 h-6" strokeWidth={2} />
                                                </div>
                                                <span className={cn(
                                                    "text-[11px] font-semibold text-center leading-tight",
                                                    isActive(item.href, true) ? "text-[#D4AF37]" : "text-gray-700 dark:text-gray-300"
                                                )}>
                                                    {item.label}
                                                </span>
                                            </Link>
                                        ))}
                                    </div>
                                </SheetContent>
                            </Sheet>
                        </div>
                    </nav>
                </div>
            </div>
        </div>
    );
}
