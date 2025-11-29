/**
 * Client wrapper for Shop Layout
 * Handles all interactive UI elements while keeping server-side data fetching
 */

'use client';

import { useState, useEffect, ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
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
    const pathname = usePathname();
    const router = useRouter();
    const [isMobile, setIsMobile] = useState(false);

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

    // Mobile detection - only use window.innerWidth now
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const handleLogout = async () => {
        const { supabase } = await import('@/supabase/client');
        await supabase.auth.signOut();
        router.push('/login');
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
                { icon: BarChart3, label: 'Insights', href: `/shop/${shopId}/insights` },
                { icon: CalendarDays, label: 'Calculator', href: `/shop/${shopId}/calculator` },
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
        <SidebarProvider defaultOpen={!isMobile}>
            <div className="flex h-screen w-full overflow-hidden bg-background">
                {/* Sidebar - Shows on desktop always, on mobile when triggered */}
                <Sidebar className="border-r border-border/40">
                    <SidebarHeader className="border-b border-border/40 p-4">
                        <div className="flex items-center justify-between">
                            <Link href={`/shop/${shopId}/dashboard`} className="flex items-center gap-2">
                                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-gold-500 to-maroon-600 flex items-center justify-center text-white font-bold text-sm">
                                    SV
                                </div>
                                <span className="font-heading font-bold text-lg">Swarnavyapar</span>
                            </Link>
                        </div>
                        <div className="mt-4">
                            <ShopSwitcher />
                        </div>
                    </SidebarHeader>

                    <SidebarContent>
                        <div className="space-y-2 p-2">
                            {navGroups.map((group) => (
                                <Collapsible key={group.title} defaultOpen className="space-y-1">
                                    <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-semibold text-muted-foreground hover:bg-accent/50 transition-colors">
                                        {group.title}
                                        <ChevronDown className="h-3 w-3" />
                                    </CollapsibleTrigger>
                                    <CollapsibleContent className="space-y-0.5">
                                        {group.items.map((item) => {
                                            // Check permission if required
                                            if (item.permission && !permissions[item.permission as keyof Permission]) {
                                                return null;
                                            }

                                            const isActive = pathname === item.href;
                                            return (
                                                <SidebarMenuItem key={item.href}>
                                                    <SidebarMenuButton asChild isActive={isActive}>
                                                        <Link href={item.href} className="flex items-center gap-3 px-3 py-2">
                                                            <item.icon className="h-4 w-4" />
                                                            <span>{item.label}</span>
                                                        </Link>
                                                    </SidebarMenuButton>
                                                </SidebarMenuItem>
                                            );
                                        })}
                                    </CollapsibleContent>
                                </Collapsible>
                            ))}
                        </div>
                    </SidebarContent>

                    <SidebarFooter className="border-t border-border/40 p-4">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="w-full justify-start gap-3 px-2">
                                    <Avatar className="h-8 w-8">
                                        <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                                            {getUserInitials()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 text-left overflow-hidden">
                                        <p className="text-sm font-medium truncate">{userEmail || 'User'}</p>
                                        {getRoleBadge()}
                                    </div>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                                    <LogOut className="mr-2 h-4 w-4" />
                                    Logout
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <div className="flex items-center justify-between mt-2">
                            <ThemeToggle />
                        </div>
                    </SidebarFooter>
                </Sidebar>

                {/* Main Content */}
                <SidebarInset className="flex-1 flex flex-col overflow-hidden">
                    {/* Mobile Header */}
                    {isMobile && (
                        <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b bg-background px-4 md:px-6">
                            <SidebarTrigger className="-ml-1" />
                            <div className="flex-1 text-center">
                                <h1 className="font-semibold text-base">
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
                                    {pathname === `/shop/${shopId}/insights` && 'Insights'}
                                    {pathname === `/shop/${shopId}/calculator` && 'Calculator'}
                                    {pathname === `/shop/${shopId}/templates` && 'Templates'}
                                    {pathname === `/shop/${shopId}/settings` && 'Settings'}
                                    {!pathname.includes(shopId) && 'Swarnavyapar'}
                                </h1>
                            </div>
                            <div className="w-9" /> {/* Spacer for centering */}
                        </header>
                    )}

                    <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 pb-28 md:pb-6">
                        {children}
                    </main>
                </SidebarInset>

                {/* Mobile Navigation */}
                {isMobile && (
                    <>
                        <MobileBottomNav shopId={shopId} />
                        <FloatingNewInvoiceButton shopId={shopId} />
                    </>
                )}
            </div>
        </SidebarProvider>
    );
}
