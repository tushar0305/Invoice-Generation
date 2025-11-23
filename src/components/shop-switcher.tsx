'use client';

import { useState } from 'react';
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
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [newShopName, setNewShopName] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const { toast } = useToast();

    const handleCreateShop = async () => {
        if (!newShopName.trim()) return;

        try {
            setIsCreating(true);
            const { data: shopId, error } = await supabase.rpc('create_new_shop', {
                p_shop_name: newShopName.trim()
            });

            if (error) throw error;

            toast({
                title: 'Success!',
                description: 'Shop created successfully.',
            });

            setIsCreateOpen(false);
            setNewShopName('');

            // Switch to the new shop and reload to ensure fresh state
            await switchShop(shopId);
            window.location.reload();

        } catch (error: any) {
            console.error('Error creating shop:', error);
            toast({
                variant: 'destructive',
                title: 'Creation Failed',
                description: error.message || 'Failed to create shop.',
            });
        } finally {
            setIsCreating(false);
        }
    };

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
        <>
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
                                    setIsCreateOpen(true);
                                    // Close sidebar after dialog opens to prevent auto-close
                                    setTimeout(() => setOpenMobile(false), 100);
                                }}
                            >
                                <PlusCircle className="h-4 w-4" />
                                <span>Create New Shop</span>
                            </DropdownMenuItem>
                        </>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>

            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create New Shop</DialogTitle>
                        <DialogDescription>
                            Add a new shop to your account. You will be the owner.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="shop-name">Shop Name</Label>
                            <Input
                                id="shop-name"
                                placeholder="My New Shop"
                                value={newShopName}
                                onChange={(e) => setNewShopName(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                        <Button onClick={handleCreateShop} disabled={isCreating || !newShopName.trim()}>
                            {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Create Shop
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
