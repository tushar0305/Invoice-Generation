'use client';

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useActiveShop } from '@/hooks/use-active-shop';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Loader2, Save, Package, Scale, IndianRupee, Tag, QrCode } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
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
import { ITEM_CATEGORIES, METAL_TYPES, PURITY_OPTIONS } from '@/lib/inventory-types';
import type { MetalType } from '@/lib/inventory-types';
import { InventoryBulkEntry } from '@/components/inventory/inventory-bulk-entry';
import { useMediaQuery } from '@/hooks/use-media-query';

const inventoryItemSchema = z.object({
    name: z.string().trim().min(1, 'Item name is required'),
    metal_type: z.enum(['GOLD', 'SILVER', 'DIAMOND', 'PLATINUM']),
    purity: z.string().min(1, 'Purity is required'),
    category: z.string().optional(),
    gross_weight: z.coerce.number().positive('Gross weight must be positive'),
    net_weight: z.coerce.number().positive('Net weight must be positive'),
    stone_weight: z.coerce.number().min(0).default(0),
    wastage_percent: z.coerce.number().min(0).max(100).default(0),
    making_charge_type: z.enum(['PER_GRAM', 'FIXED', 'PERCENT']).default('PER_GRAM'),
    making_charge_value: z.coerce.number().min(0).default(0),
    stone_value: z.coerce.number().min(0).default(0),
    hsn_code: z.string().optional(),
}).superRefine((data, ctx) => {
    // 1. Net Weight <= Gross Weight
    if (data.net_weight > data.gross_weight) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Net weight cannot be greater than gross weight",
            path: ["net_weight"],
        });
    }

    // 2. Gross - Stone ≈ Net
    const calculatedNet = data.gross_weight - data.stone_weight;
    if (Math.abs(calculatedNet - data.net_weight) > 0.01) {
         ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Net weight must equal Gross weight - Stone weight",
            path: ["net_weight"],
        });
    }

    // 3. Validate purity against metal_type
    const validPurities = PURITY_OPTIONS[data.metal_type as MetalType] || [];
    if (!validPurities.includes(data.purity)) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Invalid purity for ${data.metal_type}`,
            path: ["purity"],
        });
    }
});

type FormValues = z.infer<typeof inventoryItemSchema>;

export default function NewInventoryItemPage() {
    const router = useRouter();
    const { toast } = useToast();
    const { activeShop } = useActiveShop();
    const shopName = activeShop?.shopName || 'Shop';
    const shopId = activeShop?.id || '';
    const isDesktop = useMediaQuery('(min-width: 768px)');
    const [isPending, startTransition] = useTransition();
    const [selectedMetal, setSelectedMetal] = useState<MetalType>('GOLD');

    // Mobile form continues below...

    const form = useForm<FormValues>({
        resolver: zodResolver(inventoryItemSchema),
        defaultValues: {
            name: '',
            metal_type: 'GOLD',
            purity: '22K',
            category: '',
            gross_weight: 0,
            net_weight: 0,
            stone_weight: 0,
            wastage_percent: 0,
            making_charge_type: 'PER_GRAM',
            making_charge_value: 0,
            stone_value: 0,
            hsn_code: '',
        },
    });

    // Auto-calculate Net Weight
    const grossWeight = form.watch('gross_weight');
    const stoneWeight = form.watch('stone_weight');

    useEffect(() => {
        const net = (grossWeight || 0) - (stoneWeight || 0);
        form.setValue('net_weight', parseFloat(net.toFixed(3)));
    }, [grossWeight, stoneWeight, form]);

    const onSubmit = (data: FormValues) => {
        if (!activeShop?.id) {
            toast({ variant: 'destructive', title: 'Error', description: 'No shop selected' });
            return;
        }

        startTransition(async () => {
            try {
                const response = await fetch('/api/v1/inventory', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        shop_id: activeShop.id,
                        ...data,
                    }),
                });

                const result = await response.json();

                if (!response.ok) {
                    throw new Error(result.error || 'Failed to add item');
                }

                toast({
                    title: 'Item Added',
                    description: `Tag: ${result.item.tag_id}`,
                });

                router.push(`/shop/${activeShop.id}/inventory/${result.item.tag_id}`);
            } catch (err: any) {
                toast({
                    variant: 'destructive',
                    title: 'Error',
                    description: err.message,
                });
            }
        });
    };

    const handleMetalChange = (metal: MetalType) => {
        setSelectedMetal(metal);
        form.setValue('metal_type', metal);
        // Reset purity to first option for new metal
        form.setValue('purity', PURITY_OPTIONS[metal][0]);
    };

    // On desktop, show bulk entry
    if (isDesktop) {
        return <InventoryBulkEntry shopId={shopId} onClose={() => router.back()} />;
    }

    return (
        <div className="h-full overflow-y-auto pb-24 bg-background">
            {/* Header */}
            <div className="sticky top-0 z-30 bg-background border-b border-border px-4 py-3 flex items-center gap-3">
                <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full shrink-0">
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div className="flex-1 min-w-0">
                    <p className="text-[11px] text-muted-foreground truncate">{shopName}</p>
                    <h1 className="text-lg font-bold text-foreground leading-tight">Add New Item</h1>
                </div>
            </div>

            <div className="p-4 max-w-2xl mx-auto">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        {/* Basic Info */}
                        <Card className="bg-card border border-border rounded-xl shadow-sm">
                            <CardContent className="p-5 space-y-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <Package className="w-4 h-4 text-primary" />
                                    <h3 className="font-semibold text-sm">Item Details</h3>
                                </div>

                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Item Name *</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Enter item name" {...field} className="h-12" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="metal_type"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Metal *</FormLabel>
                                                <Select
                                                    value={field.value}
                                                    onValueChange={(v) => handleMetalChange(v as MetalType)}
                                                >
                                                    <FormControl>
                                                        <SelectTrigger className="h-12">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {METAL_TYPES.map((metal) => (
                                                            <SelectItem key={metal} value={metal}>{metal}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="purity"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Purity *</FormLabel>
                                                <Select value={field.value} onValueChange={field.onChange}>
                                                    <FormControl>
                                                        <SelectTrigger className="h-12">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {PURITY_OPTIONS[selectedMetal].map((p) => (
                                                            <SelectItem key={p} value={p}>{p}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <FormField
                                    control={form.control}
                                    name="category"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Category</FormLabel>
                                            <Select value={field.value || ''} onValueChange={field.onChange}>
                                                <FormControl>
                                                    <SelectTrigger className="h-12">
                                                        <SelectValue placeholder="Select category" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {ITEM_CATEGORIES.map((cat) => (
                                                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="hsn_code"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>HSN Code</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g. 7113" {...field} className="h-12" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />


                            </CardContent>
                        </Card>

                        {/* Weight */}
                        <Card className="bg-card border border-border rounded-xl shadow-sm">
                            <CardContent className="p-5 space-y-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <Scale className="w-4 h-4 text-blue-500" />
                                    <h3 className="font-semibold text-sm">Weight Details (grams)</h3>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="gross_weight"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Gross Weight *</FormLabel>
                                                <FormControl>
                                                    <Input type="number" step="0.001" {...field} className="h-12" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="net_weight"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Net Weight *</FormLabel>
                                                <FormControl>
                                                    <Input type="number" step="0.001" {...field} className="h-12" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="stone_weight"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Stone Weight</FormLabel>
                                                <FormControl>
                                                    <Input type="number" step="0.001" {...field} className="h-12" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="wastage_percent"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Wastage %</FormLabel>
                                                <FormControl>
                                                    <Input type="number" step="0.1" {...field} className="h-12" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Stone Details (Optional) */}
                        <Card className="bg-card border border-border rounded-xl shadow-sm">
                            <CardContent className="p-5 space-y-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <IndianRupee className="w-4 h-4 text-purple-500" />
                                    <h3 className="font-semibold text-sm">Additional Charges</h3>
                                </div>

                                <FormField
                                    control={form.control}
                                    name="making_charge_value"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Making Charge (₹/g)</FormLabel>
                                            <FormControl>
                                                <Input type="number" step="0.01" {...field} className="h-12" />
                                            </FormControl>
                                            <p className="text-xs text-muted-foreground">Making charges per gram</p>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="stone_value"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Stone Value (₹)</FormLabel>
                                            <FormControl>
                                                <Input type="number" step="0.01" {...field} className="h-12" />
                                            </FormControl>
                                            <p className="text-xs text-muted-foreground">Total value of stones/gems in this item</p>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                            </CardContent>
                        </Card>

                        {/* Submit */}
                        <Button
                            type="submit"
                            className="w-full h-12 text-lg font-semibold gap-2 bg-gradient-to-r from-primary to-amber-600 shadow-lg"
                            disabled={isPending}
                        >
                            {isPending ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <QrCode className="w-5 h-5" />
                                    Create & Generate Tag
                                </>
                            )}
                        </Button>
                    </form>
                </Form>
            </div >
        </div >
    );
}
