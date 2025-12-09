'use client';

import { useState } from 'react';
import {
    Search,
    Bell,
    LogOut,
    Settings as SettingsIcon,
    Building2,
    ChevronRight,
    Plus,
    Sparkles,
    Command
} from 'lucide-react';
import { GlobalSearch } from '@/components/global-search';
import { NotificationCenter } from '@/components/notification-center';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useRouter, usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface PremiumHeaderProps {
    shopName: string;
    shopId: string;
    userId: string;
    userEmail: string | null;
    logoUrl?: string | null;
}

export function PremiumHeader({ shopName, shopId, userId, userEmail, logoUrl }: PremiumHeaderProps) {
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const router = useRouter();
    const pathname = usePathname();

    const handleLogout = async () => {
        const { supabase } = await import('@/supabase/client');
        await supabase.auth.signOut();
        router.push('/login');
    };

    const getUserInitials = () => {
        if (!userEmail) return 'U';
        return userEmail.charAt(0).toUpperCase();
    };

    // Get breadcrumb data from pathname
    const getBreadcrumb = () => {
        const segments: { label: string; href?: string }[] = [
            { label: shopName, href: `/shop/${shopId}/dashboard` }
        ];

        if (pathname.includes('/dashboard')) {
            segments.push({ label: 'Dashboard' });
        } else if (pathname.includes('/invoices/new')) {
            segments.push({ label: 'Invoices', href: `/shop/${shopId}/invoices` });
            segments.push({ label: 'New Invoice' });
        } else if (pathname.includes('/invoices/edit')) {
            segments.push({ label: 'Invoices', href: `/shop/${shopId}/invoices` });
            segments.push({ label: 'Edit Invoice' });
        } else if (pathname.includes('/invoices/view')) {
            segments.push({ label: 'Invoices', href: `/shop/${shopId}/invoices` });
            segments.push({ label: 'Details' });
        } else if (pathname.includes('/invoices')) {
            segments.push({ label: 'Invoices' });
        } else if (pathname.includes('/customers/view')) {
            segments.push({ label: 'Customers', href: `/shop/${shopId}/customers` });
            segments.push({ label: 'Details' });
        } else if (pathname.includes('/customers/new')) {
            segments.push({ label: 'Customers', href: `/shop/${shopId}/customers` });
            segments.push({ label: 'New Customer' });
        } else if (pathname.includes('/customers')) {
            segments.push({ label: 'Customers' });
        } else if (pathname.includes('/stock/new')) {
            segments.push({ label: 'Stock', href: `/shop/${shopId}/stock` });
            segments.push({ label: 'Add Item' });
        } else if (pathname.includes('/stock')) {
            segments.push({ label: 'Stock' });
        } else if (pathname.includes('/staff')) {
            segments.push({ label: 'Staff' });
        } else if (pathname.includes('/khata')) {
            segments.push({ label: 'Khata Book' });
        } else if (pathname.includes('/loans/new')) {
            segments.push({ label: 'Loans', href: `/shop/${shopId}/loans` });
            segments.push({ label: 'New Loan' });
        } else if (pathname.includes('/loans')) {
            segments.push({ label: 'Loans' });
        } else if (pathname.includes('/loyalty')) {
            segments.push({ label: 'Loyalty' });
        } else if (pathname.includes('/insights')) {
            segments.push({ label: 'Insights' });
        } else if (pathname.includes('/templates')) {
            segments.push({ label: 'Templates' });
        } else if (pathname.includes('/settings')) {
            segments.push({ label: 'Settings' });
        }

        return segments;
    };

    const breadcrumb = getBreadcrumb();

    return (
        <>
            {/* Premium Header */}
            <motion.header
                initial={{ y: -10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="hidden md:flex items-center justify-between w-full"
            >
                {/* Left: Breadcrumb Navigation */}
                <div className="flex items-center gap-2">
                    {breadcrumb.map((item, index) => (
                        <div key={index} className="flex items-center gap-2">
                            {index > 0 && (
                                <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
                            )}
                            {item.href && index < breadcrumb.length - 1 ? (
                                <Link
                                    href={item.href}
                                    className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    {item.label}
                                </Link>
                            ) : (
                                <span className={cn(
                                    "text-sm font-semibold",
                                    index === breadcrumb.length - 1
                                        ? "text-foreground"
                                        : "text-muted-foreground"
                                )}>
                                    {item.label}
                                </span>
                            )}
                        </div>
                    ))}
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2">
                    {/* Search Button */}
                    <button
                        onClick={() => setIsSearchOpen(true)}
                        className="flex items-center gap-2 h-9 px-3 bg-muted/50 hover:bg-muted rounded-lg border border-border/50 transition-all duration-200 group"
                    >
                        <Search className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                        <span className="text-sm text-muted-foreground hidden lg:inline">Search...</span>
                        <kbd className="hidden xl:inline-flex h-5 select-none items-center gap-0.5 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground ml-2">
                            <Command className="w-3 h-3" />K
                        </kbd>
                    </button>

                    {/* Divider */}
                    <div className="w-px h-6 bg-border/50 mx-1" />

                    {/* Notifications */}
                    <NotificationCenter shopId={shopId} userId={userId} />

                    {/* User Menu */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-xl hover:bg-muted/80 transition-all duration-200 group">
                                <Avatar className="w-8 h-8 ring-2 ring-primary/20 group-hover:ring-primary/40 transition-all">
                                    {logoUrl ? (
                                        <AvatarImage src={logoUrl} alt={shopName} />
                                    ) : null}
                                    <AvatarFallback className="bg-gradient-to-br from-primary/80 to-primary text-primary-foreground text-sm font-bold">
                                        {getUserInitials()}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="hidden lg:flex flex-col items-start">
                                    <span className="text-sm font-semibold text-foreground leading-tight">
                                        {userEmail?.split('@')[0] || 'User'}
                                    </span>
                                    <span className="text-[10px] text-muted-foreground leading-tight">
                                        {shopName.length > 15 ? shopName.slice(0, 15) + '...' : shopName}
                                    </span>
                                </div>
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            align="end"
                            className="w-60 p-2 bg-popover/95 backdrop-blur-xl border-border/50 shadow-xl"
                        >
                            <DropdownMenuLabel className="pb-3">
                                <div className="flex items-center gap-3">
                                    <Avatar className="w-10 h-10 ring-2 ring-primary/20">
                                        {logoUrl ? (
                                            <AvatarImage src={logoUrl} alt={shopName} />
                                        ) : null}
                                        <AvatarFallback className="bg-gradient-to-br from-primary/80 to-primary text-primary-foreground font-bold">
                                            {getUserInitials()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-semibold text-foreground">{userEmail?.split('@')[0]}</span>
                                        <span className="text-xs text-muted-foreground truncate max-w-[140px]">{userEmail}</span>
                                    </div>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator className="bg-border/50" />
                            <DropdownMenuItem
                                onClick={() => router.push(`/shop/${shopId}/settings`)}
                                className="gap-3 py-2.5 px-3 rounded-lg cursor-pointer focus:bg-muted"
                            >
                                <SettingsIcon className="w-4 h-4 text-muted-foreground" />
                                <span>Settings</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => router.push('/admin')}
                                className="gap-3 py-2.5 px-3 rounded-lg cursor-pointer focus:bg-muted"
                            >
                                <Building2 className="w-4 h-4 text-muted-foreground" />
                                <span>All Shops</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-border/50 my-2" />
                            <DropdownMenuItem
                                onClick={handleLogout}
                                className="gap-3 py-2.5 px-3 rounded-lg cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
                            >
                                <LogOut className="w-4 h-4" />
                                <span>Sign out</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </motion.header>

            {/* Global Search Modal */}
            <GlobalSearch
                shopId={shopId}
                isOpen={isSearchOpen}
                onClose={() => setIsSearchOpen(false)}
            />
        </>
    );
}
