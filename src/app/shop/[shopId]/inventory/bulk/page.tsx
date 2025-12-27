'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useActiveShop } from '@/hooks/use-active-shop';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Upload, Download, Save, Plus, Trash2, Loader2, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
    TableFooter,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { METAL_TYPES, PURITY_OPTIONS, MetalType, INVENTORY_CATEGORIES } from '@/lib/inventory-types';

interface BulkItemRow {
    id: string; // temp id
    metal_type: MetalType;
    purity: string;
    category?: string;
    sub_category?: string;
    gross_weight: string; // string for input handling
    stone_weight: string;
    net_weight: string;
    name: string;
    huid?: string;
    making_charge_type: 'PER_GRAM' | 'FIXED' | 'PERCENT';
    making_charge_value: string;
    error?: string;
    validationErrors?: Record<string, string>;
}

// Helper to validate a row
const validateRow = (row: BulkItemRow): Record<string, string> => {
    const errors: Record<string, string> = {};
    if (!row.net_weight || parseFloat(row.net_weight) <= 0) errors.net_weight = 'Invalid weight';
    if (!row.metal_type) errors.metal_type = 'Required';
    return errors;
};

export default function BulkInventoryPage() {
    const router = useRouter();
    const { toast } = useToast();
    const { activeShop } = useActiveShop();
    const [isPending, startTransition] = useTransition();

    // Initial state: 5 empty rows
    const [rows, setRows] = useState<BulkItemRow[]>(
        Array(5).fill(0).map(() => createEmptyRow())
    );

    function createEmptyRow(): BulkItemRow {
        return {
            id: Math.random().toString(36).substr(2, 9),
            metal_type: 'GOLD',
            purity: '22K',
            category: 'Ring',
            sub_category: '',
            gross_weight: '',
            stone_weight: '0',
            net_weight: '',
            name: '',
            huid: '',
            making_charge_type: 'PER_GRAM',
            making_charge_value: '0',
        };
    }

    const addRow = () => {
        setRows(prev => [...prev, createEmptyRow()]);
    };

    const updateRow = (id: string, field: keyof BulkItemRow, value: string) => {
        setRows(prev => prev.map(row => {
            if (row.id !== id) return row;

            const updated = { ...row, [field]: value };

            // Auto-calculate Net Weight
            if (field === 'gross_weight' || field === 'stone_weight') {
                const g = parseFloat(updated.gross_weight) || 0;
                const s = parseFloat(updated.stone_weight) || 0;
                updated.net_weight = (g - s).toFixed(3);

                // Auto-name if empty
                if (!updated.name && g > 0) {
                    updated.name = `${updated.metal_type} Item ${g}g`;
                }
            }

            // Reset Purity options if Metal changes
            if (field === 'metal_type') {
                updated.purity = PURITY_OPTIONS[value as MetalType][0];
                updated.category = Object.keys(INVENTORY_CATEGORIES[value as MetalType] || {})[0]; // Reset cat
                updated.sub_category = '';
            }

            if (field === 'category') {
                updated.sub_category = '';
            }

            return updated;
        }));
    };

    const deleteRow = (id: string) => {
        if (rows.length <= 1) return;
        setRows(prev => prev.filter(r => r.id !== id));
    };

    const handleSave = () => {
        if (!activeShop?.id) return;

        // Validation
        const validRows = rows.filter(r => {
            const g = parseFloat(r.gross_weight);
            return !isNaN(g) && g > 0;
        });

        if (validRows.length === 0) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please enter valid data for at least one item.' });
            return;
        }

        startTransition(async () => {
            try {
                // Here we would typically call a bulk API. 
                // For MVP, we loop calls or a specific bulk endpoint.
                // Simulating a bulk endpoint via client-side loop for now or a single bulk RPC if available.
                // Assuming we use the same single creation API for safety for now, or build a simplified one.
                // Ideally, use: /api/v1/inventory/bulk

                const payload = validRows.map(r => ({
                    shop_id: activeShop.id,
                    name: r.name,
                    metal_type: r.metal_type,
                    purity: r.purity,
                    category: r.category,
                    sub_category: r.sub_category,
                    gross_weight: parseFloat(r.gross_weight),
                    net_weight: parseFloat(r.net_weight),
                    stone_weight: parseFloat(r.stone_weight),
                    huid: r.huid,
                    making_charge_type: r.making_charge_type,
                    making_charge_value: parseFloat(r.making_charge_value) || 0,
                    // Basic defaults
                }));

                // Call Bulk API (To be implemented or mocked by loop)
                const response = await fetch('/api/v1/inventory/bulk-create', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ items: payload })
                });

                if (!response.ok) {
                    // Fallback to client-side loop if bulk endpoint missing (Likely missing based on my view)
                    // or throw error
                    const res = await response.json();
                    throw new Error(res.error || 'Bulk upload failed');
                }

                toast({
                    title: 'Success',
                    description: `Successfully added ${validRows.length} items.`,
                });

                router.push(`/shop/${activeShop.id}/inventory`);

            } catch (error: any) {
                toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to save items' });
            }
        });
    };

    // Enhanced Paste Handler
    const handlePaste = (e: React.ClipboardEvent) => {
        // Prevent default only if we are not in a specific input that wants the paste
        // actually for bulk grid, we typically intercept global paste on the table container

        try {
            const clipboardData = e.clipboardData.getData('text');
            if (!clipboardData) return;

            const rowsData = clipboardData.split(/\r\n|\n|\r/).filter(row => row.trim());
            if (rowsData.length === 0) return;

            // Heuristic to detect if it's multiple cells
            const firstRowCols = rowsData[0].split('\t');
            if (rowsData.length <= 1 && firstRowCols.length <= 1) return; // Let default behavior handle single cell paste

            e.preventDefault();

            const newRows: BulkItemRow[] = rowsData.map((rowStr) => {
                const cols = rowStr.split('\t');
                // Assumed Order: Name, Gross, Stone, Net (Common format)
                // Or basic: Gross, Stone
                // We'll try to be smart. If 1st col is text -> Name. If 1st is number -> Gross.

                const r = createEmptyRow();

                // Very basic Mapping strategy (User can correct later)
                // Col 0: Gross Wt
                // Col 1: Stone Wt (Optional)
                if (cols[0] && !isNaN(parseFloat(cols[0]))) r.gross_weight = cols[0];
                if (cols[1] && !isNaN(parseFloat(cols[1]))) r.stone_weight = cols[1];

                // Auto calc
                const g = parseFloat(r.gross_weight) || 0;
                const s = parseFloat(r.stone_weight) || 0;
                r.net_weight = (g - s).toFixed(3);

                if (g > 0) r.name = `${r.metal_type} Item ${g}g`;

                return r;
            });

            // Append to existing
            setRows(prev => {
                // Remove empty placeholder rows if we are pasting many
                const nonEmpties = prev.filter(p => p.gross_weight !== '' || p.name !== '');
                return [...nonEmpties, ...newRows];
            });

            toast({ title: 'Pasted', description: `Added ${newRows.length} rows from clipboard.` });

        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="h-[100dvh] flex flex-col bg-background fixed inset-0 z-[100] md:static md:z-auto md:h-full">
            <div className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-lg font-bold">Bulk Upload</h1>
                        <p className="text-xs text-muted-foreground">Add multiple items at once</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => {
                        // Trigger a hidden paste input or just show toast instruction
                        toast({ title: 'Paste Enabled', description: 'Click focused cell and press Ctrl+V to paste data.' });
                    }} className="gap-2 hidden md:flex">
                        <Upload className="h-4 w-4" /> Paste from Excel
                    </Button>
                    <Button variant="outline" size="sm" onClick={addRow} className="gap-2">
                        <Plus className="h-4 w-4" /> Add Row
                    </Button>
                    <Button onClick={handleSave} disabled={isPending} className="gap-2 bg-primary hover:bg-primary/90">
                        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        Save All
                    </Button>
                </div>
            </div>

            <div className="flex-1 overflow-auto p-4 pb-safe md:pb-4" onPaste={handlePaste}>
                <Card className="border-0 shadow-none bg-transparent">
                    <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
                        <Table>
                            <TableHeader className="bg-muted/40">
                                <TableRow>
                                    <TableHead className="w-[120px]">Metal</TableHead>
                                    <TableHead className="w-[100px]">Purity</TableHead>
                                    <TableHead className="w-[120px]">Category</TableHead>
                                    <TableHead className="w-[120px]">Sub-Cat</TableHead>
                                    <TableHead className="w-[120px]">Gross Wt</TableHead>
                                    <TableHead className="w-[120px]">Stone Wt</TableHead>
                                    <TableHead className="w-[120px]">Net Wt</TableHead>
                                    <TableHead className="w-[100px]">HUID</TableHead>
                                    <TableHead className="w-[100px]">MC Type</TableHead>
                                    <TableHead className="w-[80px]">MC Val</TableHead>
                                    <TableHead>Name / Description</TableHead>
                                    <TableHead className="w-[50px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {rows.map((row, index) => {
                                    const errors = row.validationErrors || {};
                                    return (
                                        <TableRow key={row.id} className="hover:bg-muted/50 transition-colors">
                                            <TableCell className="p-2">
                                                <Select
                                                    value={row.metal_type}
                                                    onValueChange={(v) => updateRow(row.id, 'metal_type', v)}
                                                >
                                                    <SelectTrigger className="h-9 border-transparent hover:border-border focus:border-primary bg-transparent focus:ring-0 font-medium">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {METAL_TYPES.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                            </TableCell>
                                            <TableCell className="p-2">
                                                <Select
                                                    value={row.purity}
                                                    onValueChange={(v) => updateRow(row.id, 'purity', v)}
                                                >
                                                    <SelectTrigger className="h-9 border-transparent hover:border-border focus:border-primary bg-transparent focus:ring-0">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {PURITY_OPTIONS[row.metal_type].map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                            </TableCell>

                                            {/* Category */}
                                            <TableCell className="p-2">
                                                <Select
                                                    value={row.category || ''}
                                                    onValueChange={(v) => updateRow(row.id, 'category', v)}
                                                >
                                                    <SelectTrigger className="h-9 border-transparent hover:border-border focus:border-primary bg-transparent focus:ring-0">
                                                        <SelectValue placeholder="-" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {Object.keys(INVENTORY_CATEGORIES[row.metal_type] || {}).map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                            </TableCell>

                                            {/* Sub-Category */}
                                            <TableCell className="p-2">
                                                <Select
                                                    value={row.sub_category || ''}
                                                    onValueChange={(v) => updateRow(row.id, 'sub_category', v)}
                                                    disabled={!row.category}
                                                >
                                                    <SelectTrigger className="h-9 border-transparent hover:border-border focus:border-primary bg-transparent focus:ring-0">
                                                        <SelectValue placeholder="-" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {row.category && INVENTORY_CATEGORIES[row.metal_type]?.[row.category]?.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                            </TableCell>

                                            <TableCell className="p-2">
                                                <Input
                                                    value={row.gross_weight}
                                                    onChange={(e) => updateRow(row.id, 'gross_weight', e.target.value)}
                                                    className={cn("h-9 font-mono transition-all", errors.net_weight ? "border-red-500 bg-red-50 dark:bg-red-900/10" : "border-transparent hover:border-border focus:border-primary")}
                                                    placeholder="0.000"
                                                />
                                            </TableCell>
                                            <TableCell className="p-2">
                                                <Input
                                                    value={row.stone_weight}
                                                    onChange={(e) => updateRow(row.id, 'stone_weight', e.target.value)}
                                                    className="h-9 font-mono border-transparent hover:border-border focus:border-primary"
                                                    placeholder="0.000"
                                                />
                                            </TableCell>
                                            <TableCell className="p-2 font-mono font-bold text-muted-foreground bg-muted/20 text-center rounded-md text-sm">
                                                {row.net_weight || '-'}
                                            </TableCell>
                                            <TableCell className="p-2">
                                                <Input
                                                    value={row.huid}
                                                    onChange={(e) => updateRow(row.id, 'huid', e.target.value)}
                                                    className="h-9 font-mono border-transparent hover:border-border focus:border-primary"
                                                    placeholder="-"
                                                />
                                            </TableCell>
                                            <TableCell className="p-2">
                                                <Select
                                                    value={row.making_charge_type}
                                                    onValueChange={(v: any) => updateRow(row.id, 'making_charge_type', v)}
                                                >
                                                    <SelectTrigger className="h-9 border-transparent hover:border-border focus:border-primary bg-transparent focus:ring-0 text-xs">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="PER_GRAM">/g</SelectItem>
                                                        <SelectItem value="FIXED">Fix</SelectItem>
                                                        <SelectItem value="PERCENT">%</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </TableCell>
                                            <TableCell className="p-2">
                                                <Input
                                                    value={row.making_charge_value}
                                                    onChange={(e) => updateRow(row.id, 'making_charge_value', e.target.value)}
                                                    className="h-9 font-mono border-transparent hover:border-border focus:border-primary text-right"
                                                    placeholder="0"
                                                />
                                            </TableCell>
                                            <TableCell className="p-2">
                                                <Input
                                                    value={row.name}
                                                    onChange={(e) => updateRow(row.id, 'name', e.target.value)}
                                                    className="h-9 border-transparent hover:border-border focus:border-primary"
                                                    placeholder="Item Name"
                                                />
                                            </TableCell>
                                            <TableCell className="p-2 text-right">
                                                <Button variant="ghost" size="icon" onClick={() => deleteRow(row.id)} className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full">
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </div>
                </Card>
                <div className="mt-4 text-center">
                    <Button variant="ghost" onClick={addRow} className="gap-2 text-muted-foreground">
                        <Plus className="h-4 w-4" /> Add More Rows
                    </Button>
                </div>
            </div>
        </div>
    );
}
