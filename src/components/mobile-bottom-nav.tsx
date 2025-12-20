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
        <nav className={cn(
            "fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border transition-transform duration-200",
            isVisible ? "translate-y-0" : "translate-y-full"
        )}>
            <div className="flex items-stretch h-16" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
                {/* Home */}
                <Link
                    href={`/shop/${shopId}/dashboard`}
                    onClick={() => handleNavClick(`/shop/${shopId}/dashboard`)}
                    className="flex-1 flex flex-col items-center justify-center gap-0.5"
                >
                    <LayoutDashboard className={cn(
                        "w-5 h-5",
                        isActive(`/shop/${shopId}/dashboard`) ? "text-primary" : "text-muted-foreground"
                    )} strokeWidth={1.8} />
                    <span className={cn(
                        "text-[10px]",
                        isActive(`/shop/${shopId}/dashboard`) ? "text-primary font-semibold" : "text-muted-foreground"
                    )}>Home</span>
                </Link>

                {/* Bills */}
                <Link
                    href={`/shop/${shopId}/invoices`}
                    onClick={() => handleNavClick(`/shop/${shopId}/invoices`)}
                    className="flex-1 flex flex-col items-center justify-center gap-0.5"
                >
                    <FileText className={cn(
                        "w-5 h-5",
                        isActive(`/shop/${shopId}/invoices`, true) ? "text-primary" : "text-muted-foreground"
                    )} strokeWidth={1.8} />
                    <span className={cn(
                        "text-[10px]",
                        isActive(`/shop/${shopId}/invoices`, true) ? "text-primary font-semibold" : "text-muted-foreground"
                    )}>Bills</span>
                </Link>

                {/* Center FAB */}
                <div className="flex items-center justify-center px-2">
                    <Link
                        href={`/shop/${shopId}/invoices/new`}
                        onClick={() => handleNavClick(`/shop/${shopId}/invoices/new`)}
                        className="flex items-center justify-center w-12 h-12 -mt-4 rounded-full bg-primary shadow-lg active:scale-95 transition-transform"
                    >
                        <Plus className="w-6 h-6 text-primary-foreground" strokeWidth={2.5} />
                    </Link>
                </div>

                {/* Stock */}
                <Link
                    href={`/shop/${shopId}/inventory`}
                    onClick={() => handleNavClick(`/shop/${shopId}/inventory`)}
                    className="flex-1 flex flex-col items-center justify-center gap-0.5"
                >
                    <QrCode className={cn(
                        "w-5 h-5",
                        isActive(`/shop/${shopId}/inventory`, true) ? "text-primary" : "text-muted-foreground"
                    )} strokeWidth={1.8} />
                    <span className={cn(
                        "text-[10px]",
                        isActive(`/shop/${shopId}/inventory`, true) ? "text-primary font-semibold" : "text-muted-foreground"
                    )}>Stock</span>
                </Link>

                {/* More */}
                <Sheet open={isOpen} onOpenChange={setIsOpen}>
                    <SheetTrigger asChild>
                        <button className="flex-1 flex flex-col items-center justify-center gap-0.5">
                            <MoreHorizontal className={cn(
                                "w-5 h-5",
                                (isMoreActive || isOpen) ? "text-primary" : "text-muted-foreground"
                            )} strokeWidth={1.8} />
                            <span className={cn(
                                "text-[10px]",
                                (isMoreActive || isOpen) ? "text-primary font-semibold" : "text-muted-foreground"
                            )}>More</span>
                        </button>
                    </SheetTrigger>
                    <SheetContent side="bottom" className="rounded-t-2xl px-0 pb-8">
                        <div className="w-8 h-1 bg-muted-foreground/30 rounded-full mx-auto mb-4" />
                        <SheetHeader className="px-4 pb-3">
                            <SheetTitle className="text-sm font-semibold text-left">Menu</SheetTitle>
                        </SheetHeader>
                        <div className="space-y-0.5">
                            {moreItems.map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setIsOpen(false)}
                                    className={cn(
                                        "flex items-center gap-3 mx-2 px-3 py-2.5 rounded-lg transition-colors",
                                        isActive(item.href, true)
                                            ? "bg-primary/10 text-primary"
                                            : "text-foreground active:bg-muted"
                                    )}
                                >
                                    <item.icon className="w-5 h-5" strokeWidth={1.8} />
                                    <span className="text-sm font-medium">{item.label}</span>
                                </Link>
                            ))}
                        </div>
                    </SheetContent>
                </Sheet>
            </div>
        </nav>
    );
}
