'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
import { Building2, Check, ChevronDown, Loader2, PlusCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function ShopSwitcher({ className }: { className?: string }) {
    const { activeShop, userShops, userRole, isLoading, switchShop } = useActiveShop();
    const { setOpenMobile } = useSidebar();
    const router = useRouter();
    const { toast } = useToast();

    if (isLoading) {
        return (
            <Button variant="ghost" size="sm" disabled className={cn("justify-start gap-2", className)}>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Loading...</span>
            </Button>
        );
    }

    if (!activeShop) {
        return null;
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                        "justify-start gap-2 px-3 h-auto py-2.5 rounded-lg",
                        "bg-white/5 hover:bg-white/10 backdrop-blur-sm border border-white/10",
                        "transition-all duration-200 hover:border-white/20",
                        className
                    )}
                >
                    <Building2 className="h-4 w-4 text-primary" />
                    <span className="font-medium truncate flex-1 text-left">{activeShop.shopName}</span>
                    <ChevronDown className="h-4 w-4 text-muted-foreground ml-auto transition-transform duration-200" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                align="start"
                className="w-64 z-[100] bg-background/95 backdrop-blur-xl border-white/10 shadow-2xl"
            >
                <DropdownMenuLabel className="text-xs uppercase tracking-wider text-muted-foreground/70">Switch Shop</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-white/10" />
                {userShops.map((shop) => (
                    <DropdownMenuItem
                        key={shop.id}
                        onClick={() => {
                            if (shop.id !== activeShop.id) {
                                switchShop(shop.id);
                            }
                        }}
                        className={cn(
                            "flex items-center gap-2 cursor-pointer rounded-md mx-1 my-0.5",
                            "hover:bg-white/10 transition-all duration-200",
                            shop.id === activeShop.id && "bg-primary/10 text-primary"
                        )}
                    >
                        <Building2 className="h-4 w-4" />
                        <span className="flex-1 truncate">{shop.shopName}</span>
                        {shop.id === activeShop.id && (
                            <Check className="h-4 w-4 text-primary" />
                        )}
                    </DropdownMenuItem>
                ))}
                {/* Only show Create New Shop option for owners */}
                {userRole?.role === 'owner' && (
                    <>
                        <DropdownMenuSeparator className="bg-white/10" />
                        <DropdownMenuItem
                            className="flex items-center gap-2 cursor-pointer text-primary focus:text-primary hover:bg-primary/10 rounded-md mx-1 my-0.5"
                            onClick={() => {
                                // Use URL param to trigger global dialog
                                const params = new URLSearchParams(window.location.search);
                                params.set('action', 'create-shop');
                                router.push(`?${params.toString()}`);
                                setOpenMobile(false);
                            }}
                        >
                            <PlusCircle className="h-4 w-4" />
                            <span>Create New Shop</span>
                        </DropdownMenuItem>
                    </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

