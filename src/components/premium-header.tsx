'use client';

import { useState } from 'react';
import { Search, Bell, User, LogOut, Settings as SettingsIcon, Building2 } from 'lucide-react';
import { GlobalSearch } from '@/components/global-search';
import { NotificationCenter } from '@/components/notification-center';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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

    // Get current page name from pathname
    const getPageName = () => {
        if (pathname.includes('/dashboard')) return 'Dashboard';
        if (pathname.includes('/invoices/new')) return 'New Invoice';
        if (pathname.includes('/invoices/edit')) return 'Edit Invoice';
        if (pathname.includes('/invoices/view')) return 'Invoice Details';
        if (pathname.includes('/invoices')) return 'Invoices';
        if (pathname.includes('/customers/view')) return 'Customer Details';
        if (pathname.includes('/customers')) return 'Customers';
        if (pathname.includes('/stock/new')) return 'Add Stock Item';
        if (pathname.includes('/stock')) return 'Stock';
        if (pathname.includes('/staff')) return 'Staff Management';
        if (pathname.includes('/khata')) return 'Khata Book';
        if (pathname.includes('/loyalty')) return 'Loyalty Program';
        if (pathname.includes('/insights')) return 'Sales Insights';
        if (pathname.includes('/templates')) return 'Templates';
        if (pathname.includes('/settings')) return 'Settings';
        if (pathname.includes('/calculator')) return 'Calculator';
        if (pathname.includes('/marketing')) return 'Marketing';
        return 'Dashboard';
    };

    return (
        <>
            {/* Header - Hidden on mobile */}
            <motion.header
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                className="hidden md:block sticky top-0 z-40 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md"
            >
                <div className="flex items-center justify-between h-16 px-6">
                    {/* Left: Current Page Name */}
                    <div className="flex items-center gap-4">
                        <h1 className="text-xl font-bold text-slate-900 dark:text-white">{getPageName()}</h1>
                    </div>

                    {/* Center: Search Bar */}
                    <div className="flex-1 max-w-xl mx-8">
                        <button
                            onClick={() => setIsSearchOpen(true)}
                            className="w-full flex items-center gap-3 px-4 py-2.5 bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-800 transition-all duration-200 group"
                        >
                            <Search className="w-4 h-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors" />
                            <span className="flex-1 text-left text-sm text-slate-500 dark:text-slate-400">
                                Search invoices, customers, stock...
                            </span>
                        </button>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-3">
                        {/* Notifications */}
                        <NotificationCenter shopId={shopId} userId={userId} />

                        {/* User Menu */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                                    <Avatar className="w-8 h-8">
                                        <AvatarFallback className="bg-gradient-to-br from-gold-400 to-gold-600 text-white text-sm font-semibold">
                                            {getUserInitials()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <span className="hidden lg:block text-sm font-medium text-slate-700 dark:text-slate-300">
                                        {userEmail?.split('@')[0] || 'User'}
                                    </span>
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                                <DropdownMenuLabel>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium">My Account</span>
                                        <span className="text-xs text-slate-500 truncate">{userEmail}</span>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => router.push(`/shop/${shopId}/settings`)}>
                                    <SettingsIcon className="w-4 h-4 mr-2" />
                                    Settings
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => router.push('/admin')}>
                                    <Building2 className="w-4 h-4 mr-2" />
                                    All Shops
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={handleLogout} className="text-red-600 dark:text-red-400">
                                    <LogOut className="w-4 h-4 mr-2" />
                                    Logout
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
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
