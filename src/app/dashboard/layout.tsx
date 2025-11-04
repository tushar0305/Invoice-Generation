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
} from '@/components/ui/sidebar';
import {
  LayoutDashboard,
  Users,
  FileText,
  Settings,
  LogOut,
  PlusCircle,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Logo } from '@/components/logo';
import { AuthWrapper } from '@/components/auth-wrapper';
import { useAuth, useUser } from '@/firebase';
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

function UserNav() {
  const { user } = useUser();
  const router = useRouter();

  if (!user) {
    return null;
  }

  const fallback = user.email ? user.email.charAt(0).toUpperCase() : 'U';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex w-full items-center gap-3 rounded-md p-2 text-left text-sm hover:bg-sidebar-accent">
          <Avatar className="h-9 w-9">
            {user.photoURL && (
              <AvatarImage src={user.photoURL} alt={user.email ?? ''} />
            )}
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
        <DropdownMenuItem
          onClick={() => router.push('/dashboard/settings')}
          className="cursor-pointer"
        >
          <Settings className="mr-2 h-4 w-4" />
          <span>Settings</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const auth = useAuth();

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
    if (pathname === '/dashboard/settings') return 'Settings';
    return 'Dashboard';
  };

  return (
    <AuthWrapper>
      <SidebarProvider>
        <Sidebar>
          <SidebarHeader>
            <Logo />
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu className="flex flex-col gap-2">
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === '/dashboard'}
                  tooltip="Dashboard"
                >
                  <Link href="/dashboard">
                    <LayoutDashboard />
                    <span>Dashboard</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname.startsWith('/dashboard/invoices')}
                  tooltip="Invoices"
                >
                  <Link href="/dashboard/invoices">
                    <FileText />
                    <span>Invoices</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === '/dashboard/customers'}
                  tooltip="Customers"
                >
                  <Link href="/dashboard/customers">
                    <Users />
                    <span>Customers</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <div className="px-2 pt-4">
                <Button
                  variant="outline"
                  className="h-auto w-full justify-start gap-2 p-2 text-left"
                  onClick={() => router.push('/dashboard/invoices/new')}
                >
                  <PlusCircle />
                  <span>New Invoice</span>
                </Button>
              </div>
            </SidebarMenu>
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
          <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:h-16 sm:px-6">
            <SidebarTrigger className="md:hidden" />
            <div className="flex w-full items-center justify-between">
              <h1 className="font-headline text-lg font-semibold md:text-xl">
                {getTitle()}
              </h1>
            </div>
          </header>
          <main className="flex-1 p-4 sm:p-6">{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </AuthWrapper>
  );
}
