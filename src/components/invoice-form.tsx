'use client';

import { useState, useEffect, useTransition, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import {
  Loader2,
  Save,
  ArrowLeft,
  Users,
  Eye,
  FileText,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useUser } from '@/supabase/provider';
import { useActiveShop } from '@/hooks/use-active-shop';
import { updateInvoiceAction, createInvoiceAction } from '@/app/actions/invoice-actions';
import { CompactTotalsSummary } from '@/components/invoice/CompactTotalsSummary';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/supabase/client';
import type { Invoice } from '@/lib/definitions';
import type { LoyaltySettings } from '@/lib/loyalty-types';
import { cn, formatCurrency } from '@/lib/utils';
import { MotionWrapper } from '@/components/ui/motion-wrapper';
import dynamic from 'next/dynamic';

const LiveInvoicePreview = dynamic(() => import('@/components/invoice-preview').then(mod => mod.LiveInvoicePreview), {
  loading: () => <div className="h-full w-full flex items-center justify-center bg-slate-50 min-h-[400px]">Loading preview...</div>,
  ssr: false
});

// Sub-components
import { CustomerDetailsCard } from '@/components/invoice/customer-details-card';
import { InvoiceItemsTable } from '@/components/invoice/invoice-items-table';

// --- 1. Robust Schema Definition ---
const invoiceItemSchema = z.object({
  id: z.string().optional(),
  stockId: z.string().optional(),
  description: z.string().min(1, 'Description is required'),
  purity: z.string().default('22K'),
  grossWeight: z.coerce.number().min(0, 'Must be positive'),
  netWeight: z.coerce.number().min(0, 'Must be positive'),
  rate: z.coerce.number().min(0, 'Must be positive'),
  making: z.coerce.number().min(0, 'Must be positive'),
});

const invoiceSchema = z.object({
  customerName: z.string().min(1, 'Customer name is required'),
  customerAddress: z.string().optional(),
  customerState: z.string().optional(),
  customerPincode: z.string().optional(),
  customerPhone: z.string().optional(),
  customerEmail: z.preprocess(
    (val) => (val === null || val === undefined) ? '' : String(val),
    z.string().email().or(z.literal('')).optional()
  ),
  invoiceDate: z.date(),
  items: z.array(invoiceItemSchema).min(1, 'At least one item is required'),
  discount: z.coerce.number().min(0).default(0),
  status: z.enum(['paid', 'due']),
  redeemPoints: z.boolean().default(false),
  pointsToRedeem: z.coerce.number().min(0).default(0),
});

type InvoiceFormValues = z.infer<typeof invoiceSchema>;

interface InvoiceFormProps {
  invoice?: Invoice & { items?: any[] };
}

// --- 2. Main Component ---
export function InvoiceForm({ invoice }: InvoiceFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const { user } = useUser();
  const { activeShop, isLoading: shopLoading } = useActiveShop();

  // Local State
  const [settings, setSettings] = useState<any | null>(null);
  const [loyaltySettings, setLoyaltySettings] = useState<LoyaltySettings | null>(null);
  const [customerPoints, setCustomerPoints] = useState<number>(0);
  const [showPreview, setShowPreview] = useState(false);
  const [showMobileDetails, setShowMobileDetails] = useState(false);

  // --- 3. Form Initialization ---
  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      customerName: invoice?.customerSnapshot?.name || '',
      customerAddress: invoice?.customerSnapshot?.address || '',
      customerState: invoice?.customerSnapshot?.state || '',
      customerPincode: invoice?.customerSnapshot?.pincode || '',
      customerPhone: invoice?.customerSnapshot?.phone || '',
      customerEmail: invoice?.customerSnapshot?.email || '',
      invoiceDate: invoice?.invoiceDate ? new Date(invoice.invoiceDate) : new Date(),
      items: invoice?.items?.map((item: any) => ({
        id: item.id || crypto.randomUUID(),
        description: item.description,
        purity: item.purity || '22K',
        grossWeight: Number(item.grossWeight),
        netWeight: Number(item.netWeight),
        rate: Number(item.rate),
        making: Number(item.making),
      })) || [],
      discount: invoice?.discount || 0,
      status: (invoice?.status as 'paid' | 'due') || 'paid',
      redeemPoints: false,
      pointsToRedeem: 0,
    },
    mode: 'onChange',
  });

  // Watch values for calculations
  const watchedItems = useWatch({ control: form.control, name: 'items' });
  const watchedDiscount = useWatch({ control: form.control, name: 'discount' });
  const watchedRedeemPoints = useWatch({ control: form.control, name: 'redeemPoints' });
  const watchedPointsToRedeem = useWatch({ control: form.control, name: 'pointsToRedeem' });
  const watchedCustomerPhone = useWatch({ control: form.control, name: 'customerPhone' });

  // --- 4. Data Loading Effects ---
  useEffect(() => {
    if (!activeShop) return;

    const loadData = async () => {
      // Load Shop Settings
      setSettings({
        sgstRate: activeShop.sgstRate || 1.5,
        cgstRate: activeShop.cgstRate || 1.5,
      });

      // Load Loyalty Settings
      const { data: loyaltyData } = await supabase
        .from('shop_loyalty_settings')
        .select('*')
        .eq('shop_id', activeShop.id)
        .single();

      if (loyaltyData?.is_enabled) {
        setLoyaltySettings(loyaltyData);
      }
    };

    loadData();
  }, [activeShop]);

  // Fetch Customer Points
  useEffect(() => {
    if (!activeShop?.id || !watchedCustomerPhone || watchedCustomerPhone?.length < 10) {
      setCustomerPoints(0);
      return;
    }

    const fetchPoints = async () => {
      const { data } = await supabase
        .from('customers')
        .select('loyalty_points')
        .eq('shop_id', activeShop.id)
        .eq('phone', watchedCustomerPhone)
        .single();

      if (data) setCustomerPoints(data.loyalty_points || 0);
    };

    const timeout = setTimeout(fetchPoints, 500);
    return () => clearTimeout(timeout);
  }, [activeShop?.id, watchedCustomerPhone]);

  // --- 5. Calculations ---
  const totals = useMemo(() => {
    const subtotal = watchedItems?.reduce((acc, item) => {
      const netWeight = Number(item.netWeight) || 0;
      const rate = Number(item.rate) || 0;
      const making = Number(item.making) || 0;
      return acc + (netWeight * rate) + making;
    }, 0) || 0;

    let loyaltyDiscount = 0;
    if (watchedRedeemPoints && watchedPointsToRedeem && loyaltySettings) {
      loyaltyDiscount = watchedPointsToRedeem * loyaltySettings.redemption_conversion_rate;
    }

    const totalDiscount = (Number(watchedDiscount) || 0) + loyaltyDiscount;
    const taxableAmount = Math.max(0, subtotal - totalDiscount);

    const sgstRate = settings?.sgstRate || 1.5;
    const cgstRate = settings?.cgstRate || 1.5;

    const sgstAmount = taxableAmount * (sgstRate / 100);
    const cgstAmount = taxableAmount * (cgstRate / 100);
    const grandTotal = taxableAmount + sgstAmount + cgstAmount;

    // Points to Earn
    let pointsToEarn = 0;
    if (loyaltySettings?.earning_type === 'flat' && loyaltySettings.flat_points_ratio) {
      pointsToEarn = Math.floor(grandTotal * loyaltySettings.flat_points_ratio);
    } else if (loyaltySettings?.earning_type === 'percentage' && loyaltySettings.percentage_back) {
      pointsToEarn = Math.floor(grandTotal * (loyaltySettings.percentage_back / 100));
    }

    return {
      subtotal,
      loyaltyDiscount,
      totalDiscount,
      sgstAmount,
      cgstAmount,
      grandTotal,
      pointsToEarn
    };
  }, [watchedItems, watchedDiscount, watchedRedeemPoints, watchedPointsToRedeem, loyaltySettings, settings]);

  // --- 6. Submission Handler ---
  const onSubmit = async (data: InvoiceFormValues) => {
    if (!activeShop?.id || !user?.uid) {
      toast({ title: 'Error', description: 'Session missing', variant: 'destructive' });
      return;
    }

    startTransition(async () => {
      try {
        const payload = {
          shopId: activeShop.id,
          userId: user.uid,
          ...data,
          invoiceDate: data.invoiceDate,
          subtotal: totals.subtotal,
          sgstAmount: totals.sgstAmount,
          cgstAmount: totals.cgstAmount,
          grandTotal: totals.grandTotal,
          sgst: settings?.sgstRate || 1.5,
          cgst: settings?.cgstRate || 1.5,
          loyaltyPointsRedeemed: data.pointsToRedeem,
          loyaltyDiscountAmount: totals.loyaltyDiscount,
          items: data.items.map(item => ({
            ...item,
            id: item.id || crypto.randomUUID()
          }))
        };

        let result;
        if (invoice) {
          result = await updateInvoiceAction(invoice.id, activeShop.id, payload);
          if (!result.success) throw new Error(result.error);
          toast({ title: 'Success', description: 'Invoice updated' });
        } else {
          result = await createInvoiceAction(payload);
          if (!result.success) throw new Error(result.error);
          toast({ title: 'Success', description: 'Invoice created' });
        }

        if (result.success) {
          router.push(`/shop/${activeShop.id}/invoices`);
        }
      } catch (error: any) {
        console.error('Submit Error:', error);
        toast({
          title: 'Error',
          description: error.message || 'Failed to save invoice',
          variant: 'destructive'
        });
      }
    });
  };

  if (shopLoading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin" /></div>;

  return (
    <MotionWrapper className="lg:h-auto lg:block flex flex-col h-full overflow-hidden">

      {/* 1. Fixed Header (Mobile) / Regular Header (Desktop) */}
      <div className="flex-none p-4 py-3 bg-background border-b z-20 sticky top-0 lg:static lg:p-0 lg:border-none lg:mb-4 lg:bg-transparent">
        <div className="container mx-auto px-4 lg:px-0 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-2 -ml-2 pl-0 hover:bg-transparent lg:hover:bg-accent lg:pl-4">
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowPreview(true)} className="gap-2 lg:hidden">
            <Eye className="h-4 w-4" /> Preview
          </Button>
        </div>
      </div>

      <div className="flex-1 lg:flex-none flex flex-col lg:block overflow-hidden lg:overflow-visible container mx-auto px-0 lg:px-4">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr,400px] gap-6 h-full lg:h-auto">

          {/* LEFT COLUMN: FORM */}
          <div className="flex-1 flex flex-col h-full lg:h-auto overflow-hidden lg:block lg:overflow-visible">
            <Form {...form}>
              <form
                id="invoice-form"
                onSubmit={form.handleSubmit(onSubmit)}
                className="flex flex-col h-full lg:block lg:space-y-4"
              >

                {/* Scrollable Content Area (Mobile) */}
                <div className="flex-1 overflow-y-auto px-4 py-4 lg:p-0 space-y-4 pb-0 custom-scrollbar">

                  {/* 1. Customer Details */}
                  <CustomerDetailsCard
                    form={form}
                    shopId={activeShop?.id || ''}
                    disabled={isPending}
                  />

                  {/* 2. Invoice Details */}
                  <Card className="border-2 shadow-sm relative z-10">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <FileText className="h-5 w-5 text-primary" /> Invoice Details
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="invoiceDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Date</FormLabel>
                            <FormControl>
                              <Input
                                type="date"
                                value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''}
                                onChange={(e) => field.onChange(new Date(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="status"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Status</FormLabel>
                            <div className="flex gap-2 p-1 bg-muted rounded-lg border">
                              {['paid', 'due'].map((status) => (
                                <Button
                                  key={status}
                                  type="button"
                                  variant={field.value === status ? 'default' : 'ghost'}
                                  className={cn("flex-1 capitalize", field.value === status && (status === 'paid' ? "bg-emerald-600" : "bg-amber-600"))}
                                  onClick={() => field.onChange(status)}
                                >
                                  {status}
                                </Button>
                              ))}
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>

                  {/* 3. Items Table */}
                  <InvoiceItemsTable form={form} shopId={activeShop?.id} />

                  {/* 4. Loyalty Section */}
                  {loyaltySettings && watchedCustomerPhone && watchedCustomerPhone.length >= 10 && (
                    <Card className="border-2 border-purple-500/20 bg-purple-50/50">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-purple-700 flex items-center gap-2">
                          <Users className="h-4 w-4" /> Loyalty Program
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex justify-between items-center mb-4">
                          <div>
                            <p className="text-sm text-muted-foreground">Available Points</p>
                            <p className="text-2xl font-bold text-purple-700">{customerPoints}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">Points to Earn</p>
                            <p className="text-xl font-bold text-emerald-600 flex items-center justify-end gap-1">
                              +{totals.pointsToEarn} <span className="text-xs font-normal text-muted-foreground">pts</span>
                            </p>
                          </div>
                        </div>

                        <FormField
                          control={form.control}
                          name="redeemPoints"
                          render={({ field }) => (
                            <FormItem className="flex items-center justify-between border p-3 rounded-lg bg-background">
                              <FormLabel className="cursor-pointer">Redeem Points</FormLabel>
                              <FormControl>
                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        {watchedRedeemPoints && (
                          <div className="mt-4 animate-in slide-in-from-top-2">
                            <FormField
                              control={form.control}
                              name="pointsToRedeem"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Points to Redeem (Max: {customerPoints})</FormLabel>
                                  <div className="flex gap-2">
                                    <FormControl>
                                      <Input
                                        type="number"
                                        max={customerPoints}
                                        {...field}
                                        onChange={e => field.onChange(Number(e.target.value))}
                                      />
                                    </FormControl>
                                    <div className="flex items-center px-3 bg-muted rounded-md min-w-[100px] justify-center font-bold text-emerald-600">
                                      - {formatCurrency(totals.loyaltyDiscount)}
                                    </div>
                                  </div>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {/* Padding for content hidden behind footer on mobile */}
                  <div className="h-4 lg:hidden" />
                </div>

                {/* Mobile Fixed Footer */}
                <div className="flex-none lg:hidden border-t bg-background p-4 shadow-[0_-4px_10px_rgba(0,0,0,0.05)] z-20">
                  <div className="space-y-3">

                    {/* Expandable Details */}
                    {showMobileDetails && (
                      <div className="space-y-1 text-sm pb-2 animate-in slide-in-from-bottom-2">
                        <div className="flex justify-between text-muted-foreground">
                          <span>Subtotal</span>
                          <span>{formatCurrency(totals.subtotal)}</span>
                        </div>
                        {totals.totalDiscount > 0 && (
                          <div className="flex justify-between text-emerald-600">
                            <span>Discount</span>
                            <span>-{formatCurrency(totals.totalDiscount)}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-muted-foreground">
                          <span>SGST ({settings?.sgstRate || 1.5}%)</span>
                          <span>{formatCurrency(totals.sgstAmount)}</span>
                        </div>
                        <div className="flex justify-between text-muted-foreground">
                          <span>CGST ({settings?.cgstRate || 1.5}%)</span>
                          <span>{formatCurrency(totals.cgstAmount)}</span>
                        </div>
                      </div>
                    )}

                    <div className="space-y-1 text-sm">
                      {!showMobileDetails && (
                        <div className="flex justify-between text-muted-foreground text-xs">
                          <span>Items ({watchedItems.length})</span>
                          <span>{formatCurrency(totals.subtotal)}</span>
                        </div>
                      )}

                      <div
                        className="flex justify-between items-center font-bold text-lg cursor-pointer select-none"
                        onClick={() => setShowMobileDetails(!showMobileDetails)}
                      >
                        <div className="flex items-center gap-2">
                          <span>Total Payable</span>
                          {showMobileDetails ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronUp className="h-4 w-4 text-muted-foreground" />}
                        </div>
                        <span>{formatCurrency(totals.grandTotal)}</span>
                      </div>
                    </div>

                    <Button type="submit" className="w-full h-11 text-base shadow-sm font-semibold" disabled={isPending}>
                      {isPending ? <Loader2 className="animate-spin" /> : <><Save className="mr-2 h-4 w-4" /> Save Invoice</>}
                    </Button>
                  </div>
                </div>

              </form>
            </Form>
          </div>

          {/* RIGHT COLUMN: SUMMARY (Desktop) */}
          <div className="hidden lg:block space-y-6 sticky top-10 self-start">
            <CompactTotalsSummary
              subtotal={totals.subtotal}
              discount={Number(watchedDiscount) || 0}
              loyaltyDiscount={totals.loyaltyDiscount}
              sgstAmount={totals.sgstAmount}
              cgstAmount={totals.cgstAmount}
              grandTotal={totals.grandTotal}
              sgstRate={settings?.sgstRate || 1.5}
              cgstRate={settings?.cgstRate || 1.5}
              onDiscountChange={(val) => form.setValue('discount', val)}
            />
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => router.back()} className="flex-1 h-12">Cancel</Button>
              <Button onClick={form.handleSubmit(onSubmit)} disabled={isPending} className="flex-1 h-12 shadow-lg">
                {isPending ? <Loader2 className="animate-spin" /> : 'Save Invoice'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {showPreview && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-background w-full max-w-4xl h-[90vh] rounded-xl border shadow-2xl overflow-hidden flex flex-col">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="font-bold">Invoice Preview</h2>
              <Button variant="ghost" size="sm" onClick={() => setShowPreview(false)}>Close</Button>
            </div>
            <div className="flex-1 overflow-auto p-6 bg-slate-50">
              <LiveInvoicePreview data={{ ...form.getValues(), ...totals, invoiceNumber: 'PREVIEW' } as any} settings={settings} />
            </div>
          </div>
        </div>
      )}
    </MotionWrapper>
  );
}
