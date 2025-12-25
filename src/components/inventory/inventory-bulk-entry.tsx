'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useActiveShop } from '@/hooks/use-active-shop';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Save, Loader2, ArrowLeft, Check, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn, formatCurrency } from '@/lib/utils';
import { METAL_TYPES, PURITY_OPTIONS, ITEM_CATEGORIES, STATUS_LABELS } from '@/lib/inventory-types';
import type { MetalType, ItemStatus } from '@/lib/inventory-types';

interface BulkItemRow {
    id: string;
    name: string;
    metal_type: MetalType;
    purity: string;
    hsn_code: string;
    category: string;
    gross_weight: number;
    net_weight: number;
    stone_weight: number;
    wastage_percent: number;
    making_charge_value: number;
    stone_value: number;
    status: 'pending' | 'saving' | 'saved' | 'error';
    error?: string;
}

const createEmptyRow = (): BulkItemRow => ({
    id: crypto.randomUUID(),
    name: '',
    metal_type: 'GOLD',
    purity: '22K',
    hsn_code: '',
    category: ITEM_CATEGORIES[0],
    gross_weight: 0,
    net_weight: 0,
    stone_weight: 0,
    wastage_percent: 0,
    making_charge_value: 0,
    stone_value: 0,
    status: 'pending',
});

interface InventoryBulkEntryProps {
    shopId: string;
    onClose: () => void;
}

export function InventoryBulkEntry({ shopId, onClose }: InventoryBulkEntryProps) {
    const router = useRouter();
    const { toast } = useToast();
    const { activeShop } = useActiveShop();
    const shopName = activeShop?.shopName || 'Shop';

    const [rows, setRows] = useState<BulkItemRow[]>([createEmptyRow(), createEmptyRow(), createEmptyRow()]);
    const [isSaving, setIsSaving] = useState(false);
    const [savedCount, setSavedCount] = useState(0);

    const inputRefs = useRef<Map<string, HTMLInputElement>>(new Map());

    const updateRow = useCallback((id: string, field: keyof BulkItemRow, value: any) => {
        setRows(prev => prev.map(row => {
            if (row.id !== id) return row;

            const updated = { ...row, [field]: value, status: 'pending' as const };

            // Auto-update purity when metal changes
            if (field === 'metal_type') {
                updated.purity = PURITY_OPTIONS[value as MetalType][0];
            }

            // Auto-calculate Net Weight
            if (field === 'gross_weight') {
                updated.net_weight = value - (updated.stone_weight || 0);
            }
            if (field === 'stone_weight') {
                updated.net_weight = (updated.gross_weight || 0) - value;
            }

            return updated;
        }));
    }, []);

    const addRow = useCallback(() => {
        const newRow = createEmptyRow();
        // Copy metal type from last row
        const lastRow = rows[rows.length - 1];
        if (lastRow) {
            newRow.metal_type = lastRow.metal_type;
            newRow.purity = lastRow.purity;
        }
        setRows(prev => [...prev, newRow]);

        // Focus the name input of new row after render
        setTimeout(() => {
            const nameInput = inputRefs.current.get(`${newRow.id}-name`);
            nameInput?.focus();
        }, 50);
    }, [rows]);

    const deleteRow = useCallback((id: string) => {
        setRows(prev => {
            const filtered = prev.filter(row => row.id !== id);
            return filtered.length === 0 ? [createEmptyRow()] : filtered;
        });
    }, []);

    const handleKeyDown = useCallback((e: React.KeyboardEvent, rowId: string, field: string) => {
        if (e.key === 'Tab' && !e.shiftKey) {
            // Tab to next field or next row
            const currentRow = rows.find(r => r.id === rowId);
            const rowIndex = rows.findIndex(r => r.id === rowId);
            const fields = ['name', 'metal_type', 'purity', 'hsn_code', 'category', 'gross_weight', 'net_weight', 'stone_weight', 'wastage_percent', 'making_charge_value', 'stone_value'];
            const fieldIndex = fields.indexOf(field);

            if (fieldIndex === fields.length - 1 && rowIndex === rows.length - 1) {
                // Last field of last row - add new row
                e.preventDefault();
                addRow();
            }
        }

        if (e.key === 'Enter') {
            e.preventDefault();
            // Move to next row same field
            const rowIndex = rows.findIndex(r => r.id === rowId);
            if (rowIndex < rows.length - 1) {
                const nextRowId = rows[rowIndex + 1].id;
                const nextInput = inputRefs.current.get(`${nextRowId}-${field}`);
                nextInput?.focus();
            } else {
                addRow();
            }
        }
    }, [rows, addRow]);

    const validateRow = (row: BulkItemRow): string | null => {
        if (!row.name.trim()) return 'Name is required';
        if (row.gross_weight <= 0) return 'Weight must be positive';
        if (row.net_weight <= 0) return 'Net weight must be positive';
        
        if (row.net_weight > row.gross_weight) return 'Net weight > Gross weight';
        
        const calculatedNet = row.gross_weight - row.stone_weight;
        if (Math.abs(calculatedNet - row.net_weight) > 0.01) return 'Net != Gross - Stone';
        
        const validPurities = PURITY_OPTIONS[row.metal_type] || [];
        if (!validPurities.includes(row.purity)) return `Invalid purity for ${row.metal_type}`;

        return null;
    };

    const saveAll = async () => {
        // Validate all rows first
        const validRows = rows.filter(row => row.name.trim() && row.status !== 'saved');

        if (validRows.length === 0) {
            toast({ title: 'No items to save', description: 'Add at least one item with a name.', variant: 'destructive' });
            return;
        }

        setIsSaving(true);
        setSavedCount(0);

        for (const row of validRows) {
            const error = validateRow(row);
            if (error) {
                setRows(prev => prev.map(r => r.id === row.id ? { ...r, status: 'error', error } : r));
                continue;
            }

            setRows(prev => prev.map(r => r.id === row.id ? { ...r, status: 'saving' } : r));

            try {
                const response = await fetch('/api/v1/inventory', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        shop_id: shopId,
                        name: row.name,
                        metal_type: row.metal_type,
                        purity: row.purity,
                        hsn_code: row.hsn_code,
                        category: row.category,
                        gross_weight: row.gross_weight,
                        net_weight: row.net_weight,
                        stone_weight: row.stone_weight,
                        wastage_percent: row.wastage_percent,
                        making_charge_type: 'PER_GRAM',
                        making_charge_value: row.making_charge_value,
                        stone_value: row.stone_value,
                    }),
                });

                if (!response.ok) {
                    throw new Error('Failed to save');
                }

                setRows(prev => prev.map(r => r.id === row.id ? { ...r, status: 'saved' } : r));
                setSavedCount(c => c + 1);
            } catch (err) {
                setRows(prev => prev.map(r => r.id === row.id ? { ...r, status: 'error', error: 'Save failed' } : r));
            }
        }

        setIsSaving(false);

        const finalSaved = rows.filter(r => r.status === 'saved').length;
        if (finalSaved > 0) {
            toast({ title: 'Items Saved', description: `Successfully saved ${finalSaved} items.` });
        }
    };

    const pendingCount = rows.filter(r => r.status === 'pending' && r.name.trim()).length;
    const savedRowCount = rows.filter(r => r.status === 'saved').length;

    return (
        <div className="h-full flex flex-col bg-background">
            {/* Header */}
            <div className="sticky top-0 z-30 bg-background border-b border-border px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full shrink-0">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <p className="text-[11px] text-muted-foreground">{shopName}</p>
                        <h1 className="text-lg font-bold text-foreground">Bulk Add Items</h1>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {pendingCount > 0 && (
                        <Badge variant="secondary" className="bg-amber-500/10 text-amber-600">
                            {pendingCount} pending
                        </Badge>
                    )}
                    {savedRowCount > 0 && (
                        <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600">
                            {savedRowCount} saved
                        </Badge>
                    )}
                    <Button
                        onClick={saveAll}
                        disabled={isSaving || pendingCount === 0}
                        className="gap-2"
                    >
                        {isSaving ? (
                            <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</>
                        ) : (
                            <><Save className="h-4 w-4" /> Save All</>
                        )}
                    </Button>
                </div>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-auto p-4">
                <Card className="overflow-hidden border border-border rounded-xl">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-muted/50 border-b border-border">
                                    <th className="text-left font-semibold py-3 px-3 w-[180px]">Item Name *</th>
                                    <th className="text-left font-semibold py-3 px-2 w-[90px]">Metal</th>
                                    <th className="text-left font-semibold py-3 px-2 w-[80px]">Purity</th>
                                    <th className="text-left font-semibold py-3 px-2 w-[90px]">HSN Code</th>
                                    <th className="text-left font-semibold py-3 px-2 w-[100px]">Category</th>
                                    <th className="text-left font-semibold py-3 px-2 w-[90px]">Gross (g)</th>
                                    <th className="text-left font-semibold py-3 px-2 w-[90px]">Net (g)</th>
                                    <th className="text-left font-semibold py-3 px-2 w-[90px]">Stone (g)</th>
                                    <th className="text-left font-semibold py-3 px-2 w-[90px]">Wastage %</th>
                                    <th className="text-left font-semibold py-3 px-2 w-[100px]">Making (₹/g)</th>
                                    <th className="text-left font-semibold py-3 px-2 w-[100px]">Stone Value (₹)</th>
                                    <th className="text-center font-semibold py-3 px-2 w-[80px]">Progress</th>
                                    <th className="w-[50px]"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((row, index) => (
                                    <tr
                                        key={row.id}
                                        className={cn(
                                            "border-b border-border/50 transition-colors",
                                            row.status === 'saved' && "bg-emerald-50/50 dark:bg-emerald-950/20",
                                            row.status === 'error' && "bg-red-50/50 dark:bg-red-950/20",
                                            row.status === 'saving' && "bg-amber-50/50 dark:bg-amber-950/20"
                                        )}
                                    >

                                        <td className="py-2 px-2">
                                            <Input
                                                ref={el => { if (el) inputRefs.current.set(`${row.id}-name`, el); }}
                                                value={row.name}
                                                onChange={e => updateRow(row.id, 'name', e.target.value)}
                                                onKeyDown={e => handleKeyDown(e, row.id, 'name')}
                                                placeholder="Name"
                                                className="h-9 border border-input bg-background focus:ring-1 focus:ring-primary min-w-[120px]"
                                                disabled={row.status === 'saved'}
                                            />
                                        </td>
                                        <td className="py-2 px-1">
                                            <Select
                                                value={row.metal_type}
                                                onValueChange={v => updateRow(row.id, 'metal_type', v)}
                                                disabled={row.status === 'saved'}
                                            >
                                                <SelectTrigger className="h-9 border border-input bg-background focus:ring-1 focus:ring-primary">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {METAL_TYPES.map(m => (
                                                        <SelectItem key={m} value={m}>{m}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </td>
                                        <td className="py-2 px-1">
                                            <Select
                                                value={row.purity}
                                                onValueChange={v => updateRow(row.id, 'purity', v)}
                                                disabled={row.status === 'saved'}
                                            >
                                                <SelectTrigger className="h-9 border border-input bg-background focus:ring-1 focus:ring-primary">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {PURITY_OPTIONS[row.metal_type].map(p => (
                                                        <SelectItem key={p} value={p}>{p}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </td>
                                        <td className="py-2 px-1">
                                            <Input
                                                ref={el => { if (el) inputRefs.current.set(`${row.id}-hsn_code`, el); }}
                                                value={row.hsn_code || ''}
                                                onChange={e => updateRow(row.id, 'hsn_code', e.target.value)}
                                                onKeyDown={e => handleKeyDown(e, row.id, 'hsn_code')}
                                                className="h-9 border border-input bg-background focus:ring-1 focus:ring-primary min-w-[70px]"
                                                disabled={row.status === 'saved'}
                                            />
                                        </td>

                                        <td className="py-2 px-1">
                                            <Select
                                                value={row.category}
                                                onValueChange={v => updateRow(row.id, 'category', v)}
                                                disabled={row.status === 'saved'}
                                            >
                                                <SelectTrigger className="h-9 border border-input bg-background focus:ring-1 focus:ring-primary min-w-[100px]">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {ITEM_CATEGORIES.map(c => (
                                                        <SelectItem key={c} value={c}>{c}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </td>
                                        <td className="py-2 px-1">
                                            <Input
                                                ref={el => { if (el) inputRefs.current.set(`${row.id}-gross_weight`, el); }}
                                                type="number"
                                                step="0.01"
                                                value={row.gross_weight || ''}
                                                onChange={e => updateRow(row.id, 'gross_weight', parseFloat(e.target.value) || 0)}
                                                onKeyDown={e => handleKeyDown(e, row.id, 'gross_weight')}
                                                className="h-9 border border-input bg-background focus:ring-1 focus:ring-primary min-w-[70px]"
                                                disabled={row.status === 'saved'}
                                            />
                                        </td>
                                        <td className="py-2 px-1">
                                            <Input
                                                ref={el => { if (el) inputRefs.current.set(`${row.id}-net_weight`, el); }}
                                                type="number"
                                                step="0.01"
                                                value={row.net_weight || ''}
                                                onChange={e => updateRow(row.id, 'net_weight', parseFloat(e.target.value) || 0)}
                                                onKeyDown={e => handleKeyDown(e, row.id, 'net_weight')}
                                                className="h-9 border border-input bg-background focus:ring-1 focus:ring-primary min-w-[70px]"
                                                disabled={row.status === 'saved'}
                                            />
                                        </td>
                                        <td className="py-2 px-1">
                                            <Input
                                                ref={el => { if (el) inputRefs.current.set(`${row.id}-stone_weight`, el); }}
                                                type="number"
                                                step="0.01"
                                                value={row.stone_weight || ''}
                                                onChange={e => updateRow(row.id, 'stone_weight', parseFloat(e.target.value) || 0)}
                                                onKeyDown={e => handleKeyDown(e, row.id, 'stone_weight')}
                                                className="h-9 border border-input bg-background focus:ring-1 focus:ring-primary min-w-[70px]"
                                                disabled={row.status === 'saved'}
                                            />
                                        </td>
                                        <td className="py-2 px-1">
                                            <Input
                                                ref={el => { if (el) inputRefs.current.set(`${row.id}-wastage_percent`, el); }}
                                                type="number"
                                                step="0.01"
                                                value={row.wastage_percent || ''}
                                                onChange={e => updateRow(row.id, 'wastage_percent', parseFloat(e.target.value) || 0)}
                                                onKeyDown={e => handleKeyDown(e, row.id, 'wastage_percent')}
                                                className="h-9 border border-input bg-background focus:ring-1 focus:ring-primary min-w-[70px]"
                                                disabled={row.status === 'saved'}
                                            />
                                        </td>
                                        <td className="py-2 px-1">
                                            <Input
                                                ref={el => { if (el) inputRefs.current.set(`${row.id}-making_charge_value`, el); }}
                                                type="number"
                                                value={row.making_charge_value || ''}
                                                onChange={e => updateRow(row.id, 'making_charge_value', parseFloat(e.target.value) || 0)}
                                                onKeyDown={e => handleKeyDown(e, row.id, 'making_charge_value')}
                                                className="h-9 border border-input bg-background focus:ring-1 focus:ring-primary min-w-[80px]"
                                                disabled={row.status === 'saved'}
                                            />
                                        </td>
                                        <td className="py-2 px-1">
                                            <Input
                                                ref={el => { if (el) inputRefs.current.set(`${row.id}-stone_value`, el); }}
                                                type="number"
                                                value={row.stone_value || ''}
                                                onChange={e => updateRow(row.id, 'stone_value', parseFloat(e.target.value) || 0)}
                                                onKeyDown={e => handleKeyDown(e, row.id, 'stone_value')}
                                                className="h-9 border border-input bg-background focus:ring-1 focus:ring-primary min-w-[80px]"
                                                disabled={row.status === 'saved'}
                                            />
                                        </td>
                                        <td className="py-2 px-2 text-center">
                                            {row.status === 'saved' && (
                                                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-200">
                                                    Saved
                                                </Badge>
                                            )}
                                            {row.status === 'saving' && (
                                                <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-200">
                                                    Saving
                                                </Badge>
                                            )}
                                            {row.status === 'error' && (
                                                <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-200" title={row.error}>
                                                    Error
                                                </Badge>
                                            )}
                                            {row.status === 'pending' && (
                                                <Badge variant="outline" className="text-muted-foreground border-border">
                                                    Pending
                                                </Badge>
                                            )}
                                        </td>
                                        <td className="py-2 px-1">
                                            {row.status !== 'saved' && rows.length > 1 && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                                    onClick={() => deleteRow(row.id)}
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Add Row Button */}
                    <div className="p-3 border-t border-border bg-muted/30">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={addRow}
                            className="gap-2"
                        >
                            <Plus className="h-4 w-4" />
                            Add Row
                        </Button>
                        <span className="text-xs text-muted-foreground ml-4">
                            Press Tab to move between cells, Enter to go to next row
                        </span>
                    </div>
                </Card>
            </div>
        </div>
    );
}
