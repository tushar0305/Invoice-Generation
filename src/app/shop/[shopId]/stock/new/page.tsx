'use client';

import { useState, useTransition, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUser } from '@/supabase/provider';
import { supabase } from '@/supabase/client';
import { useActiveShop } from '@/hooks/use-active-shop';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft, Save, Package, Tag, Scale, IndianRupee } from 'lucide-react';
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
import { haptics, NotificationType } from '@/lib/haptics';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';

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
    const searchParams = useSearchParams();
    const editId = searchParams.get('edit');
    const { toast } = useToast();
    const { user } = useUser();
    const { activeShop } = useActiveShop();
    const [isPending, startTransition] = useTransition();
    const [isLoading, setIsLoading] = useState(!!editId);

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

    useEffect(() => {
        if (!editId || !activeShop?.id) return;

        const loadItem = async () => {
            try {
                const { data, error } = await supabase
                    .from('stock_items')
                    .select('*')
                    .eq('id', editId)
                    .eq('shop_id', activeShop.id)
                    .single();

                if (error) throw error;

                if (data) {
                    form.reset({
                        name: data.name,
                        description: data.description || '',
                        purity: data.purity,
                        basePrice: Number(data.base_price) || 0,
                        baseWeight: Number(data.base_weight) || 0,
                        makingChargePerGram: Number(data.making_charge_per_gram) || 0,
                        quantity: Number(data.quantity) || 0,
                        unit: data.unit,
                        category: data.category || '',
                        isActive: data.is_active ?? true,
                    });
                }
            } catch (err) {
                console.error('Error loading stock item:', err);
                toast({ variant: 'destructive', title: 'Error', description: 'Failed to load item' });
                router.push(`/shop/${activeShop?.id}/stock`);
            } finally {
                setIsLoading(false);
            }
        };

        loadItem();
    }, [editId, activeShop?.id, form, router, toast]);

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

                const payload = {
                    shopId: activeShop.id,
                    name: data.name,
                    description: data.description,
                    purity: data.purity,
                    basePrice: data.basePrice,
                    baseWeight: data.baseWeight || 0, // Ensure 0 is sent if undefined/null
                    makingChargePerGram: data.makingChargePerGram,
                    quantity: data.quantity,
                    unit: data.unit,
                    category: data.category,
                    isActive: data.isActive,
                };

                let response;
                if (editId) {
                    response = await fetch(`/api/v1/stock/${editId}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload),
                    });
                } else {
                    response = await fetch('/api/v1/stock', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload),
                    });
                }

                const result = await response.json();

                if (!response.ok) {
                    throw new Error(result.error || 'Failed to save stock item');
                }

                haptics.notification(NotificationType.Success);
                toast({
                    title: 'Success',
                    description: editId ? 'Stock item updated successfully' : 'Stock item added successfully'
                });

                router.push(`/shop/${activeShop.id}/stock`);
                router.refresh();
            } catch (err: any) {
                console.error('Error saving stock item:', err);
                toast({
                    variant: 'destructive',
                    title: 'Error',
                    description: err?.message || 'Failed to save stock item. Please try again.',
                });
            }
        });
    };

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-black pb-24">
            {/* Header */}
            <div className="sticky top-0 z-30 bg-white/90 dark:bg-gray-950/90 backdrop-blur-md border-b border-gray-300 dark:border-gray-700 px-6 py-4 flex items-center gap-4 shadow-sm">
                <Button variant="ghost" size="icon" onClick={() => router.back()} className="-ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
                        {editId ? 'Edit Item' : 'Add New Item'}
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        {editId ? 'Update stock details' : 'Add new inventory to your shop'}
                    </p>
                </div>
            </div>

            <div className="p-4 max-w-3xl mx-auto">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                        {/* Basic Info Card */}
                        <Card className="border border-gray-300 dark:border-gray-700 shadow-sm bg-white dark:bg-gray-900/50">
                            <CardContent className="p-4 space-y-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <Package className="w-4 h-4 text-blue-500" />
                                    <h3 className="font-semibold text-sm">Basic Details</h3>
                                </div>

                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground">Item Name</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g. Gold Ring" {...field} className="bg-gray-50 dark:bg-gray-800/50" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="category"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground">Category</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="e.g. Ring" {...field} className="bg-gray-50 dark:bg-gray-800/50" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="purity"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground">Purity</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger className="bg-gray-50 dark:bg-gray-800/50">
                                                            <SelectValue placeholder="Select" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="24K">24K</SelectItem>
                                                        <SelectItem value="22K">22K</SelectItem>
                                                        <SelectItem value="18K">18K</SelectItem>
                                                        <SelectItem value="14K">14K</SelectItem>
                                                        <SelectItem value="Silver">Silver</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Pricing & Weight Card */}
                        <Card className="border border-gray-300 dark:border-gray-700 shadow-sm bg-white dark:bg-gray-900/50">
                            <CardContent className="p-4 space-y-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <IndianRupee className="w-4 h-4 text-green-500" />
                                    <h3 className="font-semibold text-sm">Pricing & Weight</h3>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="basePrice"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground">Base Price</FormLabel>
                                                <FormControl>
                                                    <Input type="number" {...field} className="bg-gray-50 dark:bg-gray-800/50" />
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
                                                <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground">Making /g</FormLabel>
                                                <FormControl>
                                                    <Input type="number" {...field} className="bg-gray-50 dark:bg-gray-800/50" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="baseWeight"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground">Weight (g)</FormLabel>
                                                <FormControl>
                                                    <Input type="number" step="0.001" {...field} className="bg-gray-50 dark:bg-gray-800/50" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="quantity"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground">Quantity</FormLabel>
                                                <FormControl>
                                                    <Input type="number" {...field} className="bg-gray-50 dark:bg-gray-800/50" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Additional Info */}
                        <Card className="border border-gray-300 dark:border-gray-700 shadow-sm bg-white dark:bg-gray-900/50">
                            <CardContent className="p-4 space-y-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <Tag className="w-4 h-4 text-purple-500" />
                                    <h3 className="font-semibold text-sm">Additional Info</h3>
                                </div>

                                <FormField
                                    control={form.control}
                                    name="description"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground">Description</FormLabel>
                                            <FormControl>
                                                <Textarea placeholder="Optional details..." {...field} className="bg-gray-50 dark:bg-gray-800/50 min-h-[80px]" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="isActive"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm bg-gray-50 dark:bg-gray-800/50">
                                            <div className="space-y-0.5">
                                                <FormLabel className="text-sm font-medium">Active Status</FormLabel>
                                                <p className="text-xs text-muted-foreground">Item visible in stock</p>
                                            </div>
                                            <FormControl>
                                                <Switch
                                                    checked={field.value}
                                                    onCheckedChange={field.onChange}
                                                />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                            </CardContent>
                        </Card>

                        {/* Bottom Action Bar */}
                        {/* Action Bar - Contained */}
                        <div className="pt-4">
                            <Button
                                type="submit"
                                className="w-full h-12 rounded-xl text-lg font-semibold shadow-lg shadow-blue-500/20 transition-all hover:scale-[1.01]"
                                disabled={isPending}
                            >
                                {isPending ? (
                                    <>
                                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save className="mr-2 h-5 w-5" />
                                        Save Item
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                </Form>
            </div>
        </div>
    );
}