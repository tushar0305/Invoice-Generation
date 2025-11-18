'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useFieldArray, useForm } from 'react-hook-form';
import { z } from 'zod';
import { format } from 'date-fns';
import { CalendarIcon, Loader2, PlusCircle, Trash2, ArrowLeft, ShoppingCart, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useTransition, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
// AI description removed
import type { Invoice, InvoiceItem, StockItem, UserSettings } from '@/lib/definitions';
import { cn, formatCurrency } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useUser } from '@/supabase/provider';
import { supabase } from '@/supabase/client';
import { useStockItems } from '@/hooks/use-stock-items';
import { isShopSetupComplete } from '@/lib/shop-setup';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';


const formSchema = z.object({
  customerName: z.string().min(2, 'Customer name is required'),
  customerAddress: z.string().min(5, 'Customer address is required'),
  customerState: z.string().trim().optional().default(''),
  customerPincode: z.string().trim().optional().default(''),
  customerPhone: z.string().min(10, 'A valid phone number is required'),
  invoiceDate: z.date({ required_error: 'Invoice date is required' }),
  items: z.array(z.object({
      id: z.string(),
      description: z.string().min(1, 'Description is required'),
      purity: z.enum(["10", "12", "14", "18", "20", "22", "24"], { required_error: 'Purity is required.' }),
      grossWeight: z.coerce.number().positive('Gross Wt. must be positive'),
      netWeight: z.coerce.number().positive('Net Wt. must be positive'),
      rate: z.coerce.number().min(0, 'Rate is required'),
      making: z.coerce.number().min(0, 'Making charges are required'),
    })).min(1, 'At least one item is required'),
  discount: z.coerce.number().min(0, 'Discount cannot be negative'),
  sgst: z.coerce.number().min(0).max(100, 'SGST should be a percentage'),
  cgst: z.coerce.number().min(0).max(100, 'CGST should be a percentage'),
  status: z.enum(['paid', 'due']),
});

type InvoiceFormValues = z.infer<typeof formSchema>;

interface InvoiceFormProps {
  invoice?: Invoice & { items: InvoiceItem[] };
}

async function getNextInvoiceNumberSupabase(userId: string): Promise<string> {
  const currentYear = new Date().getFullYear();
  // Fetch only the current user's invoices; order desc by created_at for quick scan
  const { data, error } = await supabase
    .from('invoices')
    .select('invoice_number, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1000);
  if (error) throw new Error(error.message);

  let latestSeqForYear = 0;
  const NEW_FMT = /^INV(\d{4})(\d+)$/; // INV2025###
  const OLD_FMT = /^INV-(\d{4})-(\d+)$/; // legacy support
  (data ?? []).forEach((row: any) => {
    const invNum: string | undefined = row?.invoice_number;
    if (!invNum) return;
    let match: RegExpExecArray | null = null;
    if ((match = NEW_FMT.exec(invNum)) || (match = OLD_FMT.exec(invNum))) {
      const year = parseInt(match[1], 10);
      const seq = parseInt(match[2], 10);
      if (year === currentYear && !Number.isNaN(seq)) {
        latestSeqForYear = Math.max(latestSeqForYear, seq);
      }
    }
  });
  const nextSeq = latestSeqForYear + 1;
  return `INV${currentYear}${String(nextSeq).padStart(3, '0')}`;
}

const calculateTotals = (items: InvoiceFormValues['items'], discount: number, sgst: number, cgst: number) => {
    const subtotal = items.reduce((acc, item) => {
      // Making charges are per net gram basis
      const itemTotal = (Number(item.netWeight) || 0) * (Number(item.rate) || 0) + ((Number(item.netWeight) || 0) * (Number(item.making) || 0));
      return acc + itemTotal;
    }, 0);
    const totalBeforeTax = subtotal - (discount || 0);
    const sgstAmount = totalBeforeTax * ((sgst || 0) / 100);
    const cgstAmount = totalBeforeTax * ((cgst || 0) / 100);
    const grandTotal = totalBeforeTax + sgstAmount + cgstAmount;
    return { subtotal, grandTotal };
};

export function InvoiceForm({ invoice }: InvoiceFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  // AI state removed
  const { user } = useUser();
  // Load user settings to validate shop setup
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [settingsLoading, setSettingsLoading] = useState(true);

  useEffect(() => {
    const loadSettings = async () => {
      if (!user?.uid) {
        setSettingsLoading(false);
        return;
      }
      try {
        const { data } = await supabase
          .from('user_settings')
          .select('*')
          .eq('user_id', user.uid)
          .maybeSingle();
        if (data) {
          setSettings({
            id: data.user_id,
            userId: data.user_id,
            cgstRate: Number(data.cgst_rate) || 0,
            sgstRate: Number(data.sgst_rate) || 0,
            shopName: data.shop_name || 'Jewellers Store',
            gstNumber: data.gst_number || '',
            panNumber: data.pan_number || '',
            address: data.address || '',
            state: data.state || '',
            pincode: data.pincode || '',
            phoneNumber: data.phone_number || '',
            email: data.email || user.email || '',
          });
        }
      } catch (error) {
        console.error('Error loading settings:', error);
      } finally {
        setSettingsLoading(false);
      }
    };
    loadSettings();
  }, [user?.uid]);

  const defaultValues: Partial<InvoiceFormValues> = invoice
    ? {
        ...invoice,
        invoiceDate: new Date(invoice.invoiceDate),
        items: invoice.items.map(item => ({...item, purity: item.purity as InvoiceFormValues['items'][number]['purity']})),
        sgst: (invoice as any).sgst ?? 1.5,
        cgst: (invoice as any).cgst ?? 1.5,
        customerState: (invoice as any).customerState || '',
        customerPincode: (invoice as any).customerPincode || '',
      }
    : {
        customerName: '',
        customerAddress: '',
        customerState: '',
        customerPincode: '',
        customerPhone: '',
        invoiceDate: new Date(),
  items: [{ id: uuidv4(), description: '', purity: '22', grossWeight: 0, netWeight: 0, rate: 0, making: 0 }],
        discount: 0,
        sgst: 1.5,
        cgst: 1.5,
        status: 'due',
      };

  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
    mode: 'onChange',
  });

  // Load stock items
  const { items: stockItems, isLoading: stockLoading } = useStockItems(user?.uid);
  const [showStockDialog, setShowStockDialog] = useState(false);

  useEffect(() => {
    if (settings && !invoice) { // Only set defaults for new invoices
      form.setValue('sgst', settings.sgstRate ?? 1.5);
      form.setValue('cgst', settings.cgstRate ?? 1.5);
    }
  }, [settings, invoice, form]);

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  const handleAddStockItem = (stockItem: StockItem) => {
    // Add stock item to invoice without applying base price directly
    // Allow user to manually enter rate and making charge
    append({
      id: uuidv4(),
      description: stockItem.name,
      purity: stockItem.purity,
      grossWeight: stockItem.baseWeight || 0,
      netWeight: stockItem.baseWeight || 0,
      rate: 0, // User must enter rate manually
      making: stockItem.makingChargePerGram || 0,
    });
    setShowStockDialog(false);
  };

  const watchedItems = form.watch('items');
  const watchedDiscount = form.watch('discount');
  const watchedSgst = form.watch('sgst');
  const watchedCgst = form.watch('cgst');

  const { subtotal, grandTotal } = calculateTotals(watchedItems, watchedDiscount, watchedSgst, watchedCgst);

  async function onSubmit(data: InvoiceFormValues) {
    if (!user) {
        toast({ variant: 'destructive', title: 'Authentication Error', description: 'You must be logged in to save an invoice.'});
        return;
    }

    startTransition(async () => {
      try {
        const { items, ...invoiceMainData } = data;
        const { grandTotal: finalGrandTotal } = calculateTotals(items, data.discount, data.sgst, data.cgst);

        if (invoice) {
          // UPDATE existing invoice
          const invoiceId = invoice.id;
          const { error: invErr } = await supabase
            .from('invoices')
            .update({
              customer_name: invoiceMainData.customerName,
              customer_address: invoiceMainData.customerAddress,
              customer_state: invoiceMainData.customerState,
              customer_pincode: invoiceMainData.customerPincode,
              customer_phone: invoiceMainData.customerPhone,
              invoice_date: format(invoiceMainData.invoiceDate, 'yyyy-MM-dd'),
              discount: invoiceMainData.discount,
              sgst: invoiceMainData.sgst,
              cgst: invoiceMainData.cgst,
              status: invoiceMainData.status,
              grand_total: finalGrandTotal,
              updated_at: new Date().toISOString(),
            })
            .eq('id', invoiceId)
            .eq('user_id', user.uid);
          if (invErr) throw invErr;

          // Fetch existing items to determine deletions
          const { data: existingItems, error: itemsFetchErr } = await supabase
            .from('invoice_items')
            .select('id')
            .eq('invoice_id', invoiceId);
          if (itemsFetchErr) throw itemsFetchErr;
          const existingIds = new Set((existingItems ?? []).map((r: any) => r.id));
          const newIds = new Set(items.map(i => i.id));
          const toDelete = [...existingIds].filter(id => !newIds.has(id));
          if (toDelete.length > 0) {
            const { error: delErr } = await supabase
              .from('invoice_items')
              .delete()
              .in('id', toDelete);
            if (delErr) throw delErr;
          }
          // Upsert items
          const upsertRows = items.map(i => ({
            id: i.id,
            invoice_id: invoiceId,
            description: i.description,
            purity: i.purity,
            gross_weight: Number(i.grossWeight) || 0,
            net_weight: Number(i.netWeight) || 0,
            rate: Number(i.rate) || 0,
            making: Number(i.making) || 0,
          }));
          if (upsertRows.length > 0) {
            const { error: upErr } = await supabase
              .from('invoice_items')
              .upsert(upsertRows, { onConflict: 'id' });
            if (upErr) throw upErr;
          }
          var invoiceIdToNavigate = invoiceId;
        } else {
          // CREATE new invoice
          const invoiceNumber = await getNextInvoiceNumberSupabase(user.uid);
          const { data: insertInv, error: insErr } = await supabase
            .from('invoices')
            .insert([{
              user_id: user.uid,
              invoice_number: invoiceNumber,
              customer_name: invoiceMainData.customerName,
              customer_address: invoiceMainData.customerAddress,
              customer_state: invoiceMainData.customerState,
              customer_pincode: invoiceMainData.customerPincode,
              customer_phone: invoiceMainData.customerPhone,
              invoice_date: format(invoiceMainData.invoiceDate, 'yyyy-MM-dd'),
              discount: invoiceMainData.discount,
              sgst: invoiceMainData.sgst,
              cgst: invoiceMainData.cgst,
              status: invoiceMainData.status,
              grand_total: finalGrandTotal,
            }])
            .select('id')
            .single();
          if (insErr) throw insErr;
          const newInvoiceId = (insertInv as any).id as string;
          // Insert items
          const rows = items.map(i => ({
            id: i.id,
            invoice_id: newInvoiceId,
            description: i.description,
            purity: i.purity,
            gross_weight: Number(i.grossWeight) || 0,
            net_weight: Number(i.netWeight) || 0,
            rate: Number(i.rate) || 0,
            making: Number(i.making) || 0,
          }));
          if (rows.length > 0) {
            const { error: insItemsErr } = await supabase
              .from('invoice_items')
              .insert(rows);
            if (insItemsErr) throw insItemsErr;
          }
          var invoiceIdToNavigate = newInvoiceId;
        }
        
        toast({
          title: `Invoice ${invoice ? 'updated' : 'created'} successfully!`,
          description: `Redirecting to view invoice...`,
        });
        
        router.push(`/dashboard/invoices/${invoiceIdToNavigate}/view`);

      } catch (error) {
        console.error("Failed to save invoice:", error);
        toast({
          variant: 'destructive',
          title: 'An error occurred',
          description: 'Failed to save the invoice. Please try again.',
        });
      }
    });
  }

  // AI handler removed

  const isShopSetupValid = isShopSetupComplete(settings);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* Shop Setup Warning */}
        {!isShopSetupValid && !settingsLoading && (
          <Alert variant="destructive" className="border-red-300 bg-red-50">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Shop Setup Required</AlertTitle>
            <AlertDescription>
              Please complete your shop setup before creating invoices. This ensures your shop details appear on generated invoices.
              <Button 
                type="button" 
                variant="link" 
                className="mt-2 h-auto p-0 text-red-700 hover:text-red-900"
                onClick={() => router.push('/dashboard/settings')}
              >
                Go to Settings →
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <div className="flex items-center gap-4">
          <Button type="button" variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </div>
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Customer Details</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <FormField control={form.control} name="customerName" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer Name</FormLabel>
                    <FormControl><Input placeholder="e.g., Anjali Sharma" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="customerPhone" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl><Input placeholder="e.g., 9876543210" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="customerAddress" render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Address</FormLabel>
                    <FormControl><Textarea placeholder="Address line" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="customerState" render={({ field }) => (
                  <FormItem>
                    <FormLabel>State</FormLabel>
                    <FormControl><Input placeholder="e.g., Rajasthan" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="customerPincode" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pincode</FormLabel>
                    <FormControl><Input placeholder="e.g., 302001" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Invoice Items</CardTitle>
                </CardHeader>
                <CardContent>
                    {/* Desktop Table */}
                    <div className="hidden md:block">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="min-w-[250px]">Description</TableHead>
                                    <TableHead>Purity</TableHead>
                                    <TableHead>Gross Wt</TableHead>
                                    <TableHead>Net Wt</TableHead>
                                    <TableHead>Rate</TableHead>
                                    <TableHead>Making</TableHead>
                                    <TableHead className="text-right">Amount</TableHead>
                                    <TableHead className="w-12"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {fields.map((field, index) => {
                                    const item = watchedItems[index];
                                    const itemTotal = (Number(item.netWeight) || 0) * (Number(item.rate) || 0) + ((Number(item.netWeight) || 0) * (Number(item.making) || 0));
                                    return (
                                        <TableRow key={field.id}>
                                            <TableCell>
                                                <FormField control={form.control} name={`items.${index}.description`} render={({ field }) => (
                                                <FormItem>
                          <Textarea placeholder="Item description" {...field} className="min-h-0 h-10 min-w-[200px] md:min-w-[250px]"/>
                                                    <FormMessage />
                                                </FormItem>
                                                )} />
                                            </TableCell>
                                             <TableCell>
                                                <FormField control={form.control} name={`items.${index}.purity`} render={({ field }) => (
                                                <FormItem>
                                                  <FormControl>
                                                    <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                                                      <SelectTrigger className="min-w-[70px] md:min-w-[90px]">
                                                        <SelectValue placeholder="Purity" />
                                                      </SelectTrigger>
                                                      <SelectContent>
                                                        <SelectItem value="10">10</SelectItem>
                                                        <SelectItem value="12">12</SelectItem>
                                                        <SelectItem value="14">14</SelectItem>
                                                        <SelectItem value="18">18</SelectItem>
                                                        <SelectItem value="20">20</SelectItem>
                                                        <SelectItem value="22">22</SelectItem>
                                                        <SelectItem value="24">24</SelectItem>
                                                      </SelectContent>
                                                    </Select>
                                                  </FormControl>
                                                  <FormMessage />
                                                </FormItem>
                                                )} />
                                            </TableCell>
                                            <TableCell>
                                                <FormField control={form.control} name={`items.${index}.grossWeight`} render={({ field }) => (
                                                <FormItem><FormControl><Input type="number" placeholder="g" value={field.value === 0 ? '' : field.value} onChange={(e)=> field.onChange(e.target.value === '' ? 0 : Number(e.target.value))} className="min-w-[70px] md:min-w-[90px]" /></FormControl><FormMessage /></FormItem>
                                                )} />
                                            </TableCell>
                                            <TableCell>
                                                <FormField control={form.control} name={`items.${index}.netWeight`} render={({ field }) => (
                                                <FormItem><FormControl><Input type="number" placeholder="g" value={field.value === 0 ? '' : field.value} onChange={(e)=> field.onChange(e.target.value === '' ? 0 : Number(e.target.value))} className="min-w-[70px] md:min-w-[90px]" /></FormControl><FormMessage /></FormItem>
                                                )} />
                                            </TableCell>
                                            <TableCell>
                                                <FormField control={form.control} name={`items.${index}.rate`} render={({ field }) => (
                                                <FormItem><FormControl><Input type="number" placeholder="Rate" value={field.value === 0 ? '' : field.value} onChange={(e)=> field.onChange(e.target.value === '' ? 0 : Number(e.target.value))} className="min-w-[70px] md:min-w-[90px]" /></FormControl><FormMessage /></FormItem>
                                                )} />
                                            </TableCell>
                                            <TableCell>
                                                <FormField control={form.control} name={`items.${index}.making`} render={({ field }) => (
                                                <FormItem><FormControl><Input type="number" placeholder="Charges" value={field.value === 0 ? '' : field.value} onChange={(e)=> field.onChange(e.target.value === '' ? 0 : Number(e.target.value))} className="min-w-[70px] md:min-w-[90px]" /></FormControl><FormMessage /></FormItem>
                                                )} />
                                            </TableCell>
                                            <TableCell className="text-right font-medium">{formatCurrency(itemTotal)}</TableCell>
                                            <TableCell>
                                                <Button type="button" variant="ghost" size="icon" onClick={() => fields.length > 1 && remove(index)} disabled={fields.length <= 1}>
                                                <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Mobile Cards */}
                     <div className="md:hidden space-y-4">
                        {fields.map((field, index) => {
                             const item = watchedItems[index];
                             const itemTotal = (Number(item.netWeight) || 0) * (Number(item.rate) || 0) + ((Number(item.netWeight) || 0) * (Number(item.making) || 0));
                             return (
                                <div key={field.id} className="border rounded-lg p-4 space-y-4">
                                    <FormField control={form.control} name={`items.${index}.description`} render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Item description" {...field} />
                      </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <FormField control={form.control} name={`items.${index}.purity`} render={({ field }) => (
                                            <FormItem>
                                              <FormLabel>Purity</FormLabel>
                                              <FormControl>
                                                <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                                                  <SelectTrigger>
                                                    <SelectValue placeholder="Purity" />
                                                  </SelectTrigger>
                                                  <SelectContent>
                                                    <SelectItem value="10">10</SelectItem>
                                                    <SelectItem value="12">12</SelectItem>
                                                    <SelectItem value="14">14</SelectItem>
                                                    <SelectItem value="18">18</SelectItem>
                                                    <SelectItem value="20">20</SelectItem>
                                                    <SelectItem value="22">22</SelectItem>
                                                    <SelectItem value="24">24</SelectItem>
                                                  </SelectContent>
                                                </Select>
                                              </FormControl>
                                              <FormMessage />
                                            </FormItem>
                                        )} />
                    <FormField control={form.control} name={`items.${index}.grossWeight`} render={({ field }) => (
                      <FormItem><FormLabel>Gross Wt</FormLabel><FormControl><Input type="number" placeholder="g" value={field.value === 0 ? '' : field.value} onChange={(e)=> field.onChange(e.target.value === '' ? 0 : Number(e.target.value))} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name={`items.${index}.netWeight`} render={({ field }) => (
                      <FormItem><FormLabel>Net Wt</FormLabel><FormControl><Input type="number" placeholder="g" value={field.value === 0 ? '' : field.value} onChange={(e)=> field.onChange(e.target.value === '' ? 0 : Number(e.target.value))} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name={`items.${index}.rate`} render={({ field }) => (
                      <FormItem><FormLabel>Rate</FormLabel><FormControl><Input type="number" placeholder="Rate" value={field.value === 0 ? '' : field.value} onChange={(e)=> field.onChange(e.target.value === '' ? 0 : Number(e.target.value))} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name={`items.${index}.making`} render={({ field }) => (
                      <FormItem><FormLabel>Making Charges</FormLabel><FormControl><Input type="number" placeholder="Charges" value={field.value === 0 ? '' : field.value} onChange={(e)=> field.onChange(e.target.value === '' ? 0 : Number(e.target.value))} /></FormControl><FormMessage /></FormItem>
                    )} />
                                    </div>
                                    <div className="flex justify-between items-center pt-2 border-t">
                                        <span className="font-medium">Amount: {formatCurrency(itemTotal)}</span>
                                        <Button type="button" variant="ghost" size="icon" onClick={() => fields.length > 1 && remove(index)} disabled={fields.length <= 1}>
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </div>
                                </div>
                            )
                        })}
                    </div>


          <Button type="button" variant="outline" size="sm" className="mt-4" onClick={() => append({ id: uuidv4(), description: '', purity: '22', grossWeight: 0, netWeight: 0, rate: 0, making: 0 })}>
                        <PlusCircle className="mr-2 h-4 w-4" /> Add Item
                    </Button>

                    {stockItems && stockItems.length > 0 && (
                      <Dialog open={showStockDialog} onOpenChange={setShowStockDialog}>
                        <DialogTrigger asChild>
                          <Button type="button" variant="secondary" size="sm" className="mt-2 ml-2">
                            <ShoppingCart className="mr-2 h-4 w-4" /> From Stock
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Select Stock Item</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-2">
                            {stockLoading ? (
                              <p className="text-muted-foreground">Loading stock items...</p>
                            ) : stockItems.length === 0 ? (
                              <p className="text-muted-foreground">No stock items available</p>
                            ) : (
                              <div className="grid gap-3">
                                {stockItems.map((item) => (
                                  <div
                                    key={item.id}
                                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent cursor-pointer transition"
                                    onClick={() => handleAddStockItem(item)}
                                  >
                                    <div className="flex-1">
                                      <p className="font-medium">{item.name}</p>
                                      <p className="text-sm text-muted-foreground">
                                        Purity: {item.purity} | Unit: {item.unit} | Available: {item.quantity} | Making: ₹{item.makingChargePerGram.toFixed(2)}/unit
                                      </p>
                                    </div>
                                    <Button type="button" size="sm" variant="ghost">
                                      <PlusCircle className="h-4 w-4" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
                </CardContent>
            </Card>

          </div>

          <div className="lg:col-span-1 space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Invoice Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField control={form.control} name="invoiceDate" render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Invoice Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button variant="outline" className={cn('w-full pl-3 text-left font-normal', !field.value && 'text-muted-foreground')}>
                            {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="paid">Paid</SelectItem>
                          <SelectItem value="due">Due</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                 <div className="flex justify-between"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
                  <FormField control={form.control} name="discount" render={({ field }) => (
                      <FormItem>
                          <div className="flex items-center justify-between">
                              <FormLabel>Discount</FormLabel>
                              <FormControl><Input type="number" className="w-32 text-right" value={field.value === 0 ? '' : field.value} onChange={(e)=> field.onChange(e.target.value === '' ? 0 : Number(e.target.value))} /></FormControl>
                          </div>
                           <FormMessage />
                      </FormItem>
                  )} />
                  <div className="flex gap-4">
                    <FormField control={form.control} name="sgst" render={({ field }) => (
                        <FormItem className="flex-1">
                            <div className="flex items-center justify-between">
                              <FormLabel>SGST (%)</FormLabel>
                              <FormControl><Input type="number" className="w-20 text-right" value={field.value === 0 ? '' : field.value} onChange={(e)=> field.onChange(e.target.value === '' ? 0 : Number(e.target.value))} /></FormControl>
                            </div>
                            <FormMessage />
                        </FormItem>
                    )} />
                    <FormField control={form.control} name="cgst" render={({ field }) => (
                        <FormItem className="flex-1">
                            <div className="flex items-center justify-between">
                              <FormLabel>CGST (%)</FormLabel>
                              <FormControl><Input type="number" className="w-20 text-right" value={field.value === 0 ? '' : field.value} onChange={(e)=> field.onChange(e.target.value === '' ? 0 : Number(e.target.value))} /></FormControl>
                            </div>
                            <FormMessage />
                        </FormItem>
                    )} />
                  </div>
              </CardContent>
              <CardFooter className="flex justify-between font-bold text-lg bg-muted/50 py-4">
                <span>Grand Total</span>
                <span>{formatCurrency(grandTotal)}</span>
              </CardFooter>
            </Card>
            
            <Button type="submit" className="w-full" disabled={isPending || settingsLoading || !isShopSetupValid}>
              {(isPending || settingsLoading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {!isShopSetupValid ? 'Complete Shop Setup' : (invoice ? 'Update' : 'Create') + ' Invoice'}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}
