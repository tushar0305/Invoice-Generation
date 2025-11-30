/**
 * Client wrapper for Shop Layout
 * Handles all interactive UI elements while keeping server-side data fetching
 */

'use client';

import { useState, useEffect, ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useTheme } from '@/components/theme-provider';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarInset,
    SidebarMenuItem,
    SidebarMenuButton,
    SidebarProvider,
    SidebarTrigger,
    useSidebar,
} from '@/components/ui/sidebar';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
    Home,
    LayoutDashboard,
    Users,
    FileText,
    Settings,
    BarChart3,
    LogOut,
    Package,
    Menu,
    Palette,
    BookOpen,
    Crown,
    ChevronDown,
    CalendarDays,
    TrendingUp,
    FilePlus2,
} from 'lucide-react';
import { ShopSwitcher } from '@/components/shop-switcher';
import { ThemeToggle } from '@/components/theme-toggle';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MobileBottomNav } from '@/components/mobile-bottom-nav';
import { FloatingNewInvoiceButton } from '@/components/floating-new-invoice';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { CommandPalette } from '@/components/command-palette';
import { PageTransition } from '@/components/page-transition';
import { PremiumHeader } from '@/components/premium-header';
import type { Shop, UserShopRole, Permission } from '@/lib/definitions';

type ShopLayoutClientProps = {
    children: ReactNode;
    shopData: {
        activeShop: Shop | null;
        userShops: Shop[];
        userRole: UserShopRole | null;
    };
    userEmail: string | null;
    userId: string;
    shopId: string;
};

export function ShopLayoutClient({
    children,
    shopData,
    userEmail,
    userId,
    shopId,
}: ShopLayoutClientProps) {
    const [isMobile, setIsMobile] = useState(false);

    // Mobile detection
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    return (
        <SidebarProvider defaultOpen={!isMobile}>
            <ShopLayoutInner
                shopData={shopData}
                userEmail={userEmail}
                userId={userId}
                shopId={shopId}
                isMobile={isMobile}
            >
                {children}
            </ShopLayoutInner>
        </SidebarProvider>
    );
}

function ShopLayoutInner({
    children,
    shopData,
    userEmail,
    userId,
    shopId,
    isMobile
}: ShopLayoutClientProps & { isMobile: boolean }) {
    const pathname = usePathname();
    const router = useRouter();
    const { setOpenMobile } = useSidebar();
    const { theme, setPalette } = useTheme();

    // Calculate logo based on theme
    const logoSrc = theme === 'dark' ? '/logo/swarnavyapar_dark.webp' : '/logo/swarnavyapar.webp';

    // Apply shop branding palette if available
    useEffect(() => {
        const saved = localStorage.getItem(`shop_palette_${shopId}`) as any;
        if (saved) {
            setPalette(saved);
        } else {
            // If shop has branding preference, set it; else default to gold
            const preferred = (shopData.activeShop as any)?.brandPalette as any;
            if (preferred) {
                setPalette(preferred);
                localStorage.setItem(`shop_palette_${shopId}`, preferred);
            } else {
                setPalette('gold');
            }
        }
    }, [shopId, setPalette, shopData.activeShop]);

    // Calculate permissions based on role
    const permissions: Permission = {
        canCreateInvoices: !!shopData.userRole,
        canEditAllInvoices: shopData.userRole?.role === 'owner' || shopData.userRole?.role === 'manager',
        canDeleteInvoices: shopData.userRole?.role === 'owner' || shopData.userRole?.role === 'manager',
        canExportInvoices: shopData.userRole?.role === 'owner' || shopData.userRole?.role === 'manager',
        canManageStock: shopData.userRole?.role === 'owner' || shopData.userRole?.role === 'manager',
        canViewStock: !!shopData.userRole,
        canEditSettings: shopData.userRole?.role === 'owner',
        canInviteStaff: shopData.userRole?.role === 'owner',
        canViewAnalytics: !!shopData.userRole,
        canCreateShop: shopData.userRole?.role === 'owner',
    };

    const handleLogout = async () => {
        const { supabase } = await import('@/supabase/client');
        await supabase.auth.signOut();
        router.push('/login');
    };

    const handleNavClick = () => {
        if (isMobile) {
            setOpenMobile(false);
        }
    };

    const navGroups = [
        {
            title: 'Main',
            items: [
                { icon: LayoutDashboard, label: 'Dashboard', href: `/shop/${shopId}/dashboard` },
                { icon: FileText, label: 'Invoices', href: `/shop/${shopId}/invoices` },
                { icon: Users, label: 'Customers', href: `/shop/${shopId}/customers` },
                { icon: Package, label: 'Stock', href: `/shop/${shopId}/stock` },
            ],
        },
        {
            title: 'Management',
            items: [
                { icon: Users, label: 'Staff', href: `/shop/${shopId}/staff`, permission: 'canInviteStaff' },
                { icon: BookOpen, label: 'Khata Book', href: `/shop/${shopId}/khata` },
                { icon: Crown, label: 'Loyalty', href: `/shop/${shopId}/loyalty` },
            ],
        },
        {
            title: 'Analytics',
            items: [
                { icon: BarChart3, label: 'Sales Analytics', href: `/shop/${shopId}/insights` },
            ],
        },
        {
            title: 'Settings',
            items: [
                { icon: Palette, label: 'Templates', href: `/shop/${shopId}/templates`, permission: 'canEditSettings' },
                { icon: Settings, label: 'Settings', href: `/shop/${shopId}/settings`, permission: 'canEditSettings' },
            ],
        },
    ];

    const getUserInitials = () => {
        if (!userEmail) return '??';
        return userEmail.substring(0, 2).toUpperCase();
    };

    const getRoleBadge = () => {
        if (!shopData.userRole) return null;
        const role = shopData.userRole.role;
        const colors = {
            owner: 'bg-gold-500/10 text-gold-600 border-gold-500/20',
            manager: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
            staff: 'bg-gray-500/10 text-gray-600 border-gray-500/20',
        };
        return (
            <Badge variant="outline" className={cn('text-xs', colors[role])}>
                {role}
            </Badge>
        );
    };

    return (
        <div className="flex h-screen w-full overflow-hidden bg-gray-50/50 dark:bg-slate-950">
            {/* Command Palette */}
            <CommandPalette shopId={shopId} />

            {/* Sidebar - Shows on desktop always, on mobile when triggered */}
            <Sidebar className="bg-background border-r border-border backdrop-blur-xl shadow-2xl z-50">
                <SidebarHeader className="p-4 pb-2">
                    <div className="flex items-center justify-center w-full mb-6">
                        <Link href={`/shop/${shopId}/dashboard`} className="flex items-center justify-center group" onClick={handleNavClick}>
                            <div className="h-14 w-40 relative flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
                                <Image
                                    src={logoSrc}
                                    alt="Swarnavyapar logo"
                                    fill
                                    className="object-contain drop-shadow-sm"
                                    priority
                                />
                            </div>
                        </Link>
                    </div>
                    <div className="px-1">
                        <ShopSwitcher />
                    </div>
                </SidebarHeader>

                <SidebarContent className="px-4 py-4">
                    <div className="space-y-3">
                        {navGroups.map((group, groupIndex) => (
                            <div key={group.title}>
                                {/* Visual separator between groups instead of text headers */}
                                {groupIndex > 0 && (
                                    <div className="h-px bg-gradient-to-r from-transparent via-border/50 to-transparent my-4" />
                                )}
                                <div className="space-y-1">
                                    {group.items.map((item) => {
                                        // Check permission if required
                                        if (item.permission && !permissions[item.permission as keyof Permission]) {
                                            return null;
                                        }

                                        const isActive = pathname === item.href;
                                        return (
                                            <SidebarMenuItem key={item.href} className="list-none">
                                                <SidebarMenuButton asChild isActive={isActive}
                                                    className={cn(
                                                        "w-full justify-start gap-3 px-4 py-3 rounded-xl transition-colors duration-200 group relative overflow-hidden focus-ring",
                                                        isActive
                                                            ? "bg-primary text-primary-foreground font-semibold shadow-md"
                                                            : "text-sidebar-foreground hover:bg-primary/10 hover:text-primary"
                                                    )}
                                                >
                                                    <Link
                                                        href={item.href}
                                                        className="flex items-center gap-3 w-full"
                                                        onClick={handleNavClick}
                                                    >
                                                        <item.icon className="h-5 w-5" />
                                                        <span className="text-sm font-medium">{item.label}</span>
                                                    </Link>
                                                </SidebarMenuButton>
                                            </SidebarMenuItem>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </SidebarContent>

                <SidebarFooter className="p-4 mt-auto overflow-hidden">
                    <div className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm rounded-2xl p-3 border border-gray-100 dark:border-slate-700/50 shadow-sm">
                        <div className="flex items-center gap-2 mb-3">
                            <Avatar className="h-9 w-9 border-2 border-white dark:border-slate-700 shadow-sm shrink-0">
                                <AvatarFallback className="bg-gradient-to-br from-primary/80 to-primary text-white font-bold text-xs">
                                    {getUserInitials()}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold text-gray-900 dark:text-gray-100 truncate">{userEmail || 'User'}</p>
                                <div className="flex items-center gap-1">
                                    {getRoleBadge()}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-start">
                                <ThemeToggle />
                            </div>
                            <Button
                                variant="ghost"
                                className="w-full justify-start gap-2 h-11 px-3 text-destructive hover:text-destructive hover:bg-destructive/10 rounded-lg text-sm font-medium"
                                onClick={handleLogout}
                            >
                                <LogOut className="h-4 w-4" />
                                Logout
                            </Button>
                        </div>
                    </div>
                </SidebarFooter>
            </Sidebar>

            {/* Main Content */}
            <SidebarInset className="flex-1 flex flex-col overflow-hidden bg-gray-50/50 dark:bg-slate-950">
                {/* Premium Header - Desktop Only */}
                {!isMobile && (
                    <PremiumHeader
                        shopName={shopData.activeShop?.shopName || 'Jewellery Shop'}
                        shopId={shopId}
                        userId={userId}
                        userEmail={userEmail}
                        logoUrl={shopData.activeShop?.logoUrl}
                    />
                )}

                {/* Mobile Header */}
                {isMobile && (
                    <header className="flex h-12 items-center border-b border-border/40 bg-background/95 backdrop-blur-xl px-5 shadow-sm w-full">
                        <SidebarTrigger className="-ml-2" />
                        <div className="flex-1 text-center">
                            <h1 className="font-semibold text-base tracking-tight text-gray-900 dark:text-gray-100">
                                {pathname === `/shop/${shopId}/dashboard` && 'Dashboard'}
                                {pathname === `/shop/${shopId}/invoices` && 'Invoices'}
                                {pathname === `/shop/${shopId}/invoices/new` && 'New Invoice'}
                                {pathname === `/shop/${shopId}/invoices/edit` && 'Edit Invoice'}
                                {pathname === `/shop/${shopId}/customers` && 'Customers'}
                                {pathname === `/shop/${shopId}/customers/view` && 'Customer Details'}
                                {pathname === `/shop/${shopId}/stock` && 'Stock'}
                                {pathname === `/shop/${shopId}/stock/new` && 'Add Stock Item'}
                                {pathname === `/shop/${shopId}/staff` && 'Staff Management'}
                                {pathname === `/shop/${shopId}/khata` && 'Khata Book'}
                                {pathname === `/shop/${shopId}/loyalty` && 'Loyalty Program'}
                                {/* Analytics pages removed */}
                                {pathname === `/shop/${shopId}/templates` && 'Templates'}
                                {pathname === `/shop/${shopId}/settings` && 'Settings'}
                                {!pathname.includes(shopId) && 'Swarnavyapar'}
                            </h1>
                        </div>
                        <div className="w-6" /> {/* Spacer for centering */}
                    </header>
                )}

                <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-[calc(7rem+env(safe-area-inset-bottom))] md:pb-8">
                    {children}
                </main>

                {/* Footer - only on desktop */}
                {!isMobile && (
                    <footer className="py-3 px-6 border-t border-border/40 bg-background/60 backdrop-blur-sm">
                        <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                            <div className="flex items-center gap-2">
                                <span className="font-medium">Swarnavyapar</span>
                                <span className="opacity-50">•</span>
                                <span>v{process.env.npm_package_version || '0.1.0'}</span>
                            </div>
                            <span>© {new Date().getFullYear()}</span>
                        </div>
                    </footer>
                )}
            </SidebarInset>

            {/* Mobile Navigation */}
            {isMobile && (
                <>
                    <MobileBottomNav shopId={shopId} />
                    <FloatingNewInvoiceButton shopId={shopId} />
                </>
            )}
        </div>
    );
}
