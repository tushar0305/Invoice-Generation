'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { FileText, Plus, Trash2 } from 'lucide-react';
import { UseFormReturn, useFieldArray } from 'react-hook-form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getInventoryItems } from '@/services/inventory';
import { useEffect, useState, useRef } from 'react';
import { InventoryItem, STATUS_LABELS } from '@/lib/inventory-types';
import { Badge } from '@/components/ui/badge';

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

    return (
        <Card className="border-2 shadow-sm">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
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
                        append({
                            id: crypto.randomUUID(),
                            description: '',
                            purity: '22K',
                            grossWeight: 0,
                            netWeight: 0,
                            stoneWeight: 0,
                            stoneAmount: 0,
                            wastagePercent: 0,
                            rate: 0,
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
            <CardContent className="space-y-4">
                {fields.length === 0 && (
                    <div className="text-center py-8 border-2 border-dashed rounded-lg text-muted-foreground">
                        No items added. Click "Add Item" to start.
                    </div>
                )}
                {fields.map((field, index) => (
                    <div key={field.id} className="p-4 border rounded-lg bg-card">
                        <div className="flex justify-end mb-2">
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="text-destructive"
                                onClick={() => remove(index)}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>

                        <div className="mb-4">
                            <FormLabel className="text-xs uppercase text-muted-foreground mb-1.5 block">Select from Inventory (Optional)</FormLabel>
                            <Select onValueChange={(val) => handleInventorySelect(index, val)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Choose an inventory item..." />
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

                        {/* Row 1: Description, Purity, HSN */}
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-4">
                            <div className="md:col-span-6">
                                <FormField
                                    control={form.control}
                                    name={`items.${index}.description`}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs uppercase text-muted-foreground">Description</FormLabel>
                                            <FormControl><Input {...field} placeholder="Item Name" /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <div className="md:col-span-3">
                                <FormField
                                    control={form.control}
                                    name={`items.${index}.hsnCode`}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs uppercase text-muted-foreground">HSN Code</FormLabel>
                                            <FormControl><Input {...field} value={field.value || ''} placeholder="HSN" /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <div className="md:col-span-3">
                                <FormField
                                    control={form.control}
                                    name={`items.${index}.purity`}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs uppercase text-muted-foreground">Purity</FormLabel>
                                            <FormControl><Input {...field} placeholder="22K" /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        {/* Row 2: Weights & Calculations */}
                        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
                            {/* Gross Weight */}
                            <FormField
                                control={form.control}
                                name={`items.${index}.grossWeight`}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs uppercase text-muted-foreground">Gross (g)</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                {...field}
                                                value={field.value ?? ''}
                                                onChange={(e) => handleGrossChange(index, e.target.value)}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Stone Weight */}
                            <FormField
                                control={form.control}
                                name={`items.${index}.stoneWeight`}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs uppercase text-muted-foreground">Stone (g)</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                {...field}
                                                value={field.value ?? ''}
                                                onChange={(e) => handleStoneChange(index, e.target.value)}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Net Weight (Editable) */}
                            <FormField
                                control={form.control}
                                name={`items.${index}.netWeight`}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs uppercase text-muted-foreground font-bold text-primary">Net (g)</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                value={field.value ?? ''}
                                                onChange={(e) => field.onChange(e.target.value === '' ? '' : Number(e.target.value))}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Rate */}
                            <FormField
                                control={form.control}
                                name={`items.${index}.rate`}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs uppercase text-muted-foreground">Rate (₹/g)</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                {...field}
                                                value={field.value ?? ''}
                                                onChange={(e) => field.onChange(e.target.value === '' ? '' : Number(e.target.value))}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Making Rate */}
                            <FormField
                                control={form.control}
                                name={`items.${index}.makingRate`}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs uppercase text-muted-foreground">Making (₹/g)</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                {...field}
                                                value={field.value ?? ''}
                                                onChange={(e) => field.onChange(e.target.value === '' ? '' : Number(e.target.value))}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Stone Amount */}
                            <FormField
                                control={form.control}
                                name={`items.${index}.stoneAmount`}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs uppercase text-muted-foreground">Stone Val (₹)</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                {...field}
                                                value={field.value ?? ''}
                                                onChange={(e) => field.onChange(e.target.value === '' ? '' : Number(e.target.value))}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}
