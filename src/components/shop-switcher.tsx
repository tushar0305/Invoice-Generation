'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useActiveShop } from '@/hooks/use-active-shop';
import { useSidebar } from '@/components/ui/sidebar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Building2, Check, ChevronDown, Loader2, PlusCircle, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

export function ShopSwitcher({ className }: { className?: string }) {
    const { activeShop, userShops, userRole, isLoading, switchShop } = useActiveShop();
    const { setOpenMobile } = useSidebar();
    const router = useRouter();
    const { toast } = useToast();
    const pathname = usePathname();

    // Always show the dropdown - even with no shops, show Create Shop option
    const displayName = pathname === '/admin' ? 'Global Admin' : (activeShop?.shopName || 'Select Shop');

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                        "justify-start gap-2 px-3 h-auto py-2.5 rounded-lg w-full",
                        "bg-white/5 hover:bg-white/10 backdrop-blur-sm border border-white/10",
                        "transition-all duration-200 hover:border-white/20",
                        className
                    )}
                >
                    <Building2 className="h-4 w-4 text-primary flex-shrink-0" />
                    <span className="font-medium truncate flex-1 text-left">{displayName}</span>
                    <ChevronDown className="h-4 w-4 text-muted-foreground ml-auto transition-transform duration-200 flex-shrink-0" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                align="start"
                className="w-64 z-[100] bg-background/95 backdrop-blur-xl border-white/10 shadow-2xl"
            >
                {userShops.length > 0 && (
                    <>
                        <DropdownMenuLabel className="text-xs uppercase tracking-wider text-muted-foreground/70">
                            Your Shops
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator className="bg-white/10" />
                        {userShops.map((shop) => (
                            <DropdownMenuItem
                                key={shop.id}
                                onClick={async () => {
                                    // Allow redirect if:
                                    // 1. Switching to a different shop
                                    // 2. Currently on /admin (so we want to go to the shop dashboard)
                                    if (shop.id !== activeShop?.id || pathname === '/admin') {
                                        // Close dropdown first
                                        setOpenMobile(false);
                                        // Update state AND navigate to new URL
                                        await switchShop(shop.id);
                                        router.push(`/shop/${shop.id}/dashboard`);
                                    }
                                }}
                                className={cn(
                                    "flex items-center gap-2 cursor-pointer rounded-md mx-1 my-0.5",
                                    "hover:bg-white/10 transition-all duration-200",
                                    shop.id === activeShop?.id && pathname !== '/admin' && "bg-primary/10 text-primary"
                                )}
                            >
                                <Building2 className="h-4 w-4" />
                                <span className="flex-1 truncate">{shop.shopName}</span>
                                {shop.id === activeShop?.id && pathname !== '/admin' && (
                                    <Check className="h-4 w-4 text-primary" />
                                )}
                            </DropdownMenuItem>
                        ))}
                    </>
                )}

                {/* Admin Dashboard - Only for owners with at least one shop */}
                {userRole?.role === 'owner' && userShops.length >= 1 && (
                    <>
                        <DropdownMenuSeparator className="bg-white/10" />
                        <DropdownMenuItem
                            onClick={() => {
                                router.push('/admin');
                                setOpenMobile(false);
                            }}
                            className="flex items-center gap-2 cursor-pointer rounded-md mx-1 my-0.5 hover:bg-white/10 transition-all duration-200 focus:bg-gold-500/10 focus:text-gold-700"
                        >
                            <ShieldCheck className="h-4 w-4 text-gold-400" />
                            <span className="flex-1">Admin Dashboard</span>
                            <Badge variant="secondary" className="bg-gold-500/20 text-gold-400 text-xs">
                                {userShops.length}
                            </Badge>
                        </DropdownMenuItem>
                    </>
                )}

                {/* Show Create New Shop option */}
                {(userRole?.role === 'owner' || userShops.length === 0) && (
                    <>
                        {userShops.length > 0 && <DropdownMenuSeparator className="bg-white/10" />}
                        <DropdownMenuItem
                            className="flex items-center gap-2 cursor-pointer text-primary focus:text-primary hover:bg-primary/10 rounded-md mx-1 my-0.5"
                            onClick={async () => {
                                // Reset onboarding step to 1
                                await supabase.rpc('update_onboarding_step', { p_step: 1 });
                                router.push('/onboarding/shop-setup');
                                setOpenMobile(false);
                            }}
                        >
                            <PlusCircle className="h-4 w-4" />
                            <span>{userShops.length === 0 ? 'Create Your First Shop' : 'Create New Shop'}</span>
                        </DropdownMenuItem>
                    </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

