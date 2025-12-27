'use client';

import { useState, useTransition, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useActiveShop } from '@/hooks/use-active-shop';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Loader2, Save, History, Zap, CheckCircle2, Scale, Keyboard, LayoutGrid, X, QrCode, ChevronLeft } from 'lucide-react';
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
import { INVENTORY_CATEGORIES, METAL_TYPES, PURITY_OPTIONS } from '@/lib/inventory-types';
import type { MetalType } from '@/lib/inventory-types';
import Link from 'next/link';
import { cn } from '@/lib/utils';

// Enhanced Schema with new fields
const inventoryItemSchema = z.object({
    name: z.string().trim().min(1, 'Item name is required'), // Auto-generated often
    metal_type: z.enum(['GOLD', 'SILVER', 'DIAMOND', 'PLATINUM']),
    purity: z.string().min(1, 'Purity is required'),
    category: z.string().optional(),
    sub_category: z.string().optional(),
    collection: z.string().optional(),
    gross_weight: z.coerce.number().positive('Gross weight must be positive'),
    net_weight: z.coerce.number().positive('Net weight must be positive'),
    stone_weight: z.coerce.number().min(0).default(0),
    wastage_percent: z.coerce.number().min(0).max(100).default(0),
    making_charge_type: z.enum(['PER_GRAM', 'FIXED', 'PERCENT']).default('PER_GRAM'),
    making_charge_value: z.coerce.number().min(0).default(0),
    stone_value: z.coerce.number().min(0).default(0),
    huid: z.string().optional(),
    hsn_code: z.string().optional(),
});

type FormValues = z.infer<typeof inventoryItemSchema>;

export default function NewInventoryItemPage() {
    const router = useRouter();
    const { toast } = useToast();
    const { activeShop } = useActiveShop();
    const shopId = activeShop?.id || '';
    const [isPending, startTransition] = useTransition();
    const [selectedMetal, setSelectedMetal] = useState<MetalType>('GOLD');
    const [recentItems, setRecentItems] = useState<{ id: string; tag: string; name: string; weight: number }[]>([]);

    // Refs for focus management
    const nameInputRef = useRef<HTMLInputElement>(null);

    const form = useForm<FormValues>({
        resolver: zodResolver(inventoryItemSchema),
        defaultValues: {
            name: '',
            metal_type: 'GOLD',
            purity: '22K',
            category: 'Ring', // Smart default
            gross_weight: 0,
            net_weight: 0,
            stone_weight: 0,
            wastage_percent: 0,
            making_charge_type: 'PER_GRAM',
            making_charge_value: 0,
            stone_value: 0,
            huid: '',
            hsn_code: '',
        },
    });

    // Auto-calculate Net Weight
    const grossWeight = form.watch('gross_weight');
    const stoneWeight = form.watch('stone_weight');
    const category = form.watch('category');

    useEffect(() => {
        const net = (grossWeight || 0) - (stoneWeight || 0);
        form.setValue('net_weight', parseFloat(net.toFixed(3)));
    }, [grossWeight, stoneWeight, form]);

    // Smart Naming: Auto-fill name if empty based on category + weight
    useEffect(() => {
        if (category && grossWeight > 0 && !form.getValues('name')) {
            form.setValue('name', `${selectedMetal} ${category} ${grossWeight}g`);
        }
    }, [category, grossWeight, selectedMetal, form]);

    const onSubmit = (data: FormValues) => {
        if (!activeShop?.id) return;

        startTransition(async () => {
            try {
                // Optimistic UI check could go here
                const response = await fetch('/api/v1/inventory', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        shop_id: activeShop.id,
                        ...data,
                    }),
                });

                const result = await response.json();
                if (!response.ok) throw new Error(result.error);

                // Success!
                toast({
                    title: 'Item Added Successfully',
                    description: `Tag: ${result.item.tag_id} | ${data.name}`,
                    variant: 'default',
                    className: 'border-green-500 bg-green-50 dark:bg-green-900/10',
                });

                // Add to recent list
                setRecentItems(prev => [{
                    id: result.item.id,
                    tag: result.item.tag_id,
                    name: data.name,
                    weight: data.net_weight
                }, ...prev].slice(0, 8));

                // Reset for next item (Keep Metal/Category/Purity as they likely haven't changed)
                form.reset({
                    ...data,
                    name: '',
                    gross_weight: 0,
                    net_weight: 0,
                    stone_weight: 0,
                    stone_value: 0,
                    huid: '',
                    // Keep making charges/wastage as they might be consistent
                });

                // Refocus on Name for next item
                setTimeout(() => nameInputRef.current?.focus(), 50);

            } catch (err: any) {
                toast({ variant: 'destructive', title: 'Error', description: err.message });
            }
        });
    };

    const handleKeyDown = (e: React.KeyboardEvent, fieldName?: string) => {
        // Enter key navigation logic could be enhanced here
        // For now, reliance on Tab/Shift+Tab is standard, but we can intercept Enter to 'Save' if on last field
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            form.handleSubmit(onSubmit)();
        }
    };

    // Resizable Sidebar Logic
    const [sidebarWidth, setSidebarWidth] = useState(400);
    const sidebarRef = useRef<HTMLDivElement>(null);
    const isResizing = useRef(false);

    const startResizing = (e: React.MouseEvent) => {
        e.preventDefault();
        isResizing.current = true;
        const startX = e.clientX;
        const startWidth = sidebarWidth;

        const onMouseMove = (e: MouseEvent) => {
            if (!isResizing.current) return;
            // Calculate new width (Right sidebar grows to left, so subtract delta)
            const newWidth = startWidth - (e.clientX - startX);
            // Min 250px, Max 800px
            if (newWidth >= 250 && newWidth <= 800) {
                setSidebarWidth(newWidth);
            }
        };

        const onMouseUp = () => {
            isResizing.current = false;
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
            document.body.style.cursor = 'default';
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
        document.body.style.cursor = 'col-resize';
    };

    return (
        // Native App Container: Fixed Full Screen on Mobile (z-50)
        <div className="flex flex-col md:flex-row bg-background md:bg-muted/5 h-[100dvh] md:h-[calc(100vh-64px)] fixed inset-0 z-[100] md:static md:z-auto md:overflow-hidden">
            {/* LEFT: Main Entry Form (Fluid Width) */}
            <div className="flex-1 flex flex-col border-r border-border/50 bg-background/50 backdrop-blur-sm h-full overflow-hidden min-w-0">

                {/* Header */}
                <div className="shrink-0 z-30 bg-background/95 backdrop-blur border-b border-border px-4 py-3 md:px-6 md:py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3 md:gap-4">
                        <Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-2 -ml-2 pl-2 hover:bg-transparent md:hover:bg-muted md:rounded-full md:h-10 md:w-10 md:p-0 md:justify-center">
                            <ChevronLeft className="h-5 w-5 md:h-5 md:w-5" />
                            <span className="text-lg font-semibold md:hidden">Back</span>
                        </Button>
                        <div className="md:block hidden">
                            <h1 className="text-xl font-bold flex items-center gap-2 text-foreground">
                                Rapid Stock Entry
                            </h1>
                        </div>
                    </div>

                    {/* Desktop Actions */}
                    <div className="flex items-center gap-3">
                        <Link href={`/shop/${shopId}/inventory/bulk`}>
                            <Button variant="outline" size="sm" className="gap-2 border-primary/20 text-primary hover:bg-primary/5 h-9 md:h-10 px-3 md:px-4">
                                <LayoutGrid className="w-4 h-4" />
                                <span className="hidden md:inline">Bulk Grid</span>
                            </Button>
                        </Link>
                        <div className="hidden md:block h-6 w-px bg-border/50 mx-1" />
                        <Button
                            type="button"
                            size="default"
                            className="hidden md:flex h-10 px-6 font-bold shadow-sm active:scale-95 transition-all"
                            disabled={isPending}
                            onClick={form.handleSubmit(onSubmit)}
                        >
                            {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                            Save Item
                        </Button>
                    </div>
                </div>

                {/* Form Area - Scrollable */}
                <div className="flex-1 overflow-y-auto p-4 md:p-8 pb-32 md:pb-8 scroll-smooth will-change-transform">
                    <div className="max-w-4xl mx-auto">
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 md:space-y-8" onKeyDown={handleKeyDown}>

                                {/* 1. Core Identification */}
                                <section className="space-y-4">
                                    <h3 className="text-xs md:text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2 md:mb-3">Item Details</h3>
                                    <div className="grid grid-cols-2 md:grid-cols-12 gap-3 md:gap-4">
                                        {/* Metal */}
                                        <div className="col-span-1 md:col-span-3">
                                            <FormField
                                                control={form.control}
                                                name="metal_type"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-xs md:text-sm">Metal</FormLabel>
                                                        <Select
                                                            value={field.value}
                                                            onValueChange={(v) => {
                                                                field.onChange(v);
                                                                setSelectedMetal(v as MetalType);
                                                                form.setValue('purity', PURITY_OPTIONS[v as MetalType][0]);
                                                            }}
                                                        >
                                                            <FormControl>
                                                                <SelectTrigger className="h-10 md:h-11 bg-card">
                                                                    <SelectValue />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                {METAL_TYPES.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                                                            </SelectContent>
                                                        </Select>
                                                    </FormItem>
                                                )}
                                            />
                                        </div>

                                        {/* Purity */}
                                        <div className="col-span-1 md:col-span-3">
                                            <FormField
                                                control={form.control}
                                                name="purity"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-xs md:text-sm">Purity</FormLabel>
                                                        <Select value={field.value} onValueChange={field.onChange}>
                                                            <FormControl>
                                                                <SelectTrigger className="h-10 md:h-11 bg-card">
                                                                    <SelectValue />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                {PURITY_OPTIONS[selectedMetal].map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                                                            </SelectContent>
                                                        </Select>
                                                    </FormItem>
                                                )}
                                            />
                                        </div>

                                        {/* Category */}
                                        <div className="col-span-1 md:col-span-3">
                                            <FormField
                                                control={form.control}
                                                name="category"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-xs md:text-sm">Category</FormLabel>
                                                        <Select
                                                            value={field.value || ''}
                                                            onValueChange={(v) => {
                                                                field.onChange(v);
                                                                form.setValue('sub_category', '');
                                                            }}
                                                        >
                                                            <FormControl>
                                                                <SelectTrigger className="h-10 md:h-11 bg-card">
                                                                    <SelectValue placeholder="Select..." />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                {Object.keys(INVENTORY_CATEGORIES[selectedMetal] || {}).map((cat) => (
                                                                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </FormItem>
                                                )}
                                            />
                                        </div>

                                        {/* Sub-Category */}
                                        <div className="col-span-1 md:col-span-3">
                                            <FormField
                                                control={form.control}
                                                name="sub_category"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-xs md:text-sm">Sub-Category</FormLabel>
                                                        <Select
                                                            value={field.value || ''}
                                                            onValueChange={field.onChange}
                                                            disabled={!category || !INVENTORY_CATEGORIES[selectedMetal]?.[category]}
                                                        >
                                                            <FormControl>
                                                                <SelectTrigger className="h-10 md:h-11 bg-card">
                                                                    <SelectValue placeholder="Select Type..." />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                {category && INVENTORY_CATEGORIES[selectedMetal]?.[category]?.map((sub) => (
                                                                    <SelectItem key={sub} value={sub}>{sub}</SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                    </div>
                                </section>

                                {/* 2. Weight & Measurement */}
                                <section className="p-4 md:p-6 rounded-xl bg-card border border-border/60 shadow-sm space-y-4">
                                    <div className="flex items-center gap-2 border-b border-border/50 pb-3 mb-4">
                                        <Scale className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                                        <h3 className="font-semibold text-base md:text-lg">Weight Analysis</h3>
                                    </div>

                                    <div className="grid grid-cols-12 gap-4 md:gap-6">
                                        <div className="col-span-12 md:col-span-4">
                                            <FormField
                                                control={form.control}
                                                name="gross_weight"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-primary font-bold uppercase text-[10px] md:text-xs tracking-wider">Gross Weight (g)</FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                {...field}
                                                                type="number"
                                                                step="0.001"
                                                                className="h-14 md:h-16 text-2xl md:text-3xl font-bold border-primary/30 focus-visible:ring-primary shadow-sm tabular-nums"
                                                                onFocus={(e) => e.target.select()}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>

                                        <div className="col-span-6 md:col-span-4">
                                            <FormField
                                                control={form.control}
                                                name="stone_weight"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-muted-foreground uppercase text-[10px] md:text-xs tracking-wider">Stone Wt (g)</FormLabel>
                                                        <FormControl>
                                                            <Input {...field} type="number" step="0.001" className="h-14 md:h-16 text-lg md:text-xl tabular-nums bg-muted/20" onFocus={(e) => e.target.select()} />
                                                        </FormControl>
                                                    </FormItem>
                                                )}
                                            />
                                        </div>

                                        <div className="col-span-6 md:col-span-4">
                                            <FormField
                                                control={form.control}
                                                name="net_weight"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-muted-foreground uppercase text-[10px] md:text-xs tracking-wider">Net Weight</FormLabel>
                                                        <div className="h-14 md:h-16 px-4 flex items-center bg-muted/50 rounded-md border text-xl md:text-2xl font-mono font-bold text-foreground">
                                                            {field.value} <span className="text-xs md:text-sm ml-1 text-muted-foreground font-normal">g</span>
                                                        </div>
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                    </div>
                                </section>

                                {/* 3. Product Info */}
                                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6">
                                    <div className="col-span-1 md:col-span-8">
                                        <FormField
                                            control={form.control}
                                            name="name"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-xs md:text-sm">Item Name</FormLabel>
                                                    <FormControl>
                                                        <Input {...field} className="h-11 md:h-12 text-base md:text-lg font-medium" placeholder="e.g. Gold Ring 5.2g" />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    <div className="col-span-1 md:col-span-4">
                                        <FormField
                                            control={form.control}
                                            name="huid"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-xs md:text-sm">HUID / Tag ID</FormLabel>
                                                    <FormControl>
                                                        <FormControl>
                                                            <Input {...field} className="h-11 md:h-12 font-mono" placeholder="e.g. TH-98765" />
                                                        </FormControl>
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </div>

                                {/* 4. Pricing */}
                                <div className="p-4 bg-muted/20 rounded-lg border border-border/40">
                                    <h4 className="text-[10px] md:text-xs font-semibold uppercase text-muted-foreground mb-3 flex items-center gap-2">
                                        Pricing & Charges
                                    </h4>
                                    <div className="grid grid-cols-2 gap-3 md:gap-4">
                                        <FormField
                                            control={form.control}
                                            name="making_charge_type"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <Select value={field.value} onValueChange={field.onChange}>
                                                        <FormControl>
                                                            <SelectTrigger className="h-10 bg-background"><SelectValue /></SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            <SelectItem value="PER_GRAM">Per Gram (₹)</SelectItem>
                                                            <SelectItem value="FIXED">Fixed Amount (₹)</SelectItem>
                                                            <SelectItem value="PERCENT">Percentage (%)</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="making_charge_value"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormControl>
                                                        <Input {...field} type="number" className="h-10 bg-background" placeholder="Value" onFocus={(e) => e.target.select()} />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </div>

                                {/* Spacer for bottom button */}
                                <div className="h-12 md:hidden"></div>

                            </form>
                        </Form>
                    </div>
                </div>

                {/* Sticky Bottom Save Button */}
                {/* Sticky Bottom Save Button Group */}
                <div className="shrink-0 p-4 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 pb-safe z-40 md:static md:bg-transparent md:border-0 md:p-6 md:pt-0 flex md:justify-end">
                    <div className="w-full md:w-auto flex flex-col md:flex-row md:items-center gap-3">
                        <p className="hidden md:block text-xs text-muted-foreground mr-2">
                            All fields auto-saved.
                        </p>
                        <Button
                            type="submit"
                            size="lg"
                            className="w-full md:w-[200px] h-12 md:h-11 text-base font-bold gap-2 shadow-xl shadow-primary/20 md:shadow-primary/10 transition-all active:scale-[0.98]"
                            disabled={isPending}
                            onClick={form.handleSubmit(onSubmit)}
                        >
                            {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                            {isPending ? 'Saving...' : 'Save Item'}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Resize Handle */}
            <div
                className="hidden md:flex flex-col justify-center items-center w-4 hover:w-4 cursor-col-resize hover:bg-primary/10 active:bg-primary/20 transition-colors z-50 border-r border-l border-border/30 -ml-[2px] -mr-[2px]"
                onMouseDown={startResizing}
            >
                <div className="h-8 w-1 rounded-full bg-border/50 group-hover:bg-primary/50" />
            </div>

            {/* RIGHT: Session & History (Resizable) */}
            <div
                ref={sidebarRef}
                className="hidden md:flex flex-col bg-card h-full"
                style={{ width: sidebarWidth }}
            >
                <div className="p-4 border-b border-border/50 bg-muted/10">
                    <h2 className="font-semibold flex items-center gap-2 text-foreground">
                        <History className="w-4 h-4 text-primary" />
                        Session History
                    </h2>
                    <p className="text-xs text-muted-foreground mt-1">
                        Recent items added in this session
                    </p>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {recentItems.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-40 text-center text-muted-foreground p-4 border-2 border-dashed border-border/50 rounded-xl bg-muted/5">
                            <Zap className="w-8 h-8 mb-2 opacity-20" />
                            <p className="text-sm">No items added yet</p>
                            <p className="text-xs opacity-70">Fill the form to start</p>
                        </div>
                    ) : (
                        recentItems.map((item, i) => (
                            <div key={item.id} className="group flex items-start gap-3 p-3 rounded-lg border border-border/50 bg-background hover:border-primary/30 hover:shadow-sm transition-all animate-in fade-in slide-in-from-right-4 duration-300">
                                <div className="mt-1">
                                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-0.5">
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                                                {item.tag}
                                            </span>
                                            {/* Print Action Placeholder */}
                                            <Button variant="ghost" size="icon" className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity" title="Print Tag">
                                                <QrCode className="w-3 h-3" />
                                            </Button>
                                        </div>
                                        <span className="text-xs font-bold text-foreground">
                                            {item.weight.toFixed(3)}g
                                        </span>
                                    </div>
                                    <p className="text-sm font-medium truncate text-foreground/90">{item.name}</p>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Stats / Summary Footer */}
                <div className="p-4 bg-muted/20 border-t border-border/50">
                    <div className="grid grid-cols-2 gap-4 text-center">
                        <div className="bg-background rounded-lg p-3 border border-border/50 shadow-sm">
                            <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Count</p>
                            <p className="text-2xl font-bold text-primary">{recentItems.length}</p>
                        </div>
                        <div className="bg-background rounded-lg p-3 border border-border/50 shadow-sm">
                            <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Total Wt</p>
                            <p className="text-2xl font-bold text-foreground">
                                {recentItems.reduce((acc, curr) => acc + curr.weight, 0).toFixed(2)}
                                <span className="text-xs ml-1 text-muted-foreground font-normal">g</span>
                            </p>
                        </div>
                    </div>
                </div>

                {/* Keyboard Shortcuts Cheat Sheet */}
                <div className="p-4 text-[10px] text-muted-foreground bg-background/50 border-t border-border/50">
                    <div className="flex items-center justify-between opacity-70 hover:opacity-100 transition-opacity">
                        <span>Save: <strong>⌘+Ent</strong></span>
                        <span>Next Field: <strong>Tab</strong></span>
                        <span>Back: <strong>Shift+Tab</strong></span>
                    </div>
                </div>
            </div>
        </div>
    );
}
