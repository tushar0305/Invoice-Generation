'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trash2, Plus, Search } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';

interface InvoiceItem {
    id: string;
    description: string;
    purity: string;
    grossWeight: number;
    netWeight: number;
    rate: number;
    making: number;
}

interface LineItemsTableProps {
    items: InvoiceItem[];
    onItemsChange: (items: InvoiceItem[]) => void;
    disabled?: boolean;
}

// Separate component for each draggable line item
function DraggableLineItem({
    item,
    index,
    handleUpdateItem,
    handleRemoveItem,
    calculateItemTotal,
    disabled,
}: {
    item: InvoiceItem;
    index: number;
    handleUpdateItem: (id: string, field: keyof InvoiceItem, value: any) => void;
    handleRemoveItem: (id: string) => void;
    calculateItemTotal: (item: InvoiceItem) => number;
    disabled?: boolean;
}) {
    const [dragX, setDragX] = useState(0);

    return (
        <motion.div
            key={item.id}
            drag="x"
            dragConstraints={{ left: -100, right: 0 }}
            dragElastic={0.1}
            onDrag={(_: any, info: any) => setDragX(info.offset.x)}
            onDragEnd={(_: any, info: any) => {
                if (info.offset.x < -80) {
                    handleRemoveItem(item.id);
                }
            }}
            className="relative"
        >
            {/* Delete action revealed on swipe */}
            <motion.div
                className="absolute right-0 top-0 h-full flex items-center justify-end pr-4 bg-destructive rounded-r-lg"
                style={{
                    width: Math.abs(dragX),
                    opacity: Math.min(Math.abs(dragX) / 80, 1),
                }}
            >
                <Trash2 className="h-5 w-5 text-white" />
            </motion.div>

            <Card className="relative group">
                <CardContent className="p-4 grid gap-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label className="text-xs uppercase text-muted-foreground font-semibold tracking-wider">Description</Label>
                            <Input
                                value={item.description}
                                onChange={(e) => handleUpdateItem(item.id, 'description', e.target.value)}
                                placeholder="Item description"
                                disabled={disabled}
                                className="mt-1.5 h-12 bg-background/50"
                            />
                        </div>
                        <div>
                            <Label className="text-xs uppercase text-muted-foreground font-semibold tracking-wider">Purity</Label>
                            <Input
                                value={item.purity}
                                onChange={(e) => handleUpdateItem(item.id, 'purity', e.target.value)}
                                placeholder="e.g. 22K"
                                disabled={disabled}
                                className="mt-1.5 h-12 bg-background/50"
                            />
                        </div>
                    </div>

                    {/* Mobile: 2x2 Grid, Desktop: 4-col */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                        <div>
                            <Label className="text-xs uppercase text-muted-foreground font-semibold tracking-wider">Gross Wt</Label>
                            <Input
                                type="number"
                                value={item.grossWeight || ''}
                                onChange={(e) => handleUpdateItem(item.id, 'grossWeight', parseFloat(e.target.value) || 0)}
                                placeholder="0.00"
                                disabled={disabled}
                                className="mt-1.5 h-12 text-lg font-medium bg-background/50"
                            />
                        </div>
                        <div>
                            <Label className="text-xs uppercase text-muted-foreground font-semibold tracking-wider">Net Wt</Label>
                            <Input
                                type="number"
                                value={item.netWeight || ''}
                                onChange={(e) => handleUpdateItem(item.id, 'netWeight', parseFloat(e.target.value) || 0)}
                                placeholder="0.00"
                                disabled={disabled}
                                className="mt-1.5 h-12 text-lg font-medium bg-background/50"
                            />
                        </div>
                        <div>
                            <Label className="text-xs uppercase text-muted-foreground font-semibold tracking-wider">Rate/g</Label>
                            <Input
                                type="number"
                                value={item.rate || ''}
                                onChange={(e) => handleUpdateItem(item.id, 'rate', parseFloat(e.target.value) || 0)}
                                placeholder="0.00"
                                disabled={disabled}
                                className="mt-1.5 h-12 text-lg font-medium bg-background/50"
                            />
                        </div>
                        <div>
                            <Label className="text-xs uppercase text-muted-foreground font-semibold tracking-wider">Making</Label>
                            <Input
                                type="number"
                                value={item.making || ''}
                                onChange={(e) => handleUpdateItem(item.id, 'making', parseFloat(e.target.value) || 0)}
                                placeholder="0.00"
                                disabled={disabled}
                                className="mt-1.5 h-12 text-lg font-medium bg-background/50"
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-border/50">
                        <div className="text-sm text-muted-foreground">
                            Item Total: <span className="font-medium text-foreground">{formatCurrency(calculateItemTotal(item))}</span>
                        </div>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveItem(item.id)}
                            disabled={disabled}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10 md:block hidden"
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}

export function LineItemsTable({ items, onItemsChange, disabled }: LineItemsTableProps) {
    const handleAddItem = () => {
        const newItem: InvoiceItem = {
            id: crypto.randomUUID(),
            description: '',
            purity: '',
            grossWeight: 0,
            netWeight: 0,
            rate: 0,
            making: 0,
        };
        onItemsChange([...items, newItem]);
    };

    const handleRemoveItem = (id: string) => {
        onItemsChange(items.filter((item) => item.id !== id));
    };

    const handleUpdateItem = (id: string, field: keyof InvoiceItem, value: any) => {
        onItemsChange(
            items.map((item) =>
                item.id === id ? { ...item, [field]: value } : item
            )
        );
    };

    const calculateItemTotal = (item: InvoiceItem) => {
        return (item.netWeight * item.rate) + item.making;
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Items</h3>
                <Button
                    type="button"
                    onClick={handleAddItem}
                    disabled={disabled}
                    size="sm"
                    className="gap-2"
                >
                    <Plus className="h-4 w-4" /> Add Item
                </Button>
            </div>

            <div className="space-y-4">
                {items.map((item, index) => (
                    <DraggableLineItem
                        key={item.id}
                        item={item}
                        index={index}
                        handleUpdateItem={handleUpdateItem}
                        handleRemoveItem={handleRemoveItem}
                        calculateItemTotal={calculateItemTotal}
                        disabled={disabled}
                    />
                ))}

                {items.length === 0 && (
                    <div className="text-center py-8 border-2 border-dashed rounded-lg text-muted-foreground">
                        No items added yet. Click "Add Item" to start.
                    </div>
                )}
            </div>
        </div>
    );
}
