'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useFieldArray, useForm } from 'react-hook-form';
import { z } from 'zod';
import { format } from 'date-fns';
import { CalendarIcon, Loader2, PlusCircle, Trash2, ArrowLeft, ShoppingCart, AlertCircle, Search, Eye, EyeOff } from 'lucide-react';
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
import type { Invoice, InvoiceItem, StockItem, UserSettings } from '@/lib/definitions';
import { cn, formatCurrency } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useUser } from '@/supabase/provider';
import { supabase } from '@/supabase/client';
import { useStockItems } from '@/hooks/use-stock-items';
import { isShopSetupComplete } from '@/lib/shop-setup';
import { MotionWrapper, FadeIn } from '@/components/ui/motion-wrapper';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { LiveInvoicePreview } from '@/components/invoice-preview';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { haptics } from '@/lib/haptics';
import { NotificationType } from '@capacitor/haptics';


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
  const { user } = useUser();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [showPreview, setShowPreview] = useState(false); // Mobile toggle
  const [stockSearchTerm, setStockSearchTerm] = useState('');

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
      items: invoice.items.map(item => ({ ...item, purity: item.purity as InvoiceFormValues['items'][number]['purity'] })),
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

  const { items: stockItems, isLoading: stockLoading } = useStockItems(user?.uid);
  const [showStockDialog, setShowStockDialog] = useState(false);

  useEffect(() => {
    if (settings && !invoice) {
      form.setValue('sgst', settings.sgstRate ?? 1.5);
      form.setValue('cgst', settings.cgstRate ?? 1.5);
    }
  }, [settings, invoice, form]);

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  const handleAddStockItem = (stockItem: StockItem) => {
    append({
      id: uuidv4(),
      description: stockItem.name,
      purity: stockItem.purity as any,
      grossWeight: stockItem.baseWeight || 0,
      netWeight: stockItem.baseWeight || 0,
      rate: 0,
      making: stockItem.makingChargePerGram || 0,
    });
    setShowStockDialog(false);
    toast({
      title: "Item Added",
      description: `${stockItem.name} added to invoice.`,
    });
  };

  const watchedValues = form.watch();
  const { subtotal, grandTotal } = calculateTotals(watchedValues.items, watchedValues.discount, watchedValues.sgst, watchedValues.cgst);

  const filteredStockItems = stockItems.filter(item =>
    item.name.toLowerCase().includes(stockSearchTerm.toLowerCase()) ||
    item.purity.includes(stockSearchTerm)
  );

  async function onSubmit(data: InvoiceFormValues) {
    if (!user) {
      toast({ variant: 'destructive', title: 'Authentication Error', description: 'You must be logged in to save an invoice.' });
      return;
    }

    startTransition(async () => {
      try {
        const { items, ...invoiceMainData } = data;
        const { grandTotal: finalGrandTotal } = calculateTotals(items, data.discount, data.sgst, data.cgst);

        if (invoice) {
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

        haptics.notification(NotificationType.Success);
        toast({
          title: `Invoice ${invoice ? 'updated' : 'created'} successfully!`,
          description: `Redirecting to view invoice...`,
        });

        router.push(`/dashboard/invoices/view?id=${invoiceIdToNavigate}`);

      } catch (error) {
        console.error("Failed to save invoice:", error);
        haptics.notification(NotificationType.Error);
        toast({
          variant: 'destructive',
          title: 'An error occurred',
          description: 'Failed to save the invoice. Please try again.',
        });
      }
    });
  }
  const isShopSetupValid = isShopSetupComplete(settings);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="h-full">
        <div className="lg:grid lg:grid-cols-12 lg:gap-8 h-full">
          {/* Left Column: Form Inputs */}
          <div className="lg:col-span-7 flex flex-col gap-6 h-full overflow-y-auto pb-20 lg:pb-0 no-scrollbar">
            <MotionWrapper className="space-y-6">
              {/* Header Actions */}
              <div className="flex items-center justify-between">
                <Button type="button" variant="ghost" onClick={() => router.back()} className="gap-2 hover:bg-white/5">
                  <ArrowLeft className="h-4 w-4" /> Back
                </Button>
                <div className="flex items-center gap-2 lg:hidden">
                  <Button type="button" variant="outline" size="sm" onClick={() => setShowPreview(!showPreview)} className="bg-white/5 border-white/10 hover:bg-white/10">
                    {showPreview ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                    {showPreview ? 'Hide Preview' : 'Show Preview'}
                  </Button>
                </div>
              </div>

              {/* Shop Setup Warning */}
              {!isShopSetupValid && !settingsLoading && (
                <FadeIn>
                  <Alert className="border-amber-500/60 bg-amber-50 text-amber-800">
                    <AlertCircle className="h-4 w-4 text-amber-600" />
                    <AlertTitle className="text-amber-700 font-semibold">Finish Shop Setup</AlertTitle>
                    <AlertDescription className="text-amber-700/80 text-sm">
                      Complete your shop address & tax details to enable invoice creation.
                      <Button type="button" variant="link" className="ml-2 p-0 text-amber-700 hover:text-amber-600 font-medium" onClick={() => router.push('/dashboard/settings')}>
                        Go to Settings →
                      </Button>
                    </AlertDescription>
                  </Alert>
                </FadeIn>
              )}

              {/* Mobile Preview (if toggled) */}
              {showPreview && (
                <div className="lg:hidden mb-6">
                  <LiveInvoicePreview data={watchedValues} settings={settings} />
                </div>
              )}

              {/* Customer Details */}
              <Card className="glass-card border-t-4 border-t-primary">
                <CardHeader>
                  <CardTitle className="text-lg font-heading text-primary">Customer Details</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                  <FormField control={form.control} name="customerName" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Customer Name</FormLabel>
                      <FormControl><Input placeholder="John Doe" {...field} className="bg-background/50" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="customerPhone" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl><Input placeholder="+91 98765 43210" {...field} className="bg-background/50" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="customerAddress" render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel>Address</FormLabel>
                      <FormControl><Textarea placeholder="Full address" {...field} className="bg-background/50 min-h-[80px]" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="customerState" render={({ field }) => (
                    <FormItem>
                      <FormLabel>State (Optional)</FormLabel>
                      <FormControl><Input placeholder="State" {...field} className="bg-background/50" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="customerPincode" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pincode (Optional)</FormLabel>
                      <FormControl><Input placeholder="Pincode" {...field} className="bg-background/50" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="invoiceDate" render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Invoice Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal bg-background/50", !field.value && "text-muted-foreground")}>
                              {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) => date > new Date() || date < new Date("1900-01-01")} initialFocus />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )} />
                </CardContent>
              </Card>

              {/* Items List */}
              <Card className="glass-card border-t-4 border-t-primary">
                <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <CardTitle className="text-lg font-heading text-primary">Invoice Items</CardTitle>
                  <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                    <Button type="button" variant="outline" size="sm" onClick={() => setShowStockDialog(true)} className="bg-white/5 border-white/10 hover:bg-white/10 flex-1 sm:flex-none">
                      <Search className="h-4 w-4 mr-2" /> Add from Stock
                    </Button>
                    <Button type="button" variant="secondary" size="sm" onClick={() => append({ id: uuidv4(), description: '', purity: '22', grossWeight: '' as any, netWeight: '' as any, rate: '' as any, making: '' as any })} className="flex-1 sm:flex-none">
                      <PlusCircle className="h-4 w-4 mr-2" /> Add Manual
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {fields.map((field, index) => (
                      <div key={field.id} className="p-4 rounded-lg border border-white/10 bg-white/5 space-y-4 relative group">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute top-2 right-2 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => remove(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>

                        <div className="grid gap-4 sm:grid-cols-12">
                          <div className="sm:col-span-4">
                            <FormField control={form.control} name={`items.${index}.description`} render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs">Description</FormLabel>
                                <FormControl><Input {...field} className="h-9 bg-background/50" placeholder="Item name" /></FormControl>
                                <FormMessage />
                              </FormItem>
                            )} />
                          </div>
                          <div className="sm:col-span-2">
                            <FormField control={form.control} name={`items.${index}.purity`} render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs">Purity</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger className="h-9 bg-background/50">
                                      <SelectValue placeholder="Select" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {["10", "12", "14", "18", "20", "22", "24"].map(p => (
                                      <SelectItem key={p} value={p}>{p}K</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )} />
                          </div>
                          <div className="sm:col-span-2">
                            <FormField control={form.control} name={`items.${index}.grossWeight`} render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs">Gross Wt (g)</FormLabel>
                                <FormControl><Input type="number" {...field} className="h-9 bg-background/50" onChange={e => field.onChange(Number(e.target.value))} /></FormControl>
                                <FormMessage />
                              </FormItem>
                            )} />
                          </div>
                          <div className="sm:col-span-2">
                            <FormField control={form.control} name={`items.${index}.netWeight`} render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs">Net Wt (g)</FormLabel>
                                <FormControl><Input type="number" {...field} className="h-9 bg-background/50" onChange={e => field.onChange(Number(e.target.value))} /></FormControl>
                                <FormMessage />
                              </FormItem>
                            )} />
                          </div>
                          <div className="sm:col-span-2">
                            <FormField control={form.control} name={`items.${index}.rate`} render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs">Rate (₹)</FormLabel>
                                <FormControl><Input type="number" {...field} className="h-9 bg-background/50" onChange={e => field.onChange(Number(e.target.value))} /></FormControl>
                                <FormMessage />
                              </FormItem>
                            )} />
                          </div>
                          <div className="sm:col-span-2">
                            <FormField control={form.control} name={`items.${index}.making`} render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs">Making (₹)</FormLabel>
                                <FormControl><Input type="number" {...field} className="h-9 bg-background/50" onChange={e => field.onChange(Number(e.target.value))} /></FormControl>
                                <FormMessage />
                              </FormItem>
                            )} />
                          </div>
                        </div>
                      </div>
                    ))}
                    {fields.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground border border-dashed border-white/10 rounded-lg">
                        No items added. Add items manually or from stock.
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Summary & Actions */}
              <Card className="glass-card border-t-4 border-t-primary mb-20 lg:mb-0">
                <CardHeader><CardTitle className="text-lg font-heading text-primary">Summary</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between text-sm"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
                  <FormField control={form.control} name="discount" render={({ field }) => (
                    <FormItem className="flex items-center justify-between space-y-0 gap-4">
                      <FormLabel className="whitespace-nowrap">Discount</FormLabel>
                      <FormControl><Input type="number" className="w-24 text-right h-8 bg-background/50" {...field} onChange={e => field.onChange(Number(e.target.value))} /></FormControl>
                    </FormItem>
                  )} />
                  <div className="flex gap-4">
                    <FormField control={form.control} name="sgst" render={({ field }) => (
                      <FormItem className="flex-1 flex items-center justify-between space-y-0 gap-2">
                        <FormLabel className="whitespace-nowrap text-xs">SGST %</FormLabel>
                        <FormControl><Input type="number" className="w-16 text-right h-8 bg-background/50" {...field} onChange={e => field.onChange(Number(e.target.value))} /></FormControl>
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="cgst" render={({ field }) => (
                      <FormItem className="flex-1 flex items-center justify-between space-y-0 gap-2">
                        <FormLabel className="whitespace-nowrap text-xs">CGST %</FormLabel>
                        <FormControl><Input type="number" className="w-16 text-right h-8 bg-background/50" {...field} onChange={e => field.onChange(Number(e.target.value))} /></FormControl>
                      </FormItem>
                    )} />
                  </div>
                  <Separator className="bg-white/10" />
                  <div className="flex justify-between font-bold text-lg text-primary">
                    <span>Grand Total</span>
                    <span>{formatCurrency(grandTotal)}</span>
                  </div>

                  <Button type="submit" variant="premium" className="w-full h-12 text-lg shadow-lg mt-4" disabled={isPending || settingsLoading || !isShopSetupValid}>
                    {(isPending || settingsLoading) && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                    {!isShopSetupValid ? 'Setup Required' : (invoice ? 'Update Invoice' : 'Create Invoice')}
                  </Button>
                </CardContent>
              </Card>
            </MotionWrapper>
          </div>

          {/* Right Column: Live Preview (Desktop) */}
          <div className="hidden lg:block lg:col-span-5 h-full sticky top-6">
            <LiveInvoicePreview data={watchedValues} settings={settings} />
          </div>
        </div>

        {/* Stock Search Dialog */}
        <Dialog open={showStockDialog} onOpenChange={setShowStockDialog}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-heading text-primary">Select Stock Item</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search stock..."
                  className="pl-10 bg-background/50"
                  value={stockSearchTerm}
                  onChange={(e) => setStockSearchTerm(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filteredStockItems.map(item => (
                  <div key={item.id} className="p-4 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 cursor-pointer transition-colors flex justify-between items-center group" onClick={() => handleAddStockItem(item)}>
                    <div>
                      <div className="font-medium text-primary">{item.name}</div>
                      <div className="text-xs text-muted-foreground">{item.purity} • {item.baseWeight}g</div>
                    </div>
                    <Button size="sm" variant="ghost" className="opacity-0 group-hover:opacity-100">Add</Button>
                  </div>
                ))}
                {filteredStockItems.length === 0 && (
                  <div className="col-span-full text-center py-8 text-muted-foreground">
                    No items found.
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </form>
    </Form>
  );
}
