'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/supabase/provider';
import { supabase } from '@/supabase/client';
import { useActiveShop } from '@/hooks/use-active-shop';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft } from 'lucide-react';
import { MotionWrapper } from '@/components/ui/motion-wrapper';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { haptics } from '@/lib/haptics';
import { NotificationType } from '@capacitor/haptics';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const stockItemSchema = z.object({
    name: z.string().trim().min(1, 'Item name is required'),
    description: z.string().trim().optional(),
    purity: z.string().trim().min(1, 'Purity is required'),
    basePrice: z.coerce.number().min(0, 'Price must be non-negative').default(0),
    baseWeight: z.coerce.number().min(0).optional(),
    makingChargePerGram: z.coerce.number().min(0, 'Making charge must be non-negative').default(0),
    quantity: z.coerce.number().min(0, 'Quantity must be non-negative').default(0),
    unit: z.string().trim().min(1, 'Unit is required'),
    category: z.string().trim().optional(),
    isActive: z.boolean().default(true),
});

type StockItemFormValues = z.infer<typeof stockItemSchema>;

export default function NewStockItemPage() {
    const router = useRouter();
    const { toast } = useToast();
    const { user } = useUser();
    const { activeShop } = useActiveShop();
    const [isPending, startTransition] = useTransition();

    const form = useForm<StockItemFormValues>({
        resolver: zodResolver(stockItemSchema),
        defaultValues: {
            name: '',
            description: '',
            purity: '22K',
            basePrice: 0,
            baseWeight: 0,
            makingChargePerGram: 0,
            quantity: 0,
            unit: 'gram',
            category: '',
            isActive: true,
        },
    });

    const onSubmit = (data: StockItemFormValues) => {
        if (!user) {
            toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in' });
            return;
        }

        startTransition(async () => {
            try {
                if (!activeShop?.id) {
                    toast({ variant: 'destructive', title: 'Error', description: 'No active shop selected' });
                    return;
                }

                const itemDb: any = {
                    user_id: user.uid,
                    shop_id: activeShop.id,
                    created_by: user.uid,
                    updated_by: user.uid,
                    name: data.name,
                    description: data.description || null,
                    purity: data.purity,
                    base_price: data.basePrice,
                    base_weight: data.baseWeight ?? null,
                    making_charge_per_gram: data.makingChargePerGram,
                    quantity: data.quantity,
                    unit: data.unit,
                    category: data.category || null,
                    is_active: data.isActive,
                    updated_at: new Date().toISOString(),
                };

                const { error } = await supabase
                    .from('stock_items')
                    .insert([itemDb]);

                if (error) throw error;

                haptics.notification(NotificationType.Success);
                toast({ title: 'Success', description: 'Stock item added successfully' });
                router.push('/dashboard/stock');
            } catch (err: any) {
                console.error('Error saving stock item:', err);
                toast({
                    variant: 'destructive',
                    title: 'Error',
                    description: 'Failed to save stock item. Please try again.',
                });
            }
        });
    };

    return (
        <MotionWrapper className="space-y-6 pb-24 max-w-2xl mx-auto">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-2xl font-heading font-bold text-primary">Add New Stock Item</h1>
                    <p className="text-muted-foreground text-sm">Enter the details for the new stock item.</p>
                </div>
            </div>

            <Card className="glass-card border-t-4 border-t-primary">
                <CardContent className="p-6">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <div className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Item Name *</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g., Gold Ring" {...field} className="bg-background/50" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="purity"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Purity *</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="e.g., 22K" {...field} className="bg-background/50" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="category"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Category</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="e.g., Gold" {...field} className="bg-background/50" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="quantity"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Quantity *</FormLabel>
                                                <FormControl>
                                                    <Input type="number" inputMode="numeric" placeholder="0" {...field} className="bg-background/50" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="unit"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Unit *</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="gram" {...field} className="bg-background/50" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <div className="p-4 rounded-lg bg-muted/30 border border-border/50 space-y-4">
                                    <h4 className="text-sm font-semibold text-muted-foreground mb-2">Pricing Details</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="basePrice"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Base Price (₹)</FormLabel>
                                                    <FormControl>
                                                        <Input type="number" inputMode="decimal" placeholder="0.00" {...field} className="bg-background" />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="makingChargePerGram"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Making Charge (₹)</FormLabel>
                                                    <FormControl>
                                                        <Input type="number" inputMode="decimal" placeholder="0.00" {...field} className="bg-background" />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </div>

                                <FormField
                                    control={form.control}
                                    name="description"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Description</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Optional details..." {...field} className="bg-background/50" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <Button type="submit" disabled={isPending} variant="premium" className="w-full h-12 text-lg">
                                {isPending && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                                Add Stock Item
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </MotionWrapper>
    );
}
