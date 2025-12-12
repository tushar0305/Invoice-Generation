'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { FileText, Plus, Trash2 } from 'lucide-react';
import { UseFormReturn, useFieldArray } from 'react-hook-form';
import { useStockItems } from '@/hooks/use-stock-items';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface InvoiceItemsTableProps {
    form: UseFormReturn<any>;
    shopId?: string;
}

export function InvoiceItemsTable({ form, shopId }: InvoiceItemsTableProps) {
    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: 'items',
    });
    
    const { items: stockItems } = useStockItems(shopId);

    const handleStockSelect = (index: number, stockId: string) => {
        const selected = stockItems?.find(s => s.id === stockId) as any;
        if (selected) {
            form.setValue(`items.${index}.description`, selected.name);
            form.setValue(`items.${index}.purity`, selected.purity || '22K');
            // If unit is grams, quantity is the weight available. 
            // We don't auto-fill weight as user might sell partial.
            // form.setValue(`items.${index}.grossWeight`, selected.quantity || 0);
            
            if (selected.making_charge_per_gram) {
                 form.setValue(`items.${index}.making`, selected.making_charge_per_gram);
            }
            
            form.setValue(`items.${index}.stockId`, selected.id);
        }
    };

    return (
        <Card className="border-2 shadow-sm">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                    <FileText className="h-5 w-5 text-primary" /> Items
                </CardTitle>
                <Button type="button" size="sm" onClick={() => append({
                    id: crypto.randomUUID(), description: '', purity: '22K', grossWeight: 0, netWeight: 0, rate: 0, making: 0
                })}>
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
                    <div key={field.id} className="p-4 border rounded-lg bg-card relative group">
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-2 top-2 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => remove(index)}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>

                        <div className="mb-4">
                             <FormLabel className="text-xs uppercase text-muted-foreground mb-1.5 block">Select from Stock (Optional)</FormLabel>
                             <Select onValueChange={(val) => handleStockSelect(index, val)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Choose a stock item..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {stockItems?.map((item: any) => (
                                        <SelectItem key={item.id} value={item.id}>
                                            {item.name} - {item.quantity} {item.unit} ({item.purity})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                             </Select>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
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
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {['grossWeight', 'netWeight', 'rate', 'making'].map((col) => (
                                <FormField
                                    key={col}
                                    control={form.control}
                                    name={`items.${index}.${col}` as any}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs uppercase text-muted-foreground capitalize">{col.replace(/([A-Z])/g, ' $1')}</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    {...field}
                                                    onChange={e => field.onChange(e.target.value)} // Handle number input as string initially to avoid NaN issues
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            ))}
                        </div>
                    </div>
                ))}
                {form.formState.errors.items && (
                    <p className="text-sm font-medium text-destructive">{(form.formState.errors.items as any).message}</p>
                )}
            </CardContent>
        </Card>
    );
}
