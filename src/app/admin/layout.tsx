'use client';

import Image from 'next/image';
import { AuthWrapper } from '@/components/auth-wrapper';
import { useTheme } from '@/components/theme-provider';
import {
    SidebarProvider,
    Sidebar,
    SidebarHeader,
    SidebarContent,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
    SidebarFooter,
    SidebarInset
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { LogOut, LayoutDashboard, Settings, User } from 'lucide-react';
import { useAuth, useUser } from '@/supabase/provider';
import { useRouter, usePathname } from 'next/navigation';
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

function AdminUserNav() {
    const { user } = useUser();
    const router = useRouter();

    if (!user) return null;
    const fallback = user.email ? user.email.charAt(0).toUpperCase() : 'A';

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 rounded-xl p-2 text-left text-sm hover:bg-gold-500/5 transition-colors border border-transparent hover:border-gold-500/10 w-full">
                    <Avatar className="h-9 w-9 border border-gold-500/20">
                        <AvatarFallback className="bg-gold-500/10 text-gold-700 font-heading font-bold">{fallback}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col min-w-0 items-start">
                        <span className="font-medium text-sm truncate">{user.email}</span>
                        <span className="text-[10px] text-muted-foreground">Global Admin</span>
                    </div>
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 glass-panel" align="end" side="bottom">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push('/admin/settings')}>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const auth = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const { theme } = useTheme();

    // Calculate logo based on theme
    const logoSrc = theme === 'dark' ? '/logo/swarnavyapar_dark.webp' : '/logo/swarnavyapar.webp';

    const handleSignOut = async () => {
        await auth.signOut();
        router.push('/login');
    };

    return (
        <AuthWrapper>
            <SidebarProvider>
                <Sidebar className="border-r border-gold-500/10 bg-background/80 backdrop-blur-xl">
                    <SidebarHeader className="relative overflow-hidden">
                        <div className="px-4 py-3 relative z-10 pt-[max(0.75rem,env(safe-area-inset-top))]">
                            <div className="flex items-center justify-center gap-2">
                                <div className="h-12 w-32 relative">
                                    <Image
                                        src={logoSrc}
                                        alt="Swarnavyapar Logo"
                                        fill
                                        className="object-contain"
                                        priority
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="px-4 pb-3">
                            <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-gold-500/30 to-transparent"></div>
                        </div>
                    </SidebarHeader>

                    <SidebarContent className="px-4 py-4">
                        <SidebarMenu>
                            <SidebarMenuItem>
                                <SidebarMenuButton
                                    onClick={() => router.push('/admin')}
                                    isActive={pathname === '/admin'}
                                    className="group/item h-10 px-3 rounded-xl data-[active=true]:bg-gold-500/10 data-[active=true]:text-gold-700 dark:data-[active=true]:text-gold-400 hover:bg-gold-500/5 transition-all duration-300"
                                >
                                    <LayoutDashboard className="h-[18px] w-[18px]" />
                                    <span className="text-sm font-medium">Overview</span>
                                </SidebarMenuButton>
                            </SidebarMenuItem>

                            {/* Add more global admin links here if needed */}
                        </SidebarMenu>
                    </SidebarContent>

                    <SidebarFooter className="border-t border-gold-500/10 p-4">
                        <AdminUserNav />
                        <SidebarMenu className="mt-2 space-y-1">
                            <SidebarMenuItem>
                                <ThemeToggle />
                            </SidebarMenuItem>
                            <SidebarMenuItem>
                                <SidebarMenuButton
                                    onClick={handleSignOut}
                                    className="group/signout h-10 px-3 rounded-xl hover:bg-destructive/5 transition-all duration-200"
                                >
                                    <LogOut className="h-[18px] w-[18px] text-destructive/70" />
                                    <span className="text-sm text-destructive/70 font-medium">Sign Out</span>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarFooter>
                </Sidebar>

                <SidebarInset className="bg-slate-50 dark:bg-slate-950 flex flex-col">
                    <header className="flex h-14 items-center gap-4 border-b bg-background/60 px-6 backdrop-blur-xl lg:h-[60px]">
                        <div className="flex-1">
                            <h1 className="text-lg font-semibold font-heading text-foreground">Global Admin</h1>
                        </div>
                    </header>
                    <main className="flex-1 p-6 pt-8 overflow-y-auto">
                        {children}
                    </main>
                    <footer className="py-3 px-6 border-t border-border/40 bg-background/60 backdrop-blur-sm mt-auto">
                        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                            <span>Swarnavyapar Admin</span>
                            <span className="opacity-50">•</span>
                            <span>v{process.env.npm_package_version || '0.1.0'}</span>
                            <span className="opacity-50">•</span>
                            <span>© {new Date().getFullYear()}</span>
                        </div>
                    </footer>
                </SidebarInset>
            </SidebarProvider>
        </AuthWrapper>
    );
}
