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
    PiggyBank
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useHaptic } from '@/hooks/use-haptic';
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
    const { vibrate } = useHaptic();
    const [isOpen, setIsOpen] = useState(false);

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
        { href: `/shop/${shopId}/settings`, label: 'Settings', icon: Settings },
    ];

    const isMoreActive = moreItems.some(item => isActive(item.href, true));

    return (
        <div className={cn(
            "fixed bottom-0 left-0 right-0 z-50 bg-white/80 dark:bg-[#0c0a09]/80 backdrop-blur-xl border-t border-[#D4AF37]/20 pb-[env(safe-area-inset-bottom)] transition-transform duration-300 ease-in-out",
            isVisible ? "translate-y-0" : "translate-y-full"
        )}>
            <nav className="flex items-center justify-between px-2 h-16 relative">

                {/* Left Tabs */}
                <div className="flex flex-1 justify-around">
                    <Link
                        href={`/shop/${shopId}/dashboard`}
                        onClick={() => vibrate('light')}
                        className="flex flex-col items-center gap-0.5 p-1 group"
                    >
                        <LayoutDashboard className={cn("w-6 h-6 transition-colors", isActive(`/shop/${shopId}/dashboard`) ? "text-[#D4AF37] fill-current" : "text-gray-400 group-hover:text-gray-600 dark:text-gray-500")} strokeWidth={1.5} />
                        <span className={cn("text-[10px] font-medium transition-colors", isActive(`/shop/${shopId}/dashboard`) ? "text-[#D4AF37]" : "text-gray-400")}>Home</span>
                    </Link>
                    <Link
                        href={`/shop/${shopId}/invoices`}
                        onClick={() => vibrate('light')}
                        className="flex flex-col items-center gap-0.5 p-1 group"
                    >
                        <FileText className={cn("w-6 h-6 transition-colors", isActive(`/shop/${shopId}/invoices`, true) ? "text-[#D4AF37] fill-current" : "text-gray-400 group-hover:text-gray-600 dark:text-gray-500")} strokeWidth={1.5} />
                        <span className={cn("text-[10px] font-medium transition-colors", isActive(`/shop/${shopId}/invoices`, true) ? "text-[#D4AF37]" : "text-gray-400")}>Invoices</span>
                    </Link>
                </div>

                {/* Center FAB (New Invoice) */}
                <div className="-mt-8 mx-2 relative z-10">
                    <Link
                        href={`/shop/${shopId}/invoices/new`}
                        onClick={() => vibrate('medium')}
                        className="flex flex-col items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-[#D4AF37] to-amber-600 shadow-[0_4px_14px_0_rgba(212,175,55,0.39)] hover:scale-105 active:scale-95 transition-transform border-4 border-white dark:border-[#0c0a09]"
                    >
                        <Plus className="w-7 h-7 text-white" strokeWidth={2.5} />
                    </Link>
                </div>

                {/* Right Tabs */}
                <div className="flex flex-1 justify-around">
                    <Link
                        href={`/shop/${shopId}/inventory`}
                        onClick={() => vibrate('light')}
                        className="flex flex-col items-center gap-0.5 p-1 group"
                    >
                        <QrCode className={cn("w-6 h-6 transition-colors", isActive(`/shop/${shopId}/inventory`, true) ? "text-[#D4AF37] fill-current" : "text-gray-400 group-hover:text-gray-600 dark:text-gray-500")} strokeWidth={1.5} />
                        <span className={cn("text-[10px] font-medium transition-colors", isActive(`/shop/${shopId}/inventory`, true) ? "text-[#D4AF37]" : "text-gray-400")}>Inventory</span>
                    </Link>

                    <Sheet open={isOpen} onOpenChange={setIsOpen}>
                        <SheetTrigger asChild>
                            <button
                                onClick={() => vibrate('light')}
                                className="flex flex-col items-center gap-0.5 p-1 group"
                            >
                                <div className={cn("relative transition-colors", (isMoreActive || isOpen) ? "text-[#D4AF37]" : "text-gray-400 group-hover:text-gray-600 dark:text-gray-500")}>
                                    <MoreHorizontal className="w-6 h-6" strokeWidth={1.5} />
                                </div>
                                <span className={cn("text-[10px] font-medium transition-colors", (isMoreActive || isOpen) ? "text-[#D4AF37]" : "text-gray-400")}>More</span>
                            </button>
                        </SheetTrigger>
                        <SheetContent side="bottom" className="rounded-t-[20px] p-0 bg-white/95 dark:bg-[#0c0a09]/95 backdrop-blur-xl border-t border-[#D4AF37]/20">
                            <SheetHeader className="p-4 border-b border-gray-100 dark:border-white/5">
                                <SheetTitle className="text-center text-sm font-medium text-muted-foreground">Menu</SheetTitle>
                            </SheetHeader>
                            <div className="grid grid-cols-4 gap-4 p-6">
                                {moreItems.map((item) => (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={() => {
                                            vibrate('light');
                                            setIsOpen(false);
                                        }}
                                        className="flex flex-col items-center gap-2"
                                    >
                                        <div className={cn(
                                            "flex items-center justify-center w-12 h-12 rounded-2xl transition-all",
                                            isActive(item.href, true)
                                                ? "bg-[#D4AF37]/10 text-[#D4AF37]"
                                                : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                                        )}>
                                            <item.icon className="w-6 h-6" strokeWidth={1.5} />
                                        </div>
                                        <span className={cn(
                                            "text-xs font-medium text-center",
                                            isActive(item.href, true) ? "text-[#D4AF37]" : "text-gray-600 dark:text-gray-400"
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
    );
}
