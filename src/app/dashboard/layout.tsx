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
  LayoutDashboard,
  Users,
  FileText,
  Settings,
  LogOut,
  PlusCircle,
  Package,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Logo } from '@/components/logo';
import { AuthWrapper } from '@/components/auth-wrapper';
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

function UserNav() {
  const { user } = useUser();
  const router = useRouter();
  const { setOpenMobile } = useSidebar();

  if (!user) {
    return null;
  }

  const fallback = user.email ? user.email.charAt(0).toUpperCase() : 'U';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex w-full items-center gap-3 rounded-md p-2 text-left text-sm hover:bg-sidebar-accent">
          <Avatar className="h-9 w-9">
            <AvatarFallback>{fallback}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col truncate">
            <span className="font-medium text-sidebar-foreground">
              {user.email}
            </span>
            <span className="text-xs text-muted-foreground">Jeweller</span>
          </div>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-56"
        align="end"
        side="top"
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
  const router = useRouter();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const { setOpenMobile, isMobile } = useSidebar();

  useEffect(() => {
    async function fetchSettings() {
      const { data, error } = await supabase.from('user_settings').select('*').single();
      if (!error) {
        setSettings(data);
      }
    }
    fetchSettings();
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
    if (pathname === '/dashboard/stock') return 'Stock';
    if (pathname === '/dashboard/settings') return 'Settings';
    return 'Dashboard';
  };

  return (
    <AuthWrapper>
      <Sidebar>
        <SidebarHeader>
          <div 
            onClick={() => isMobile && setOpenMobile(false)}
            className="cursor-pointer"
            role="button"
            aria-label="Close sidebar"
          >
            <Logo />
          </div>
        </SidebarHeader>
        <SidebarContent>
          <NavMenu />
        </SidebarContent>
        <SidebarFooter>
          <div className="flex flex-col gap-2">
            <UserNav />
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={handleSignOut}
                  tooltip="Sign Out"
                >
                  <LogOut />
                  <span>Sign Out</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </div>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <main className="flex-1 p-4 sm:p-6 pb-20 md:pb-6">{children}</main>
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
    <SidebarProvider>
      <DashboardLayoutInternal>{children}</DashboardLayoutInternal>
    </SidebarProvider>
  );
}
