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
                    className={cn("justify-start gap-2 px-3 h-auto py-2", className)}
                >
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium truncate flex-1 text-left">{activeShop.shopName}</span>
                    <ChevronDown className="h-4 w-4 text-muted-foreground ml-auto" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64 z-[100]">
                <DropdownMenuLabel>Switch Shop</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {userShops.map((shop) => (
                    <DropdownMenuItem
                        key={shop.id}
                        onClick={() => {
                            if (shop.id !== activeShop.id) {
                                switchShop(shop.id);
                            }
                        }}
                        className="flex items-center gap-2 cursor-pointer"
                    >
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span className="flex-1 truncate">{shop.shopName}</span>
                        {shop.id === activeShop.id && (
                            <Check className="h-4 w-4 text-primary" />
                        )}
                    </DropdownMenuItem>
                ))}
                {/* Only show Create New Shop option for owners */}
                {userRole?.role === 'owner' && (
                    <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            className="flex items-center gap-2 cursor-pointer text-primary focus:text-primary"
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
