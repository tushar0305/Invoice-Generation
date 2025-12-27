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
            "fixed bottom-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out",
            isVisible ? "translate-y-0" : "translate-y-full"
        )}>
            {/* Glassmorphism Background */}
            <div className="absolute inset-0 bg-background/80 backdrop-blur-xl border-t border-border/50 shadow-[0_-4px_20px_-4px_rgba(0,0,0,0.1)] dark:shadow-[0_-4px_20px_-4px_rgba(0,0,0,0.3)]" />

            <div className="relative flex items-center justify-between h-[60px] px-2" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)', height: 'calc(60px + env(safe-area-inset-bottom, 0px))' }}>
                {/* Home */}
                <Link
                    href={`/shop/${shopId}/dashboard`}
                    onClick={() => handleNavClick(`/shop/${shopId}/dashboard`)}
                    className="flex-1 flex flex-col items-center justify-center gap-1 h-full relative group"
                >
                    <div className={cn(
                        "p-1.5 rounded-xl transition-all duration-300",
                        isActive(`/shop/${shopId}/dashboard`) ? "bg-primary/10 text-primary" : "text-muted-foreground group-hover:text-foreground"
                    )}>
                        <LayoutDashboard className="w-5 h-5" strokeWidth={isActive(`/shop/${shopId}/dashboard`) ? 2.5 : 2} />
                    </div>
                    <span className={cn(
                        "text-[10px] font-medium transition-colors duration-300",
                        isActive(`/shop/${shopId}/dashboard`) ? "text-primary" : "text-muted-foreground"
                    )}>Home</span>
                </Link>

                {/* Bills */}
                <Link
                    href={`/shop/${shopId}/invoices`}
                    onClick={() => handleNavClick(`/shop/${shopId}/invoices`)}
                    className="flex-1 flex flex-col items-center justify-center gap-1 h-full relative group"
                >
                    <div className={cn(
                        "p-1.5 rounded-xl transition-all duration-300",
                        isActive(`/shop/${shopId}/invoices`, true) ? "bg-primary/10 text-primary" : "text-muted-foreground group-hover:text-foreground"
                    )}>
                        <FileText className="w-5 h-5" strokeWidth={isActive(`/shop/${shopId}/invoices`, true) ? 2.5 : 2} />
                    </div>
                    <span className={cn(
                        "text-[10px] font-medium transition-colors duration-300",
                        isActive(`/shop/${shopId}/invoices`, true) ? "text-primary" : "text-muted-foreground"
                    )}>Invoices</span>
                </Link>

                {/* Center FAB - Floating Action Button */}
                <div className="relative -top-5">
                    <Link
                        href={`/shop/${shopId}/invoices/new`}
                        onClick={() => handleNavClick(`/shop/${shopId}/invoices/new`)}
                        className="flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-primary to-primary/90 text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:scale-105 active:scale-95 transition-all duration-300 border-4 border-background"
                    >
                        <Plus className="w-7 h-7" strokeWidth={2.5} />
                    </Link>
                </div>

                {/* Stock */}
                <Link
                    href={`/shop/${shopId}/inventory`}
                    onClick={() => handleNavClick(`/shop/${shopId}/inventory`)}
                    className="flex-1 flex flex-col items-center justify-center gap-1 h-full relative group"
                >
                    <div className={cn(
                        "p-1.5 rounded-xl transition-all duration-300",
                        isActive(`/shop/${shopId}/inventory`, true) ? "bg-primary/10 text-primary" : "text-muted-foreground group-hover:text-foreground"
                    )}>
                        <QrCode className="w-5 h-5" strokeWidth={isActive(`/shop/${shopId}/inventory`, true) ? 2.5 : 2} />
                    </div>
                    <span className={cn(
                        "text-[10px] font-medium transition-colors duration-300",
                        isActive(`/shop/${shopId}/inventory`, true) ? "text-primary" : "text-muted-foreground"
                    )}>Stock</span>
                </Link>

                {/* More */}
                <Sheet open={isOpen} onOpenChange={setIsOpen}>
                    <SheetTrigger asChild>
                        <button className="flex-1 flex flex-col items-center justify-center gap-1 h-full relative group">
                            <div className={cn(
                                "p-1.5 rounded-xl transition-all duration-300",
                                (isMoreActive || isOpen) ? "bg-primary/10 text-primary" : "text-muted-foreground group-hover:text-foreground"
                            )}>
                                <MoreHorizontal className="w-5 h-5" strokeWidth={(isMoreActive || isOpen) ? 2.5 : 2} />
                            </div>
                            <span className={cn(
                                "text-[10px] font-medium transition-colors duration-300",
                                (isMoreActive || isOpen) ? "text-primary" : "text-muted-foreground"
                            )}>More</span>
                        </button>
                    </SheetTrigger>
                    <SheetContent side="bottom" className="rounded-t-[2rem] px-0 pb-8 border-t-0 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.2)]">
                        <div className="w-12 h-1.5 bg-muted-foreground/20 rounded-full mx-auto mb-6 mt-2" />
                        <SheetHeader className="px-6 pb-4 text-left">
                            <SheetTitle className="text-lg font-bold">Menu</SheetTitle>
                        </SheetHeader>
                        <div className="grid grid-cols-4 gap-y-6 px-4">
                            {moreItems.map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setIsOpen(false)}
                                    className="flex flex-col items-center gap-2 group"
                                >
                                    <div className={cn(
                                        "flex items-center justify-center w-12 h-12 rounded-2xl transition-all duration-300",
                                        isActive(item.href, true)
                                            ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                                            : "bg-muted/50 text-muted-foreground group-hover:bg-muted group-hover:text-foreground"
                                    )}>
                                        <item.icon className="w-6 h-6" strokeWidth={1.8} />
                                    </div>
                                    <span className={cn(
                                        "text-xs font-medium text-center transition-colors",
                                        isActive(item.href, true) ? "text-primary" : "text-muted-foreground"
                                    )}>{item.label}</span>
                                </Link>
                            ))}
                        </div>
                    </SheetContent>
                </Sheet>
            </div>
        </nav >
    );
}
