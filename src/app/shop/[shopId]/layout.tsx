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
  SidebarFooter,
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
  PlusCircle,
  Package,
  Menu,
  Palette,
  BookOpen,
  Crown,
  ChevronDown,
  PanelLeftClose,
  PanelLeft,
  Search,
  Bell,
  CalendarDays,
  TrendingUp,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { AuthWrapper } from '@/components/auth-wrapper';
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
import { useState, useEffect, use } from 'react';
import { supabase } from '@/supabase/client';
import type { UserSettings } from '@/lib/definitions';
import { registerPushNotifications, addPushListeners } from '@/lib/notifications';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { getRoleBadgeColor } from '@/lib/permissions';
import type { Invoice } from '@/lib/definitions';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CheckCircle2, AlertCircle, DollarSign, ShoppingCart } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

type Notification = {
  id: string;
  type: 'success' | 'warning' | 'info' | 'payment';
  title: string;
  message: string;
  time: Date;
  read: boolean;
};

function NotificationDropdown() {
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      type: 'payment',
      title: 'Payment Received',
      message: 'Rs. 45,000 received from Rajesh Kumar',
      time: new Date(Date.now() - 10 * 60 * 1000), // 10 minutes ago
      read: false,
    },
    {
      id: '2',
      type: 'success',
      title: 'Invoice Created',
      message: 'Invoice #INV-2024-1156 created successfully',
      time: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      read: false,
    },
    {
      id: '3',
      type: 'warning',
      title: 'Low Stock Alert',
      message: '22K Gold Chain quantity is low (2 items)',
      time: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
      read: true,
    },
    {
      id: '4',
      type: 'info',
      title: 'New Customer',
      message: 'Priya Sharma added to customer list',
      time: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      read: true,
    },
  ]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-amber-500" />;
      case 'payment':
        return <DollarSign className="h-4 w-4 text-emerald-500" />;
      case 'info':
        return <ShoppingCart className="h-4 w-4 text-blue-500" />;
    }
  };

  const getBgColor = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return 'bg-green-500/10';
      case 'warning':
        return 'bg-amber-500/10';
      case 'payment':
        return 'bg-emerald-500/10';
      case 'info':
        return 'bg-blue-500/10';
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Notifications"
          className="relative h-11 w-11 rounded-xl hover:bg-gold-500/10 transition-all duration-200 group focus-visible:ring-2 focus-visible:ring-gold-500 focus-visible:ring-offset-2"
        >
          <Bell className="h-[18px] w-[18px] text-muted-foreground group-hover:text-gold-500 transition-colors" />
          {unreadCount > 0 && (
            <>
              <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-gold-500 animate-pulse shadow-lg shadow-gold-500/50" aria-label="You have new notifications" />
              <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-gold-500 flex items-center justify-center text-[10px] font-bold text-white shadow-md">
                {unreadCount}
              </span>
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[380px] p-0 glass-panel"
        align="end"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div className="flex items-center justify-between p-4 border-b border-border/50">
          <h3 className="font-semibold text-sm">Notifications</h3>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-xs text-primary hover:text-primary/80 font-medium transition-colors"
            >
              Mark all as read
            </button>
          )}
        </div>

        <div className="max-h-[400px] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">
              No notifications yet
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {notifications.map((notification) => (
                <button
                  key={notification.id}
                  onClick={() => markAsRead(notification.id)}
                  className={cn(
                    "w-full p-4 text-left hover:bg-gold-500/5 transition-colors relative group",
                    !notification.read && "bg-primary/5"
                  )}
                >
                  <div className="flex gap-3">
                    <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0", getBgColor(notification.type))}>
                      {getIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h4 className="font-semibold text-sm truncate">
                          {notification.title}
                        </h4>
                        {!notification.read && (
                          <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-1">
                        {notification.message}
                      </p>
                      <span className="text-[10px] text-muted-foreground/70">
                        {formatDistanceToNow(notification.time, { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="p-3 border-t border-border/50 bg-muted/20">
          <button className="w-full text-center text-xs font-medium text-primary hover:text-primary/80 transition-colors py-1">
            View all notifications
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}


function SearchBar() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ customers: string[], invoices: Invoice[] }>({ customers: [], invoices: [] });
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const { activeShop } = useActiveShop();
  const router = useRouter();

  useEffect(() => {
    const performSearch = async () => {
      if (!searchQuery.trim() || !activeShop?.id) {
        setSearchResults({ customers: [], invoices: [] });
        setShowResults(false);
        return;
      }

      setIsSearching(true);
      setShowResults(true);

      try {
        // Search invoices
        const { data: invoices, error } = await supabase
          .from('invoices')
          .select('*')
          .eq('shop_id', activeShop.id)
          .or(`customer_name.ilike.%${searchQuery}%,invoice_number.ilike.%${searchQuery}%`)
          .limit(10);

        if (error) throw error;

        // Extract unique customer names
        const customers = Array.from(new Set(
          (invoices || [])
            .map(inv => inv.customer_name)
            .filter(name => name.toLowerCase().includes(searchQuery.toLowerCase()))
        )).slice(0, 5);

        setSearchResults({
          customers: customers as string[],
          invoices: (invoices || []).map(r => ({
            id: r.id,
            userId: r.user_id,
            shopId: r.shop_id,
            createdBy: r.created_by,
            invoiceNumber: r.invoice_number,
            customerName: r.customer_name,
            customerAddress: r.customer_address || '',
            customerPhone: r.customer_phone || '',
            invoiceDate: r.invoice_date,
            status: r.status,
            grandTotal: Number(r.grand_total) || 0,
            createdAt: r.created_at,
          } as Invoice))
        });
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setIsSearching(false);
      }
    };

    const debounce = setTimeout(performSearch, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery, activeShop?.id]);

  const handleCustomerClick = (customerName: string) => {
    router.push(`/dashboard/customers?search=${encodeURIComponent(customerName)}`);
    setShowResults(false);
    setSearchQuery('');
  };

  const handleInvoiceClick = (invoiceId: string) => {
    router.push(`/dashboard/invoices/${invoiceId}`);
    setShowResults(false);
    setSearchQuery('');
  };

  return (
    <Popover open={showResults} onOpenChange={setShowResults}>
      <div className="max-w-md flex-1 hidden lg:block relative group">
        <div className="absolute inset-0 bg-gradient-to-r from-gold-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl -z-10 blur-sm"></div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <PopoverTrigger asChild>
            <input
              type="text"
              placeholder="Search customers, invoices..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => searchQuery && setShowResults(true)}
              className="h-10 w-full rounded-xl bg-white/40 dark:bg-black/20 border border-gold-500/10 pl-10 pr-20 text-sm placeholder:text-muted-foreground focus:border-gold-500/30 focus:ring-2 focus:ring-gold-500/20 transition-all backdrop-blur-sm"
              aria-label="Search customers and invoices"
            />
          </PopoverTrigger>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
            <span className="text-[10px] font-semibold text-muted-foreground/50 bg-white/40 dark:bg-black/20 px-2 py-0.5 rounded-md border border-gold-500/10">⌘K</span>
          </div>
        </div>
      </div>

      <PopoverContent
        className="w-[400px] p-0 glass-panel"
        align="start"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div className="max-h-[400px] overflow-y-auto">
          {isSearching ? (
            <div className="p-8 text-center text-muted-foreground text-sm">
              Searching...
            </div>
          ) : searchResults.customers.length === 0 && searchResults.invoices.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">
              No results found for "{searchQuery}"
            </div>
          ) : (
            <div className="p-2">
              {searchResults.customers.length > 0 && (
                <div className="mb-3">
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Customers
                  </div>
                  {searchResults.customers.map((customer, i) => (
                    <button
                      key={i}
                      onClick={() => handleCustomerClick(customer)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gold-500/5 transition-colors text-left group"
                    >
                      <div className="h-8 w-8 rounded-full bg-gold-500/10 flex items-center justify-center text-gold-600 font-semibold text-sm">
                        {customer.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate group-hover:text-gold-600 transition-colors">
                          {customer}
                        </div>
                        <div className="text-xs text-muted-foreground">Customer</div>
                      </div>
                      <Users className="h-4 w-4 text-muted-foreground" />
                    </button>
                  ))}
                </div>
              )}

              {searchResults.invoices.length > 0 && (
                <div>
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Invoices
                  </div>
                  {searchResults.invoices.map((invoice) => (
                    <button
                      key={invoice.id}
                      onClick={() => handleInvoiceClick(invoice.id)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gold-500/5 transition-colors text-left group"
                    >
                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <FileText className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate group-hover:text-gold-600 transition-colors">
                          {invoice.invoiceNumber}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">{invoice.customerName}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-sm">₹{invoice.grandTotal.toLocaleString('en-IN')}</div>
                        <Badge variant={invoice.status === 'paid' ? 'default' : 'secondary'} className="text-[10px] h-4 px-1.5">
                          {invoice.status}
                        </Badge>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}


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
        <button className={cn("flex items-center gap-3 rounded-xl p-2 text-left text-sm hover:bg-gold-500/5 transition-colors border border-transparent hover:border-gold-500/10", minimal ? "w-auto justify-center rounded-full" : "w-full")}>
          <Avatar className={cn("border border-gold-500/20", minimal ? "h-8 w-8" : "h-9 w-9")}>
            <AvatarImage src={activeShop?.logoUrl || undefined} alt={activeShop?.shopName || user.email || ''} className="object-cover" />
            <AvatarFallback className="bg-gold-500/10 text-gold-700 font-heading font-bold">{fallback}</AvatarFallback>
          </Avatar>
          {!minimal && (
            <div className="flex flex-col min-w-0 items-start">
              {activeShop && (
                <Badge variant="secondary" className={`text-[10px] px-2 py-0.5 h-5 ${getRoleBadgeColor(userRole?.role || 'staff')}`}>
                  {(userRole?.role || 'staff').toUpperCase()}
                </Badge>
              )}
            </div>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-56 glass-panel"
        align="end"
        side="bottom"
        forceMount
      >
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none font-heading">Signed in as</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-gold-500/10" />
        <DropdownMenuItem onClick={() => { router.push('/dashboard/settings'); setOpenMobile(false); }} className="focus:bg-gold-500/10 focus:text-gold-700">
          <Settings className="mr-2 h-4 w-4" />
          <span>Settings</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-gold-500/10" />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function ShopLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ shopId: string }>;
}) {
  const { user } = useUser();
  const { activeShop, switchShop, isLoading } = useActiveShop();
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Unwrap params Promise for Next.js 15
  const { shopId } = use(params);

  // Sync URL shopId with active shop context
  useEffect(() => {
    if (shopId && activeShop?.id !== shopId) {
      switchShop(shopId);
    }
  }, [shopId, activeShop, switchShop]);

  if (!user) {
    return null;
  }

  function DashboardLayoutInternal({
    children,
  }: {
    children: React.ReactNode;
  }) {
    const pathname = usePathname();
    const auth = useAuth();
    const { user } = useUser();
    const router = useRouter();
    const { setOpenMobile, open, setOpen } = useSidebar();
    const [upcomingOpen, setUpcomingOpen] = useState(false);
    const { userRole, userShops } = useActiveShop();

    // Initialize Push Notifications with error handling
    const initNotifications = async () => {
      try {
        addPushListeners();
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
      // Match both old /dashboard/* and new /shop/[shopId]/* routes
      if (pathname === '/dashboard' || pathname === `/shop/${shopId}`) return 'Dashboard';
      if (pathname.startsWith('/dashboard/invoices') || pathname.includes('/invoices')) {
        if (pathname.includes('/new')) return 'Create New Invoice';
        if (pathname.includes('/edit')) return 'Edit Invoice';
        if (pathname.includes('/view')) return 'View Invoice';
        return 'Invoices';
      }
      if (pathname.includes('/customers')) return 'Customers';
      if (pathname.includes('/stock')) return 'Stock Management';
      if (pathname.includes('/templates')) return 'Templates';
      if (pathname.includes('/settings')) return 'Settings';
      if (pathname.includes('/calculator')) return 'Calculator';
      if (pathname.includes('/insights')) return 'Sales Insights';
      if (pathname.includes('/staff')) return 'Staff Management';
      return 'Dashboard';
    };

    const handleNav = (href: string) => {
      // Convert old /dashboard/* routes to new /shop/[shopId]/* structure
      let shopSpecificHref = href;

      if (href.startsWith('/dashboard/')) {
        // Remove /dashboard prefix: /dashboard/invoices -> /invoices
        const path = href.replace('/dashboard', '');
        shopSpecificHref = `/shop/${shopId}${path}`;
      } else if (href === '/dashboard') {
        // Dashboard root -> shop root
        shopSpecificHref = `/shop/${shopId}`;
      } else if (!href.startsWith('/shop/') && !href.startsWith('/dashboard/admin')) {
        // Other routes that aren't already shop-specific
        shopSpecificHref = `/shop/${shopId}${href}`;
      }

      router.push(shopSpecificHref);
      setOpenMobile(false);
    };

    return (
      <AuthWrapper>
        <Sidebar className="border-r border-gold-500/10 bg-background/80 backdrop-blur-xl">
          {/* Minimal Elegant Header */}
          <SidebarHeader className="relative overflow-hidden">
            <div className="px-4 py-3 relative z-10 pt-[max(0.75rem,env(safe-area-inset-top))]">
              <ShopSwitcher className="w-full" />
            </div>
            {/* Glowing highlight line below shop switcher */}
            <div className="px-4 pb-3">
              <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-gold-500/30 to-transparent"></div>
            </div>
          </SidebarHeader>

          <SidebarContent className="px-4 py-4">
            <div className="space-y-2">
              {/* Main Navigation - Minimal Style */}
              <div className="space-y-1">
                <SidebarMenu className="space-y-1">
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={() => handleNav('/dashboard')}
                      isActive={pathname === '/dashboard'}
                      tooltip="Dashboard"
                      className="group/item h-10 px-3 rounded-xl data-[active=true]:bg-gold-500/10 data-[active=true]:text-gold-700 dark:data-[active=true]:text-gold-400 hover:bg-gold-500/5 transition-all duration-300"
                    >
                      <LayoutDashboard className="h-[18px] w-[18px] transition-transform duration-200 group-hover/item:scale-105 opacity-70 data-[active=true]:opacity-100" data-active={pathname === '/dashboard'} />
                      <span className="text-sm font-medium opacity-70 data-[active=true]:opacity-100 transition-all duration-200" data-active={pathname === '/dashboard'}>Dashboard</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>

                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={() => handleNav('/dashboard/insights')}
                      isActive={pathname === '/dashboard/insights'}
                      tooltip="Sales Insights"
                      className="group/item h-10 px-3 rounded-xl data-[active=true]:bg-gold-500/10 data-[active=true]:text-gold-700 dark:data-[active=true]:text-gold-400 hover:bg-gold-500/5 transition-all duration-300"
                    >
                      <TrendingUp className="h-[18px] w-[18px] transition-transform duration-200 group-hover/item:scale-105 opacity-70 data-[active=true]:opacity-100" data-active={pathname === '/dashboard/insights'} />
                      <span className="text-sm font-medium opacity-70 data-[active=true]:opacity-100 transition-all duration-200" data-active={pathname === '/dashboard/insights'}>Sales Insights</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>

                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={() => handleNav('/dashboard/invoices')}
                      isActive={pathname.startsWith('/dashboard/invoices')}
                      tooltip="Invoices"
                      className="group/item h-10 px-3 rounded-xl data-[active=true]:bg-gold-500/10 data-[active=true]:text-gold-700 dark:data-[active=true]:text-gold-400 hover:bg-gold-500/5 transition-all duration-300"
                    >
                      <FileText className="h-[18px] w-[18px] transition-transform duration-200 group-hover/item:scale-105 opacity-70 data-[active=true]:opacity-100" data-active={pathname.startsWith('/dashboard/invoices')} />
                      <span className="text-sm font-medium opacity-70 data-[active=true]:opacity-100 transition-all duration-200" data-active={pathname.startsWith('/dashboard/invoices')}>Invoices</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>

                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={() => handleNav('/dashboard/customers')}
                      isActive={pathname === '/dashboard/customers'}
                      tooltip="Customers"
                      className="group/item h-10 px-3 rounded-xl data-[active=true]:bg-gold-500/10 data-[active=true]:text-gold-700 dark:data-[active=true]:text-gold-400 hover:bg-gold-500/5 transition-all duration-300"
                    >
                      <Users className="h-[18px] w-[18px] transition-transform duration-200 group-hover/item:scale-105 opacity-70 data-[active=true]:opacity-100" data-active={pathname === '/dashboard/customers'} />
                      <span className="text-sm font-medium opacity-70 data-[active=true]:opacity-100 transition-all duration-200" data-active={pathname === '/dashboard/customers'}>Customers</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>

                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={() => handleNav('/dashboard/stock')}
                      isActive={pathname === '/dashboard/stock'}
                      tooltip="Stock"
                      className="group/item h-10 px-3 rounded-xl data-[active=true]:bg-gold-500/10 data-[active=true]:text-gold-700 dark:data-[active=true]:text-gold-400 hover:bg-gold-500/5 transition-all duration-300"
                    >
                      <Package className="h-[18px] w-[18px] transition-transform duration-200 group-hover/item:scale-105 opacity-70 data-[active=true]:opacity-100" data-active={pathname === '/dashboard/stock'} />
                      <span className="text-sm font-medium opacity-70 data-[active=true]:opacity-100 transition-all duration-200" data-active={pathname === '/dashboard/stock'}>Stock</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>

                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={() => handleNav('/dashboard/templates')}
                      isActive={pathname === '/dashboard/templates'}
                      tooltip="Templates"
                      className="group/item h-10 px-3 rounded-xl data-[active=true]:bg-gold-500/10 data-[active=true]:text-gold-700 dark:data-[active=true]:text-gold-400 hover:bg-gold-500/5 transition-all duration-300"
                    >
                      <Palette className="h-[18px] w-[18px] transition-transform duration-200 group-hover/item:scale-105 opacity-70 data-[active=true]:opacity-100" data-active={pathname === '/dashboard/templates'} />
                      <span className="text-sm font-medium opacity-70 data-[active=true]:opacity-100 transition-all duration-200" data-active={pathname === '/dashboard/templates'}>Templates</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </div>

              {/* Settings & Staff */}
              <div className="space-y-1 pt-2 border-t border-gold-500/10">
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={() => handleNav('/dashboard/settings')}
                      isActive={pathname === '/dashboard/settings'}
                      tooltip="Settings"
                      className="group/item h-10 px-3 rounded-xl data-[active=true]:bg-gold-500/10 data-[active=true]:text-gold-700 dark:data-[active=true]:text-gold-400 hover:bg-gold-500/5 transition-all duration-300"
                    >
                      <Settings className="h-[18px] w-[18px] transition-transform duration-200 group-hover/item:scale-105 opacity-70 data-[active=true]:opacity-100" data-active={pathname === '/dashboard/settings'} />
                      <span className="text-sm font-medium opacity-70 data-[active=true]:opacity-100 transition-all duration-200" data-active={pathname === '/dashboard/settings'}>Settings</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>

                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={() => handleNav('/dashboard/staff')}
                      isActive={pathname === '/dashboard/staff'}
                      tooltip="Staff"
                      className="group/item h-10 px-3 rounded-xl data-[active=true]:bg-gold-500/10 data-[active=true]:text-gold-700 dark:data-[active=true]:text-gold-400 hover:bg-gold-500/5 transition-all duration-300"
                    >
                      <Users className="h-[18px] w-[18px] transition-transform duration-200 group-hover/item:scale-105 opacity-70 data-[active=true]:opacity-100" data-active={pathname === '/dashboard/staff'} />
                      <span className="text-sm font-medium opacity-70 data-[active=true]:opacity-100 transition-all duration-200" data-active={pathname === '/dashboard/staff'}>Staff</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </div>

              {/* Upcoming Features */}
              <div className="space-y-1 pt-2 border-t border-gold-500/10">
                <Collapsible open={upcomingOpen} onOpenChange={setUpcomingOpen}>
                  <CollapsibleTrigger asChild>
                    <button className="flex items-center justify-between w-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest text-gold-600/60 hover:text-gold-600 transition-colors duration-200 group/trigger">
                      <span>Coming Soon</span>
                      <ChevronDown className={cn("h-3.5 w-3.5 transition-transform duration-200", upcomingOpen && "rotate-180")} />
                    </button>
                  </CollapsibleTrigger>

                  <CollapsibleContent className="space-y-1 mt-1">
                    <SidebarMenu>
                      <SidebarMenuItem>
                        <SidebarMenuButton
                          onClick={() => handleNav('/dashboard/khata')}
                          isActive={pathname === '/dashboard/khata'}
                          tooltip="Digital Khata Book"
                          className="group/item h-10 px-3 rounded-xl data-[active=true]:bg-emerald-500/5 hover:bg-gold-500/5 transition-all duration-200"
                        >
                          <BookOpen className="h-[18px] w-[18px] text-emerald-400/70 transition-transform duration-200 group-hover/item:scale-105" />
                          <span className="text-sm font-medium opacity-70 data-[active=true]:opacity-100 transition-all duration-200" data-active={pathname === '/dashboard/khata'}>Khata</span>
                          <span className="ml-auto text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400/70">Soon</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>

                      <SidebarMenuItem>
                        <SidebarMenuButton
                          onClick={() => handleNav('/dashboard/loyalty')}
                          isActive={pathname === '/dashboard/loyalty'}
                          tooltip="Loyalty Program"
                          className="group/item h-10 px-3 rounded-xl data-[active=true]:bg-purple-500/5 hover:bg-gold-500/5 transition-all duration-200"
                        >
                          <Crown className="h-[18px] w-[18px] text-purple-400/70 transition-transform duration-200 group-hover/item:scale-105" />
                          <span className="text-sm font-medium opacity-70 data-[active=true]:opacity-100 transition-all duration-200" data-active={pathname === '/dashboard/loyalty'}>Loyalty</span>
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
          <SidebarFooter className="border-t border-gold-500/10 p-4">
            <UserNav />
            <SidebarMenu className="mt-2 space-y-1">
              {/* Theme Toggle */}
              <SidebarMenuItem>
                <ThemeToggle />
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={handleSignOut}
                  tooltip="Sign Out"
                  className="group/signout h-10 px-3 rounded-xl hover:bg-destructive/5 transition-all duration-200"
                >
                  <LogOut className="h-[18px] w-[18px] text-destructive/70 transition-transform duration-200 group-hover/signout:scale-105" />
                  <span className="text-sm text-destructive/70 font-medium">Sign Out</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>
        <SidebarInset className="bg-heritage">
          {/* Desktop Sidebar Toggle */}
          <div className={cn(
            "hidden md:flex fixed top-4 z-50 transition-all duration-300 ease-in-out",
            open ? "left-[calc(var(--sidebar-width)+1rem)]" : "left-4"
          )}>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setOpen(!open)}
              className="hover:bg-accent text-foreground rounded-full bg-background/80 backdrop-blur-sm border border-gold-500/20 shadow-lg hover:shadow-gold-500/20 transition-all duration-300 hover:scale-110"
            >
              {open ? <PanelLeftClose className="h-5 w-5" /> : <PanelLeft className="h-5 w-5" />}
            </Button>
          </div>

          {/* Desktop Glassy Header */}
          <header className={cn(
            "hidden md:flex fixed top-0 right-0 z-40 h-16 items-center justify-between px-6 transition-all duration-300",
            "bg-white/70 dark:bg-black/50 backdrop-blur-2xl border-b border-gold-500/20 shadow-lg shadow-gold-500/5",
            open ? "left-[var(--sidebar-width)]" : "left-0"
          )}>
            {/* Subtle gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-gold-500/5 via-transparent to-gold-500/5 pointer-events-none"></div>

            {/* Left: Page Title & Search */}
            <div className="flex items-center gap-6 flex-1 pl-14 relative z-10">
              <div className="flex items-center gap-4">
                <h1 className="text-xl font-heading font-bold text-foreground tracking-tight">
                  {getTitle()}
                </h1>
                <div className="h-5 w-px bg-gradient-to-b from-transparent via-gold-500/30 to-transparent"></div>
                <div className="hidden lg:flex items-center text-xs text-muted-foreground font-medium">
                  <CalendarDays className="h-3.5 w-3.5 mr-2 text-gold-500/60" />
                  {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </div>
              </div>

              {/* Search Bar - Active */}
              <SearchBar />
            </div>

            {/* Right: Actions & User */}
            <div className="flex items-center gap-3 relative z-10">
              {/* Notifications */}
              <NotificationDropdown />

              <div className="h-6 w-px bg-gradient-to-b from-transparent via-gold-500/20 to-transparent mx-1"></div>

              {/* User Navigation (minimal - icon only) */}
              <UserNav minimal />
            </div>
          </header>

          {/* Mobile Header */}
          <header className="md:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 pb-3 pt-[calc(max(env(safe-area-inset-top),25px)+0.75rem)] glass-panel border-b border-gold-500/10 shadow-sm transition-all duration-300 h-[calc(max(env(safe-area-inset-top),25px)+3.5rem)]">
            <Button variant="ghost" size="icon" onClick={() => setOpenMobile(true)} className="-ml-2 hover:bg-gold-500/10 text-foreground">
              <Menu className="h-6 w-6" />
            </Button>
            <span className="font-heading font-bold text-xl tracking-tight text-foreground">{getTitle()}</span>
            <div className="-mr-2">
              <button
                onClick={() => router.push('/dashboard/settings')}
                className="rounded-full hover:opacity-80 transition-opacity"
              >
                <Avatar className="h-9 w-9 border border-gold-500/20">
                  <AvatarFallback className="bg-gold-500/10 text-gold-700 font-bold">
                    {user?.email ? user.email.charAt(0).toUpperCase() : 'U'}
                  </AvatarFallback>
                </Avatar>
              </button>
            </div>
          </header>

          <main className={cn(
            "flex-1 px-3 sm:px-4 md:px-6 pb-20 md:pb-6 md:pt-20 transition-all duration-300 max-w-[100vw] overflow-x-hidden",
            // For mobile (md:hidden), use safe-area-inset + header height
            "pt-[calc(max(env(safe-area-inset-top),25px)+3.5rem)]"
          )}>{children}</main>
          <FloatingNewInvoiceButton />
          <MobileBottomNav />
        </SidebarInset>
      </AuthWrapper>
    );
  }

  return (
    <SidebarProvider style={{ "--header-top": "calc(env(safe-area-inset-top) + 2rem)" } as React.CSSProperties}>
      <DashboardLayoutInternal>{children}</DashboardLayoutInternal>
    </SidebarProvider>
  );
}
