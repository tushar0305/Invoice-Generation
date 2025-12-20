'use client';

import Image from 'next/image';
import { AuthWrapper } from '@/components/auth-wrapper';
import { useTheme } from '@/components/theme-provider';
import { Button } from '@/components/ui/button';
import { LogOut, Moon, Sun, Menu } from 'lucide-react';
import { useAuth, useUser } from '@/supabase/provider';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const auth = useAuth();
    const { user } = useUser();
    const router = useRouter();
    const { theme, setTheme } = useTheme();

    // Calculate logo based on theme
    const logoSrc = theme === 'dark' ? '/logo/swarnavyapar_dark.png' : '/logo/swarnavyapar_light.png';

    const handleSignOut = async () => {
        await auth.signOut();
        router.push('/login');
    };

    const toggleTheme = () => {
        setTheme(theme === 'dark' ? 'light' : 'dark');
    };

    const userInitial = user?.email ? user.email.charAt(0).toUpperCase() : 'A';

    return (
        <AuthWrapper>
            <div className="min-h-screen bg-slate-50 dark:bg-[#0a0a0b] flex flex-col">
                {/* Native-feeling Header */}
                <header className="sticky top-0 z-50 bg-white/80 dark:bg-[#0a0a0b]/80 backdrop-blur-xl border-b border-slate-200 dark:border-white/10 safe-area-top">
                    <div className="flex h-14 md:h-16 items-center justify-between px-4 md:px-6">
                        {/* Logo */}
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-24 md:h-10 md:w-32 relative">
                                <Image
                                    src={logoSrc}
                                    alt="Swarnavyapar Logo"
                                    fill
                                    className="object-contain"
                                    priority
                                />
                            </div>
                            <span className="hidden md:inline-block text-xs font-medium text-muted-foreground bg-gold-500/10 text-gold-600 dark:text-gold-400 px-2 py-0.5 rounded-full">
                                Admin
                            </span>
                        </div>

                        {/* Right Actions */}
                        <div className="flex items-center gap-2 md:gap-3">
                            {/* Theme Toggle */}
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={toggleTheme}
                                className="h-9 w-9 rounded-full hover:bg-slate-100 dark:hover:bg-white/10"
                            >
                                {theme === 'dark' ? (
                                    <Sun className="h-4 w-4 text-gold-400" />
                                ) : (
                                    <Moon className="h-4 w-4 text-slate-600" />
                                )}
                            </Button>

                            {/* User Menu */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button className="flex items-center gap-2 rounded-full pl-1 pr-3 py-1 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors">
                                        <Avatar className="h-8 w-8 border border-gold-500/20">
                                            <AvatarFallback className="bg-gold-500/10 text-gold-700 dark:text-gold-400 text-sm font-bold">
                                                {userInitial}
                                            </AvatarFallback>
                                        </Avatar>
                                        <span className="hidden md:block text-sm font-medium text-foreground max-w-[120px] truncate">
                                            {user?.email?.split('@')[0] || 'Admin'}
                                        </span>
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48 bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10">
                                    <DropdownMenuItem
                                        onClick={handleSignOut}
                                        className="text-red-600 dark:text-red-400 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-500/10 cursor-pointer"
                                    >
                                        <LogOut className="mr-2 h-4 w-4" />
                                        <span>Sign Out</span>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                </header>

                {/* Main Content */}
                <main className="flex-1 overflow-y-auto">
                    <div className="p-4 md:p-6 lg:p-8 pb-24 md:pb-8">
                        {children}
                    </div>
                </main>

                {/* Subtle Footer - Desktop only */}
                <footer className="hidden md:block py-3 px-6 border-t border-slate-200 dark:border-white/10 bg-white/60 dark:bg-black/60 backdrop-blur-sm">
                    <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                        <span>SwarnaVyapar Admin</span>
                        <span className="opacity-50">•</span>
                        <span>© {new Date().getFullYear()}</span>
                    </div>
                </footer>
            </div>
        </AuthWrapper>
    );
}
