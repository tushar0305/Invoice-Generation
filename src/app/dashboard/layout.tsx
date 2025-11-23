'use client';

import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarTrigger,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  LayoutDashboard,
  Users,
  FileText,
  Settings,
  LogOut,
  PlusCircle,
  Package,
  Menu,
  Palette,
  Sparkles,
  BookOpen,
  Crown,
  ChevronDown,
  PanelLeftClose,
  PanelLeft,
  Search,
  Bell,
  HelpCircle,
  CalendarDays,
  Command,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Logo } from '@/components/logo';
import { AuthWrapper } from '@/components/auth-wrapper';
import { AppListeners } from '@/components/app-listeners';
import { ShopSwitcher } from '@/components/shop-switcher';
import { ThemeToggle } from '@/components/theme-toggle';
import { useActiveShop } from '@/hooks/use-active-shop';
import { Capacitor } from '@capacitor/core';
import { useAuth, useUser } from '@/supabase/provider';
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
import { useEffect, useState } from 'react';
import { supabase } from '@/supabase/client';
import type { UserSettings } from '@/lib/definitions';
import { registerPushNotifications, addPushListeners } from '@/lib/notifications';
import { cn } from '@/lib/utils';

import { Badge } from '@/components/ui/badge';
import { getRoleBadgeColor } from '@/lib/permissions';

function UserNav({ minimal = false }: { minimal?: boolean }) {
  const { user } = useUser();
  const router = useRouter();
  const { setOpenMobile } = useSidebar();
  const { activeShop, userRole } = useActiveShop();

  if (!user) {
    return null;
  }

  const fallback = user.email ? user.email.charAt(0).toUpperCase() : 'U';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className={cn("flex items-center gap-3 rounded-md p-2 text-left text-sm hover:bg-sidebar-accent transition-colors", minimal ? "w-auto justify-center rounded-full" : "w-full")}>
          <Avatar className={cn("border border-border", minimal ? "h-8 w-8" : "h-9 w-9")}>
            <AvatarImage src={activeShop?.logoUrl || undefined} alt={activeShop?.shopName || user.email || ''} className="object-cover" />
            <AvatarFallback className="bg-primary/10 text-primary font-medium">{fallback}</AvatarFallback>
          </Avatar>
          {!minimal && (
            <div className="flex flex-col min-w-0 items-start">
              <span className="text-sm font-medium truncate w-full">{user?.email}</span>
              {activeShop && (
                <Badge variant="secondary" className={`mt-1 text-[10px] px-1.5 py-0 h-5 ${getRoleBadgeColor(userRole?.role || 'staff')}`}>
                  {(userRole?.role || 'staff').toUpperCase()}
                </Badge>
              )}
            </div>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-56"
        align="end"
        side="bottom"
        forceMount
      >
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">Signed in as</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => { router.push('/dashboard/settings'); setOpenMobile(false); }}>
          <Settings className="mr-2 h-4 w-4" />
          <span>Settings</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function NavMenu() {
  const pathname = usePathname();
  const router = useRouter();
  const { setOpenMobile } = useSidebar();

  const handleNav = (href: string) => {
    router.push(href);
    setOpenMobile(false);
  }

  return (
    <>
      <SidebarMenu className="flex flex-col gap-2">
        <SidebarMenuItem>
          <SidebarMenuButton
            onClick={() => handleNav('/dashboard')}
            isActive={pathname === '/dashboard'}
            tooltip="Dashboard"
          >
            <LayoutDashboard />
            <span>Dashboard</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
        <SidebarMenuItem>
          <SidebarMenuButton
            onClick={() => handleNav('/dashboard/invoices')}
            isActive={pathname.startsWith('/dashboard/invoices')}
            tooltip="Invoices"
          >
            <FileText />
            <span>Invoices</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
        <SidebarMenuItem>
          <SidebarMenuButton
            onClick={() => handleNav('/dashboard/customers')}
            isActive={pathname === '/dashboard/customers'}
            tooltip="Customers"
          >
            <Users />
            <span>Customers</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
        <SidebarMenuItem>
          <SidebarMenuButton
            onClick={() => handleNav('/dashboard/stock')}
            isActive={pathname === '/dashboard/stock'}
            tooltip="Stock"
          >
            <Package />
            <span>Stock</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
        <SidebarMenuItem>
          <SidebarMenuButton
            onClick={() => handleNav('/dashboard/settings')}
            isActive={pathname === '/dashboard/settings'}
            tooltip="Settings"
          >
            <Settings />
            <span>Settings</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
        <div className="px-2 pt-4">
          <Button
            variant="outline"
            className="h-auto w-full justify-start gap-2 p-2 text-left"
            onClick={() => handleNav('/dashboard/invoices/new')}
          >
            <PlusCircle />
            <span>New Invoice</span>
          </Button>
        </div>
      </SidebarMenu>
    </>
  )
}

function DashboardLayoutInternal({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const auth = useAuth();
  const { user } = useUser();
  const { permissions, activeShop } = useActiveShop();
  const router = useRouter();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const { setOpenMobile, isMobile, open, setOpen } = useSidebar();
  const [upcomingOpen, setUpcomingOpen] = useState(false);

  // ...

  useEffect(() => {
    async function fetchSettings() {
      const { data, error } = await supabase.from('user_settings').select('*').single();
      if (!error) {
        setSettings(data);
      }
    }
    fetchSettings();
  }, []);

  // Initialize Push Notifications with error handling
  const initNotifications = async () => {
    try {
      addPushListeners();
      // Use timeout to avoid blocking the UI
      setTimeout(() => {
        registerPushNotifications().catch(err => {
          console.error('Push notification registration failed:', err);
        });
      }, 1000);
    } catch (error) {
      console.error('Failed to initialize push notifications:', error);
    }
  };

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      initNotifications();
    }
  }, []);

  const handleSignOut = async () => {
    await auth.signOut();
    router.push('/login');
  };

  const getTitle = () => {
    if (pathname === '/dashboard') return 'Dashboard';
    if (pathname.startsWith('/dashboard/invoices')) {
      if (pathname.includes('/new')) return 'Create New Invoice';
      if (pathname.includes('/edit')) return 'Edit Invoice';
      if (pathname.includes('/view')) return 'View Invoice';
      return 'Invoices';
    }
    if (pathname === '/dashboard/customers') return 'Customers';
    if (pathname === '/dashboard/stock') return 'Stock Management';
    if (pathname === '/dashboard/templates') return 'Templates';
    if (pathname === '/dashboard/settings') return 'Settings';
    if (pathname === '/dashboard/calculator') return 'Calculator';
    return 'Dashboard';
  };

  const handleNav = (href: string) => {
    router.push(href);
    setOpenMobile(false);
  };

  return (
    <AuthWrapper>
      <Sidebar>
        {/* Minimal Elegant Header */}
        <SidebarHeader className="relative overflow-hidden">
          {/* Add safe area padding for mobile to prevent overlap with notification bar */}
          <div className="px-4 py-3 relative z-10 pt-[max(0.75rem,env(safe-area-inset-top))]">
            <ShopSwitcher className="w-full" />
          </div>
          {/* Glowing highlight line below shop switcher */}
          <div className="px-4 pb-3">
            <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-primary/30 to-transparent shadow-[0_0_10px_rgba(0,240,255,0.3)]"></div>
          </div>
        </SidebarHeader>

        <SidebarContent className="px-4 py-4">
          <div className="space-y-2">
            {/* Main Navigation - Minimal Style */}
            <div className="space-y-1">
              <SidebarMenu className="space-y-0.5">
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => handleNav('/dashboard')}
                    isActive={pathname === '/dashboard'}
                    tooltip="Dashboard"
                    className="group/item h-9 px-3 rounded-lg data-[active=true]:bg-primary/10 hover:bg-white/[0.03] transition-all duration-200"
                  >
                    <LayoutDashboard className="h-[18px] w-[18px] transition-transform duration-200 group-hover/item:scale-105 opacity-70 data-[active=true]:opacity-100 data-[active=true]:text-primary" data-active={pathname === '/dashboard'} />
                    <span className="text-sm font-normal opacity-70 data-[active=true]:opacity-100 data-[active=true]:font-medium transition-all duration-200" data-active={pathname === '/dashboard'}>Dashboard</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => handleNav('/dashboard/invoices')}
                    isActive={pathname.startsWith('/dashboard/invoices')}
                    tooltip="Invoices"
                    className="group/item h-9 px-3 rounded-lg data-[active=true]:bg-primary/10 hover:bg-white/[0.03] transition-all duration-200"
                  >
                    <FileText className="h-[18px] w-[18px] transition-transform duration-200 group-hover/item:scale-105 opacity-70 data-[active=true]:opacity-100 data-[active=true]:text-primary" data-active={pathname.startsWith('/dashboard/invoices')} />
                    <span className="text-sm font-normal opacity-70 data-[active=true]:opacity-100 data-[active=true]:font-medium transition-all duration-200" data-active={pathname.startsWith('/dashboard/invoices')}>Invoices</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => handleNav('/dashboard/customers')}
                    isActive={pathname === '/dashboard/customers'}
                    tooltip="Customers"
                    className="group/item h-9 px-3 rounded-lg data-[active=true]:bg-primary/10 hover:bg-white/[0.03] transition-all duration-200"
                  >
                    <Users className="h-[18px] w-[18px] transition-transform duration-200 group-hover/item:scale-105 opacity-70 data-[active=true]:opacity-100 data-[active=true]:text-primary" data-active={pathname === '/dashboard/customers'} />
                    <span className="text-sm font-normal opacity-70 data-[active=true]:opacity-100 data-[active=true]:font-medium transition-all duration-200" data-active={pathname === '/dashboard/customers'}>Customers</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => handleNav('/dashboard/stock')}
                    isActive={pathname === '/dashboard/stock'}
                    tooltip="Stock"
                    className="group/item h-9 px-3 rounded-lg data-[active=true]:bg-primary/10 hover:bg-white/[0.03] transition-all duration-200"
                  >
                    <Package className="h-[18px] w-[18px] transition-transform duration-200 group-hover/item:scale-105 opacity-70 data-[active=true]:opacity-100 data-[active=true]:text-primary" data-active={pathname === '/dashboard/stock'} />
                    <span className="text-sm font-normal opacity-70 data-[active=true]:opacity-100 data-[active=true]:font-medium transition-all duration-200" data-active={pathname === '/dashboard/stock'}>Stock</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => handleNav('/dashboard/templates')}
                    isActive={pathname === '/dashboard/templates'}
                    tooltip="Templates"
                    className="group/item h-9 px-3 rounded-lg data-[active=true]:bg-primary/10 hover:bg-white/[0.03] transition-all duration-200"
                  >
                    <Palette className="h-[18px] w-[18px] transition-transform duration-200 group-hover/item:scale-105 opacity-70 data-[active=true]:opacity-100 data-[active=true]:text-primary" data-active={pathname === '/dashboard/templates'} />
                    <span className="text-sm font-normal opacity-70 data-[active=true]:opacity-100 data-[active=true]:font-medium transition-all duration-200" data-active={pathname === '/dashboard/templates'}>Templates</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </div>

            {/* Settings & Staff - Moved Up */}
            <div className="space-y-0.5">
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => handleNav('/dashboard/settings')}
                    isActive={pathname === '/dashboard/settings'}
                    tooltip="Settings"
                    className="group/item h-9 px-3 rounded-lg data-[active=true]:bg-primary/10 hover:bg-white/[0.03] transition-all duration-200"
                  >
                    <Settings className="h-[18px] w-[18px] transition-transform duration-200 group-hover/item:scale-105 opacity-70 data-[active=true]:opacity-100 data-[active=true]:text-primary" data-active={pathname === '/dashboard/settings'} />
                    <span className="text-sm font-normal opacity-70 data-[active=true]:opacity-100 data-[active=true]:font-medium transition-all duration-200" data-active={pathname === '/dashboard/settings'}>Settings</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => handleNav('/dashboard/staff')}
                    isActive={pathname === '/dashboard/staff'}
                    tooltip="Staff"
                    className="group/item h-9 px-3 rounded-lg data-[active=true]:bg-primary/10 hover:bg-white/[0.03] transition-all duration-200"
                  >
                    <Users className="h-[18px] w-[18px] transition-transform duration-200 group-hover/item:scale-105 opacity-70 data-[active=true]:opacity-100 data-[active=true]:text-primary" data-active={pathname === '/dashboard/staff'} />
                    <span className="text-sm font-normal opacity-70 data-[active=true]:opacity-100 data-[active=true]:font-medium transition-all duration-200" data-active={pathname === '/dashboard/staff'}>Staff</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </div>

            {/* Upcoming Features - Moved to Bottom */}
            <div className="space-y-1 pt-2 border-t border-white/5">
              <Collapsible open={upcomingOpen} onOpenChange={setUpcomingOpen}>
                <CollapsibleTrigger asChild>
                  <button className="flex items-center justify-between w-full px-3 py-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/50 hover:text-muted-foreground/80 transition-colors duration-200 group/trigger">
                    <span>Upcoming</span>
                    <ChevronDown className={cn("h-3.5 w-3.5 transition-transform duration-200", upcomingOpen && "rotate-180")} />
                  </button>
                </CollapsibleTrigger>

                <CollapsibleContent className="space-y-0.5 mt-1">
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        onClick={() => handleNav('/dashboard/khata')}
                        isActive={pathname === '/dashboard/khata'}
                        tooltip="Digital Khata Book"
                        className="group/item h-9 px-3 rounded-lg data-[active=true]:bg-emerald-500/5 hover:bg-white/[0.03] transition-all duration-200"
                      >
                        <BookOpen className="h-[18px] w-[18px] text-emerald-400/70 transition-transform duration-200 group-hover/item:scale-105" />
                        <span className="text-sm font-normal opacity-70 data-[active=true]:opacity-100 transition-all duration-200" data-active={pathname === '/dashboard/khata'}>Khata</span>
                        <span className="ml-auto text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400/70">Soon</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>

                    <SidebarMenuItem>
                      <SidebarMenuButton
                        onClick={() => handleNav('/dashboard/loyalty')}
                        isActive={pathname === '/dashboard/loyalty'}
                        tooltip="Loyalty Program"
                        className="group/item h-9 px-3 rounded-lg data-[active=true]:bg-purple-500/5 hover:bg-white/[0.03] transition-all duration-200"
                      >
                        <Crown className="h-[18px] w-[18px] text-purple-400/70 transition-transform duration-200 group-hover/item:scale-105" />
                        <span className="text-sm font-normal opacity-70 data-[active=true]:opacity-100 transition-all duration-200" data-active={pathname === '/dashboard/loyalty'}>Loyalty</span>
                        <span className="ml-auto text-[9px] px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400/70">Soon</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </SidebarMenu>
                </CollapsibleContent>
              </Collapsible>
            </div>
          </div>
        </SidebarContent>

        {/* Minimal Footer */}
        <SidebarFooter className="border-t border-white/5 p-4">
          <UserNav />
          <SidebarMenu className="mt-2 space-y-1">
            {/* Theme Toggle */}
            <SidebarMenuItem>
              <div className="px-3 py-2">
                <ThemeToggle />
              </div>
            </SidebarMenuItem>
            
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={handleSignOut}
                tooltip="Sign Out"
                className="group/signout h-9 px-3 rounded-lg hover:bg-destructive/5 transition-all duration-200"
              >
                <LogOut className="h-[18px] w-[18px] text-destructive/70 transition-transform duration-200 group-hover/signout:scale-105" />
                <span className="text-sm text-destructive/70 font-normal">Sign Out</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        {/* Desktop Sidebar Toggle - Moves outside sidebar when open */}
        <div className={cn(
          "hidden md:flex fixed top-4 z-50 transition-all duration-300 ease-in-out",
          open ? "left-[calc(var(--sidebar-width)+1rem)]" : "left-4"
        )}>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setOpen(!open)}
            className="hover:bg-accent text-foreground rounded-full bg-background/80 backdrop-blur-sm border border-border/40 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110"
          >
            {open ? <PanelLeftClose className="h-5 w-5" /> : <PanelLeft className="h-5 w-5" />}
          </Button>
        </div>

        {/* Desktop Glassy Header */}
        <header className={cn(
          "hidden md:flex fixed top-0 right-0 z-40 h-16 items-center justify-between px-6 transition-all duration-300",
          "bg-background/60 backdrop-blur-xl border-b border-white/5 shadow-sm",
          open ? "left-[var(--sidebar-width)]" : "left-0"
        )}>
          {/* Left: Page Title & Search */}
          <div className="flex items-center gap-6 flex-1 pl-14">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70 tracking-tight">{getTitle()}</h1>
              <div className="h-4 w-px bg-white/10"></div>
              <div className="hidden lg:flex items-center text-xs text-muted-foreground/60 font-medium">
                <CalendarDays className="h-3.5 w-3.5 mr-2" />
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </div>
            </div>

            {/* Search Bar */}
            <div className="max-w-md flex-1 hidden lg:block relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg -z-10 blur-sm"></div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="h-9 w-full rounded-lg bg-white/5 border border-white/10 pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50 transition-all"
                  readOnly
                />
              </div>

              {/* Notifications + Theme Toggle */}
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative h-9 w-9 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <Bell className="h-[18px] w-[18px]" />
                  <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-primary animate-pulse" />
                </Button>

                <ThemeToggle />

                <UserNav />
              </div>
            </div>
          </div>

          {/* Right: Shop Info & User */}
          <div className="flex items-center gap-4">
            {/* Notifications */}
            <div className="flex items-center gap-1 pr-2 border-r border-white/5">
              <button className="p-2 rounded-full hover:bg-white/5 text-muted-foreground/60 hover:text-foreground transition-colors relative group">
                <Bell className="h-5 w-5" />
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 border-2 border-background"></span>
                <span className="absolute top-full mt-2 right-0 bg-popover text-popover-foreground text-xs px-2 py-1 rounded border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">Notifications</span>
              </button>
            </div>

            {/* Active Shop Badge */}
            {activeShop && (
              <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors cursor-default">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-400/80 shadow-[0_0_8px_rgba(52,211,153,0.5)]"></div>
                <span className="text-sm font-medium text-muted-foreground/80">{activeShop.shopName}</span>
              </div>
            )}

            {/* User Navigation */}
            <UserNav minimal />
          </div>
        </header>

        {/* Mobile Header */}
        <header className="md:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 pb-3 pt-[calc(env(safe-area-inset-top)+0.75rem)] bg-background/80 backdrop-blur-xl border-b border-border/40 shadow-sm transition-all duration-300 h-[calc(env(safe-area-inset-top)+3.5rem)]">
          <Button variant="ghost" size="icon" onClick={() => setOpenMobile(true)} className="-ml-2 hover:bg-accent text-foreground">
            <Menu className="h-6 w-6" />
          </Button>
          <span className="font-heading font-bold text-lg tracking-tight text-foreground">{getTitle()}</span>
          <div className="-mr-2">
            <button
              onClick={() => router.push('/dashboard/settings')}
              className="rounded-full hover:opacity-80 transition-opacity"
            >
              <Avatar className="h-9 w-9 border border-white/20">
                <AvatarFallback className="bg-primary/10 text-primary font-medium">
                  {user?.email ? user.email.charAt(0).toUpperCase() : 'U'}
                </AvatarFallback>
              </Avatar>
            </button>
          </div>
        </header>

        <main className={cn(
          "flex-1 p-4 sm:p-6 pb-20 md:pb-6 pt-[calc(env(safe-area-inset-top)+2.3rem)] md:pt-20 transition-all duration-300"
        )}>{children}</main>
        <FloatingNewInvoiceButton />
        <MobileBottomNav />
      </SidebarInset>
    </AuthWrapper>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider style={{ "--header-top": "calc(env(safe-area-inset-top) + 2rem)" } as React.CSSProperties}>
      <DashboardLayoutInternal>{children}</DashboardLayoutInternal>
    </SidebarProvider>
  );
}
