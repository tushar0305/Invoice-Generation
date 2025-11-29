'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
import { Loader2 } from 'lucide-react';
import { supabase } from '@/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useActiveShop } from '@/hooks/use-active-shop';

export function CreateShopDialog() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { toast } = useToast();
    const { switchShop } = useActiveShop();

    const [isOpen, setIsOpen] = useState(false);
    const [newShopName, setNewShopName] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    // Sync open state with URL param
    useEffect(() => {
        const action = searchParams.get('action');
        if (action === 'create-shop') {
            setIsOpen(true);
        } else {
            setIsOpen(false);
        }
    }, [searchParams]);

    const handleClose = () => {
        setIsOpen(false);
        // Remove query param
        const params = new URLSearchParams(searchParams.toString());
        params.delete('action');
        router.push(`?${params.toString()}`);
    };

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

            handleClose();
            setNewShopName('');

            // Switch to the new shop and navigate
            await switchShop(shopId);
            router.push(`/shop/${shopId}/dashboard`);

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

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
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
                    <Button variant="outline" onClick={handleClose}>Cancel</Button>
                    <Button onClick={handleCreateShop} disabled={isCreating || !newShopName.trim()}>
                        {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Create Shop
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
