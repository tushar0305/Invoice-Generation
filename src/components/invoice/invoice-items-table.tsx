'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { FileText, Plus, Trash2, Calculator } from 'lucide-react';
import { UseFormReturn, useFieldArray } from 'react-hook-form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getInventoryItems } from '@/services/inventory';
import { useEffect, useState, useRef } from 'react';
import { InventoryItem, STATUS_LABELS, INVENTORY_CATEGORIES } from '@/lib/inventory-types';
import { Badge } from '@/components/ui/badge';
import { NumericKeypadDrawer } from '@/components/ui/numeric-keypad-drawer';

interface InvoiceItemsTableProps {
    form: UseFormReturn<any>;
    shopId?: string;
}

export function InvoiceItemsTable({ form, shopId }: InvoiceItemsTableProps) {
    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: 'items',
    });

    const appendGuard = useRef(false);
    const [isAdding, setIsAdding] = useState(false);

    const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);

    // Fetch inventory items using service
    useEffect(() => {
        if (!shopId) return;

        const fetchInventory = async () => {
            const items = await getInventoryItems(shopId);
            setInventoryItems(items);
        };

        fetchInventory();
    }, [shopId]);

    const handleInventorySelect = (index: number, itemId: string) => {
        const selected = inventoryItems.find(s => s.id === itemId);
        if (selected) {
            form.setValue(`items.${index}.description`, selected.name || '');
            form.setValue(`items.${index}.metalType`, selected.metal_type);
            form.setValue(`items.${index}.purity`, selected.purity || '22K');
            form.setValue(`items.${index}.hsnCode`, selected.hsn_code || '');
            form.setValue(`items.${index}.category`, selected.category || '');

            form.setValue(`items.${index}.grossWeight`, selected.gross_weight || 0);
            form.setValue(`items.${index}.stoneWeight`, selected.stone_weight || 0);
            form.setValue(`items.${index}.netWeight`, selected.net_weight || 0);
            form.setValue(`items.${index}.wastagePercent`, selected.wastage_percent || 0);

            // Map making_charge_value to makingRate
            if (selected.making_charge_value) {
                form.setValue(`items.${index}.makingRate`, selected.making_charge_value);
            }

            form.setValue(`items.${index}.stockId`, selected.id);
            form.setValue(`items.${index}.tagId`, selected.tag_id);
        }
    };

    // Auto-calculate Net Weight based on Gross - Stone
    // Note: We can't easily auto-calc inside render loop without creating infinite loops or using effects per row.
    // For now, we trust the inputs but in a real app we'd use useWatch or useEffect on fields.
    const handleGrossChange = (index: number, val: string) => {
        const gross = parseFloat(val) || 0;
        const currentStone = form.getValues(`items.${index}.stoneWeight`) || 0;
        form.setValue(`items.${index}.grossWeight`, gross);
        form.setValue(`items.${index}.netWeight`, Number((gross - currentStone).toFixed(3)));
    };

    const handleStoneChange = (index: number, val: string) => {
        const stone = parseFloat(val) || 0;
        const currentGross = form.getValues(`items.${index}.grossWeight`) || 0;
        form.setValue(`items.${index}.stoneWeight`, stone);
        form.setValue(`items.${index}.netWeight`, Number((currentGross - stone).toFixed(3)));
    };


    // UX-NEW: Mobile Numeric Keypad Logic
    const [isKeypadOpen, setIsKeypadOpen] = useState(false);
    const [keypadConfig, setKeypadConfig] = useState({ field: '', label: '', value: 0 });

    const openKeypad = (field: string, label: string, value: any) => {
        setKeypadConfig({ field, label, value: Number(value) || 0 });
        setIsKeypadOpen(true);
    };

    const handleKeypadChange = (val: string) => {
        const numVal = parseFloat(val);
        const fieldPath = keypadConfig.field; // e.g., items.0.grossWeight

        // Update Form
        form.setValue(fieldPath, numVal);

        // Handle Side Effects (Net Weight Calc)
        if (fieldPath.includes('grossWeight')) {
            const index = parseInt(fieldPath.split('.')[1]);
            handleGrossChange(index, val);
        } else if (fieldPath.includes('stoneWeight')) {
            const index = parseInt(fieldPath.split('.')[1]);
            handleStoneChange(index, val);
        }
    };

    return (
        <Card className="border-0 shadow-none md:border-2 md:shadow-sm bg-transparent md:bg-card">
            <CardHeader className="px-0 pt-0 md:px-6 md:pt-6 pb-3 flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                    <FileText className="h-5 w-5 text-primary" /> Items
                </CardTitle>
                <Button
                    type="button"
                    size="sm"
                    disabled={isAdding}
                    onClick={() => {
                        if (appendGuard.current) return;
                        appendGuard.current = true;
                        setIsAdding(true);
                        const currentRate = form.getValues('currentRate') || 0;
                        append({
                            id: crypto.randomUUID(),
                            description: '',
                            purity: '22K',
                            grossWeight: 0,
                            netWeight: 0,
                            stoneWeight: 0,
                            stoneAmount: 0,
                            wastagePercent: 0,
                            rate: currentRate,
                            makingRate: 0,
                            making: 0,
                            hsnCode: '',
                            metalType: '',
                            category: '',
                            stockId: '',
                            tagId: ''
                        });
                        setTimeout(() => { appendGuard.current = false; setIsAdding(false); }, 300);
                    }}
                >
                    <Plus className="h-4 w-4 mr-1" /> Add Item
                </Button>
            </CardHeader>
            <CardContent className="px-0 md:px-6 space-y-4">
                {fields.length === 0 && (
                    <div className="text-center py-8 border-2 border-dashed rounded-lg text-muted-foreground">
                        No items added. Click "Add Item" to start.
                    </div>
                )}
                {fields.map((field, index) => (
                    <div key={field.id} className="p-3 border rounded-xl bg-card shadow-sm space-y-3">
                        {/* Header: Item Number & Delete */}
                        <div className="flex items-center justify-between border-b pb-2">
                            <div className="flex items-center gap-2">
                                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                                    {index + 1}
                                </span>
                                <span className="text-sm font-medium text-muted-foreground">Item Details</span>
                            </div>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                onClick={() => remove(index)}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>

                        {/* Inventory Selection */}
                        <div>
                            <Select onValueChange={(val) => handleInventorySelect(index, val)}>
                                <SelectTrigger className="h-9 text-sm bg-muted/30 border-dashed">
                                    <SelectValue placeholder="Select from Inventory (Optional)" />
                                </SelectTrigger>
                                <SelectContent>
                                    {inventoryItems.map((item) => {
                                        const isAvailable = item.status === 'IN_STOCK';
                                        const statusConfig = STATUS_LABELS[item.status] || { label: item.status, color: 'gray' };

                                        return (
                                            <SelectItem
                                                key={item.id}
                                                value={item.id}
                                                disabled={!isAvailable}
                                                className="flex items-center justify-between w-full"
                                            >
                                                <div className="flex items-center justify-between w-full gap-2">
                                                    <span>{item.name} - {item.tag_id} ({item.purity})</span>
                                                    {!isAvailable && (
                                                        <Badge variant="outline" className={`ml-2 text-xs px-1 py-0 border-${statusConfig.color}-500 text-${statusConfig.color}-600 bg-${statusConfig.color}-50`}>
                                                            {statusConfig.label}
                                                        </Badge>
                                                    )}
                                                </div>
                                            </SelectItem>
                                        );
                                    })}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Main Details Grid */}
                        <div className="grid grid-cols-12 gap-3">
                            {/* Description - Full Width */}
                            <div className="col-span-12">
                                <FormField
                                    control={form.control}
                                    name={`items.${index}.description`}
                                    render={({ field }) => (
                                        <FormItem className="space-y-1">
                                            <FormLabel className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Description</FormLabel>
                                            <FormControl>
                                                <Input {...field} placeholder="e.g. Gold Ring" className="h-9 font-medium" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {/* Category & Purity - Half Width */}
                            <div className="col-span-6">
                                <FormField
                                    control={form.control}
                                    name={`items.${index}.category`}
                                    render={({ field }) => (
                                        <FormItem className="space-y-1">
                                            <FormLabel className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Category</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value || ''}>
                                                <FormControl>
                                                    <SelectTrigger className="h-9">
                                                        <SelectValue placeholder="Select" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {Array.from(new Set(
                                                        Object.values(INVENTORY_CATEGORIES).flatMap(c => Object.keys(c))
                                                    )).map((cat) => (
                                                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <div className="col-span-6">
                                <FormField
                                    control={form.control}
                                    name={`items.${index}.purity`}
                                    render={({ field }) => (
                                        <FormItem className="space-y-1">
                                            <FormLabel className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Purity</FormLabel>
                                            <FormControl>
                                                <Input {...field} placeholder="22K" className="h-9" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        {/* Weights Section - Card Style */}
                        <div className="bg-muted/30 rounded-lg p-3 space-y-3 border border-border/50">
                            <div className="flex items-center gap-2 mb-1">
                                <div className="h-4 w-1 bg-primary rounded-full"></div>
                                <span className="text-xs font-bold text-foreground">Weight Details</span>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <FormField
                                    control={form.control}
                                    name={`items.${index}.grossWeight`}
                                    render={({ field }) => (
                                        <FormItem className="space-y-1">
                                            <FormLabel className="text-[10px] uppercase tracking-wider text-muted-foreground">Gross Wt (g)</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <Input
                                                        type="number"
                                                        inputMode="decimal"
                                                        {...field}
                                                        value={field.value === 0 ? '' : field.value}
                                                        onChange={(e) => handleGrossChange(index, e.target.value)}
                                                        className="h-9 bg-background"
                                                    />
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        tabIndex={-1}
                                                        className="absolute right-1 top-1 h-7 w-7 text-muted-foreground hover:text-primary lg:hidden"
                                                        onClick={() => openKeypad(`items.${index}.grossWeight`, 'Gross Weight', field.value)}
                                                    >
                                                        <Calculator className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name={`items.${index}.stoneWeight`}
                                    render={({ field }) => (
                                        <FormItem className="space-y-1">
                                            <FormLabel className="text-[10px] uppercase tracking-wider text-muted-foreground">Stone Wt (g)</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <Input
                                                        type="number"
                                                        inputMode="decimal"
                                                        {...field}
                                                        value={field.value === 0 ? '' : field.value}
                                                        onChange={(e) => handleStoneChange(index, e.target.value)}
                                                        className="h-9 bg-background"
                                                    />
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        tabIndex={-1}
                                                        className="absolute right-1 top-1 h-7 w-7 text-muted-foreground hover:text-primary lg:hidden"
                                                        onClick={() => openKeypad(`items.${index}.stoneWeight`, 'Stone Weight', field.value)}
                                                    >
                                                        <Calculator className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name={`items.${index}.netWeight`}
                                render={({ field }) => (
                                    <FormItem className="space-y-1">
                                        <FormLabel className="text-[10px] uppercase tracking-wider text-primary font-bold">Net Weight (g)</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                inputMode="decimal"
                                                value={field.value ?? ''}
                                                onChange={(e) => field.onChange(e.target.value === '' ? '' : Number(e.target.value))}
                                                className="h-10 text-lg font-bold border-primary/30 bg-primary/5 text-primary"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Pricing Section - Card Style */}
                        <div className="bg-muted/30 rounded-lg p-3 space-y-3 border border-border/50">
                            <div className="flex items-center gap-2 mb-1">
                                <div className="h-4 w-1 bg-emerald-500 rounded-full"></div>
                                <span className="text-xs font-bold text-foreground">Pricing</span>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <FormField
                                    control={form.control}
                                    name={`items.${index}.rate`}
                                    render={({ field }) => (
                                        <FormItem className="space-y-1">
                                            <FormLabel className="text-[10px] uppercase tracking-wider text-muted-foreground">Rate (₹/g)</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <Input
                                                        type="number"
                                                        inputMode="numeric"
                                                        {...field}
                                                        value={field.value === 0 ? '' : field.value}
                                                        onChange={(e) => field.onChange(e.target.value === '' ? '' : Number(e.target.value))}
                                                        className="h-9 bg-background"
                                                    />
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        tabIndex={-1}
                                                        className="absolute right-1 top-1 h-7 w-7 text-muted-foreground hover:text-primary lg:hidden"
                                                        onClick={() => openKeypad(`items.${index}.rate`, 'Rate (₹/g)', field.value)}
                                                    >
                                                        <Calculator className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name={`items.${index}.makingRate`}
                                    render={({ field }) => (
                                        <FormItem className="space-y-1">
                                            <FormLabel className="text-[10px] uppercase tracking-wider text-muted-foreground">Making (₹/g)</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <Input
                                                        type="number"
                                                        inputMode="numeric"
                                                        {...field}
                                                        value={field.value === 0 ? '' : field.value}
                                                        onChange={(e) => field.onChange(e.target.value === '' ? '' : Number(e.target.value))}
                                                        className="h-9 bg-background"
                                                    />
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        tabIndex={-1}
                                                        className="absolute right-1 top-1 h-7 w-7 text-muted-foreground hover:text-primary lg:hidden"
                                                        onClick={() => openKeypad(`items.${index}.makingRate`, 'Making (₹/g)', field.value)}
                                                    >
                                                        <Calculator className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name={`items.${index}.stoneAmount`}
                                render={({ field }) => (
                                    <FormItem className="space-y-1">
                                        <FormLabel className="text-[10px] uppercase tracking-wider text-muted-foreground">Stone Value (₹)</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Input
                                                    type="number"
                                                    inputMode="decimal"
                                                    {...field}
                                                    value={field.value ?? ''}
                                                    onChange={(e) => field.onChange(e.target.value === '' ? '' : Number(e.target.value))}
                                                    className="h-9 bg-background"
                                                />
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    tabIndex={-1}
                                                    className="absolute right-1 top-1 h-7 w-7 text-muted-foreground hover:text-primary lg:hidden"
                                                    onClick={() => openKeypad(`items.${index}.stoneAmount`, 'Stone Value', field.value)}
                                                >
                                                    <Calculator className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </div>
                ))}
            </CardContent>

            <NumericKeypadDrawer
                isOpen={isKeypadOpen}
                onOpenChange={setIsKeypadOpen}
                title={keypadConfig.label}
                value={keypadConfig.value}
                onValueChange={handleKeypadChange}
            />
        </Card>
    );
}
