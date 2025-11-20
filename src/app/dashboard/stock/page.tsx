'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { useUser } from '@/supabase/provider';
import { supabase } from '@/supabase/client';
import type { StockItem } from '@/lib/definitions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit2, Trash2, Loader2, Package } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

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

import { MotionWrapper, FadeIn } from '@/components/ui/motion-wrapper';

export default function StockPage() {
  const { toast } = useToast();
  const { user, isUserLoading: userLoading } = useUser();
  const [isPending, startTransition] = useTransition();
  const [editingItem, setEditingItem] = useState<StockItem | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const [stockItems, setStockItems] = useState<StockItem[] | null>(null);
  const itemsLoading = userLoading || stockItems === null;

  async function loadItems() {
    if (!user) { setStockItems([]); return; }
    const { data, error } = await supabase
      .from('stock_items')
      .select('*')
      .eq('user_id', user.uid)
      .order('created_at', { ascending: false });
    if (error) {
      console.error('Load stock_items error', error);
      setStockItems([]);
      return;
    }
    const mapped: StockItem[] = (data || []).map((r: any) => ({
      id: r.id,
      userId: r.user_id,
      name: r.name,
      description: r.description || undefined,
      purity: r.purity,
      basePrice: Number(r.base_price) || 0,
      baseWeight: r.base_weight != null ? Number(r.base_weight) : undefined,
      makingChargePerGram: Number(r.making_charge_per_gram) || 0,
      quantity: Number(r.quantity) || 0,
      unit: r.unit,
      category: r.category || undefined,
      isActive: !!r.is_active,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));
    setStockItems(mapped);
  }

  useEffect(() => { loadItems(); }, [user?.uid]);

  const form = useForm<StockItemFormValues>({
    resolver: zodResolver(stockItemSchema),
    defaultValues: {
      name: '',
      description: '',
      purity: '22K',
      basePrice: '' as any,
      baseWeight: '' as any,
      makingChargePerGram: '' as any,
      quantity: '' as any,
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
        // Map camelCase form fields to snake_case DB columns
        const itemDb = {
          user_id: user.uid,
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

        if (editingItem?.id) {
          const { error } = await supabase
            .from('stock_items')
            .update(itemDb)
            .eq('id', editingItem.id)
            .eq('user_id', user.uid);
          if (error) throw error;
          toast({ title: 'Success', description: 'Stock item updated successfully' });
        } else {
          const { error } = await supabase
            .from('stock_items')
            .insert([itemDb]);
          if (error) throw error;
          toast({ title: 'Success', description: 'Stock item added successfully' });
        }

        form.reset();
        setEditingItem(null);
        setIsOpen(false);
        await loadItems();
      } catch (err) {
        console.error('Error saving stock item:', err);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to save stock item. Please try again.',
        });
      }
    });
  };

  const handleEdit = (item: StockItem) => {
    setEditingItem(item);
    form.reset(item);
    setIsOpen(true);
  };

  const handleDelete = (itemId: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    startTransition(async () => {
      try {
        const { error } = await supabase
          .from('stock_items')
          .delete()
          .eq('id', itemId)
          .eq('user_id', user?.uid || '');
        if (error) throw error;
        await loadItems();
        toast({ title: 'Success', description: 'Stock item deleted' });
      } catch (err) {
        console.error('Error deleting item:', err);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to delete stock item',
        });
      }
    });
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setEditingItem(null);
      form.reset();
    }
  };

  const isLoading = userLoading || itemsLoading;

  return (
    <MotionWrapper className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-bold tracking-tight text-primary">Stock Management</h1>
          <p className="text-muted-foreground text-sm sm:text-base mt-1 sm:mt-2">Manage your jewelry inventory</p>
        </div>
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingItem(null);
              form.reset();
            }} className="w-full sm:w-auto" variant="premium">
              <Plus className="mr-2 h-4 w-4" />
              Add Item
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto sm:max-h-[85vh]">
            <DialogHeader className="pb-3">
              <DialogTitle className="text-lg sm:text-xl font-heading text-primary">{editingItem ? 'Edit Stock Item' : 'Add New Stock Item'}</DialogTitle>
              <DialogDescription className="text-xs sm:text-sm">
                {editingItem ? 'Update the stock item details' : 'Enter details for a new stock item'}
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Item Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Gold Ring" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Input placeholder="Optional description" {...field} />
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
                          <Input placeholder="e.g., 22K, 92.5, 999" {...field} />
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
                          <Input placeholder="e.g., Gold, Silver, Bronze" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="basePrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Base Price *</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="Enter price" {...field} />
                        </FormControl>
                        <FormDescription className="text-xs">Price per unit (₹)</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="makingChargePerGram"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Making Charge/Unit *</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="Enter charge" {...field} />
                        </FormControl>
                        <FormDescription className="text-xs">Making charge (₹)</FormDescription>
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
                          <Input type="number" placeholder="Enter quantity" {...field} />
                        </FormControl>
                        <FormDescription className="text-xs">Current stock quantity</FormDescription>
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
                          <Input placeholder="gram, piece, ml" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="baseWeight"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Base Weight (Optional)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="Enter weight if applicable" {...field} />
                      </FormControl>
                      <FormDescription className="text-xs">Default weight per item (if applicable)</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />                <DialogFooter>
                  <Button type="submit" disabled={isPending} variant="premium">
                    {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {editingItem ? 'Update Item' : 'Add Item'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="glass-card border-t-4 border-t-primary">
        <CardHeader className="pb-3">
          <CardTitle className="text-xl sm:text-2xl font-heading text-primary">Stock Items</CardTitle>
          <CardDescription className="text-xs sm:text-sm">View and manage your jewelry inventory</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full bg-white/10" />
              <Skeleton className="h-12 w-full bg-white/10" />
              <Skeleton className="h-12 w-full bg-white/10" />
            </div>
          ) : !stockItems || stockItems.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Package className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p className="text-sm sm:text-base">No stock items yet. Add your first item to get started.</p>
            </div>
          ) : (
            <>
              <div className="rounded-md border border-white/10 overflow-hidden hidden md:block">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow className="hover:bg-transparent border-b-white/10">
                        <TableHead className="font-semibold min-w-[140px] pl-6 sm:pl-4 text-primary">Name</TableHead>
                        <TableHead className="font-semibold min-w-[70px] hidden sm:table-cell text-primary">Purity</TableHead>
                        <TableHead className="font-semibold min-w-[80px] text-primary">Qty</TableHead>
                        <TableHead className="font-semibold hidden sm:table-cell min-w-[60px] text-primary">Unit</TableHead>
                        <TableHead className="font-semibold text-right min-w-[90px] text-primary">Price</TableHead>
                        <TableHead className="font-semibold text-right hidden md:table-cell min-w-[90px] text-primary">Making</TableHead>
                        <TableHead className="font-semibold hidden lg:table-cell min-w-[100px] text-primary">Category</TableHead>
                        <TableHead className="text-right font-semibold min-w-[90px] pr-6 sm:pr-4 text-primary">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {stockItems.map((item) => (
                        <TableRow key={item.id} className={!item.isActive ? 'opacity-50 border-b-white/5' : 'hover:bg-muted/50 border-b-white/5 transition-colors'}>
                          <TableCell className="font-medium pl-6 sm:pl-4">
                            <div className="flex flex-col">
                              <span className="truncate max-w-[120px] sm:max-w-none">{item.name}</span>
                              <span className="text-xs text-muted-foreground sm:hidden">{item.purity}</span>
                            </div>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">{item.purity}</TableCell>
                          <TableCell className="whitespace-nowrap">
                            <div className="flex flex-col sm:flex-row sm:items-center">
                              <span className="font-medium">{item.quantity}</span>
                              <span className="text-xs text-muted-foreground sm:hidden">{item.unit}</span>
                            </div>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell text-muted-foreground">{item.unit}</TableCell>
                          <TableCell className="text-right font-medium text-sm sm:text-base">₹{item.basePrice.toFixed(0)}</TableCell>
                          <TableCell className="text-right hidden md:table-cell text-sm sm:text-base">₹{item.makingChargePerGram.toFixed(0)}</TableCell>
                          <TableCell className="hidden lg:table-cell">
                            <span className="text-xs bg-muted px-2 py-1 rounded">{item.category || '-'}</span>
                          </TableCell>
                          <TableCell className="text-right pr-6 sm:pr-4">
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(item)}
                                disabled={isPending}
                                className="h-8 w-8 p-0 hover:text-primary"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(item.id)}
                                disabled={isPending}
                                className="text-destructive h-8 w-8 p-0 hover:bg-destructive/10"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden space-y-4">
                {stockItems.map((item) => (
                  <div
                    key={item.id}
                    className={`relative overflow-hidden rounded-xl border border-white/10 bg-card/50 p-4 shadow-sm transition-all ${!item.isActive ? 'opacity-50' : ''}`}
                  >
                    <div className="absolute right-0 top-0 h-16 w-16 -translate-y-8 translate-x-8 rounded-full bg-[#D4AF37]/10 blur-xl"></div>

                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="text-xs text-[#D4AF37] font-medium mb-0.5">{item.purity}</div>
                        <h3 className="font-serif text-lg font-bold text-foreground">{item.name}</h3>
                        <div className="text-xs text-muted-foreground">{item.category || 'Uncategorized'}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-muted-foreground mb-0.5">Base Price</div>
                        <div className="font-serif text-xl font-bold text-[#D4AF37]">₹{item.basePrice.toFixed(0)}</div>
                        <div className="text-xs text-muted-foreground">+ ₹{item.makingChargePerGram.toFixed(0)} making</div>
                      </div>
                    </div>

                    <div className="flex justify-between items-end border-t border-white/5 pt-3">
                      <div>
                        <div className="text-xs text-muted-foreground mb-0.5">Stock</div>
                        <div className="font-medium">{item.quantity} <span className="text-xs text-muted-foreground">{item.unit}</span></div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="icon" className="h-8 w-8 rounded-full border-white/10 bg-white/5 hover:bg-[#D4AF37] hover:text-[#0F172A] hover:border-[#D4AF37]" onClick={() => handleEdit(item)} disabled={isPending}>
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="outline" size="icon" className="h-8 w-8 rounded-full border-white/10 bg-white/5 text-destructive hover:bg-destructive hover:text-white hover:border-destructive" onClick={() => handleDelete(item.id)} disabled={isPending}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </MotionWrapper>
  );
}
