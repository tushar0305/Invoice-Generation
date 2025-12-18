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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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
import { useInvoiceCalculations } from '@/hooks/use-invoice-calculations';
import dynamic from 'next/dynamic';

const LiveInvoicePreview = dynamic(() => import('@/components/invoice-preview').then(mod => mod.LiveInvoicePreview), {
  loading: () => <div className="h-full w-full flex items-center justify-center bg-slate-50 min-h-[400px]">Loading preview...</div>,
  ssr: false
});

// Sub-components
import { CustomerDetailsCard } from '@/components/invoice/customer-details-card';
import { InvoiceItemsTable } from '@/components/invoice/invoice-items-table';
import { MultiQRScanner } from '@/components/inventory/multi-qr-scanner';
import { QrCode } from 'lucide-react';

// --- 1. Robust Schema Definition ---
const invoiceItemSchema = z.object({
  id: z.string().optional(),
  stockId: z.string().optional(),
  description: z.string().min(1, 'Description is required'),
  hsnCode: z.string().optional(),
  metalType: z.string().optional(),
  category: z.string().optional(),
  purity: z.string().default('22K'),

  // Weights (Standardized to numeric)
  grossWeight: z.coerce.number().min(0, 'Must be positive'),
  stoneWeight: z.coerce.number().min(0).default(0),
  netWeight: z.coerce.number().min(0, 'Must be positive'),
  wastagePercent: z.coerce.number().min(0).default(0),

  // Value Components
  rate: z.coerce.number().min(0, 'Must be positive'),
  makingRate: z.coerce.number().min(0).default(0), // Per gram
  making: z.number().default(0), // Legacy (calculated or fixed total)
  stoneAmount: z.coerce.number().min(0).default(0),
  tagId: z.string().optional(),
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
  // Global current rate (₹/g) to apply when item rate is not set
  currentRate: z.coerce.number().min(0).default(0),
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
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false); // UX-001: Confirmation modal



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
        hsnCode: item.hsnCode || '',

        grossWeight: Number(item.grossWeight),
        stoneWeight: Number(item.stoneWeight || 0),
        netWeight: Number(item.netWeight),
        wastagePercent: Number(item.wastagePercent || 0),

        rate: Number(item.rate),
        makingRate: Number(item.makingRate || item.making || 0), // Use 'making' as fallback for rate if needed, or total if legacy
        making: Number(item.making || 0),
        stoneAmount: Number(item.stoneAmount || 0),
      })) || [],
      currentRate: 0,
      discount: invoice?.discount || 0,
      status: (invoice?.status as 'paid' | 'due') || 'paid',
      redeemPoints: false,
      pointsToRedeem: 0,
    },
    mode: 'onChange',
  });

  // --- UX-006: Offline Drafts ---
  const DRAFT_KEY = useMemo(() => activeShop ? `INVOICE_DRAFT_${activeShop.id}` : null, [activeShop]);

  // Save draft on form change
  useEffect(() => {
    if (!DRAFT_KEY || invoice) return; // Don't save drafts for edit mode

    const subscription = form.watch((value) => {
      // Debounce save to avoid performance hit
      const handler = setTimeout(() => {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(value));
      }, 1000);
      return () => clearTimeout(handler);
    });
    return () => subscription.unsubscribe();
  }, [form, DRAFT_KEY, invoice]);

  // Restore draft on mount
  useEffect(() => {
    if (!DRAFT_KEY || invoice) return; // Don't restore for edit mode

    const saved = localStorage.getItem(DRAFT_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Check if draft has meaningful data (e.g. items or customer)
        if (parsed.items?.length > 0 || parsed.customerName) {
          form.reset(parsed);
          toast({
            title: "Draft Restored",
            description: "We restored your unsaved invoice.",
            duration: 3000
          });
        }
      } catch (e) {
        console.error("Failed to parse draft", e);
      }
    }
  }, [DRAFT_KEY, invoice, form, toast]);

  // Watch values for calculations
  const watchedItems = useWatch({ control: form.control, name: 'items' });
  const watchedDiscount = useWatch({ control: form.control, name: 'discount' });
  const watchedRedeemPoints = useWatch({ control: form.control, name: 'redeemPoints' });
  const watchedPointsToRedeem = useWatch({ control: form.control, name: 'pointsToRedeem' });
  const watchedCustomerPhone = useWatch({ control: form.control, name: 'customerPhone' });
  const watchedCurrentRate = useWatch({ control: form.control, name: 'currentRate' });

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
  const totals = useInvoiceCalculations({
    items: watchedItems as any[],
    discount: watchedDiscount,
    redeemPoints: watchedRedeemPoints,
    pointsToRedeem: watchedPointsToRedeem,
    loyaltySettings,
    sgstRate: settings?.sgstRate || 1.5,
    cgstRate: settings?.cgstRate || 1.5,
    currentRate: watchedCurrentRate
  });

  // --- 5.5. QR Scanner Handler ---
  const handleItemsFromQR = (items: any[]) => {
    items.forEach(item => {
      form.setValue(`items.${watchedItems.length}`, {
        description: item.name,
        metalType: item.metal_type,
        purity: item.purity || '22K',
        hsnCode: item.hsn_code || '',
        category: item.category || '',
        grossWeight: item.gross_weight || 0,
        netWeight: item.net_weight || 0,
        stoneWeight: item.stone_weight || 0,
        wastagePercent: item.wastage_percent || 0,
        makingRate: item.making_charge_value || 0,
        making: 0,
        rate: 0,
        stoneAmount: item.stone_value || 0,
        stockId: item.id,
        tagId: item.tag_id,
      });
    });

    // UX-004: Haptic feedback on successful scan
    if ('vibrate' in navigator) {
      navigator.vibrate([50, 30, 50]); // Short success pattern
    }

    toast({
      title: '✓ Items Added',
      description: `Added ${items.length} item${items.length > 1 ? 's' : ''} from QR scan`,
    });
  };

  const getExistingTagIds = () => {
    return watchedItems
      ?.map((item: any) => item.stockId)
      .filter(Boolean) || [];
  };

  // --- 6. Submission Handler ---
  const handleConfirmSubmit = () => {
    setShowConfirmation(false);
    form.handleSubmit(onSubmit)();
  };

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
          items: data.items.map(item => {
            // FIX: Ensure making amount is sent if not explicitly set (Legacy/Simple Mode)
            // If item.making is 0 but we have a makingRate, calculate it.
            const makingRate = Number(item.makingRate) || 0;
            const netWeight = Number(item.netWeight) || 0;
            const calculatedMaking = makingRate * netWeight;

            return {
              ...item,
              id: item.id || crypto.randomUUID(),
              // Use explicit 'making' if > 0, else use calculated. 
              // This fixes the bug where 'rate' based making was ignored by backend.
              making: Number(item.making) > 0 ? Number(item.making) : calculatedMaking,
              total: (netWeight * Number(item.rate)) + (Number(item.making) > 0 ? Number(item.making) : calculatedMaking) + (Number(item.stoneAmount) || 0)
            };
          })
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
          // Clear draft on success
          if (DRAFT_KEY) localStorage.removeItem(DRAFT_KEY);
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
    <MotionWrapper className="min-h-screen flex flex-col lg:block">

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

      <div className="flex-1 flex flex-col lg:flex-none lg:block">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr,400px] gap-6">

          {/* LEFT COLUMN: FORM */}
          <div className="flex flex-col">
            <Form {...form}>
              <form
                id="invoice-form"
                onSubmit={form.handleSubmit(onSubmit)}
                className="flex flex-col"
              >

                {/* Scrollable Content Area */}
                <div className="px-4 py-4 lg:p-0 space-y-4 lg:space-y-4">

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
                                className="w-auto"
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
                      {/* Global Current Rate (₹/g) */}
                    </CardContent>
                  </Card>

                  {/* 3. Items Summary Preview */}
                  {watchedItems.length > 0 && (
                    <Card className="border-2 shadow-sm bg-blue-50/50 border-blue-200">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                          <FileText className="h-4 w-4 text-blue-600" /> Items Added ({watchedItems.length})
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                          {watchedItems.map((item, idx) => (
                            <div key={idx} className="p-3 bg-white rounded-lg border-l-4 border-blue-400">
                              <div className="flex justify-between items-start gap-2">
                                <div className="flex-1 min-w-0">
                                  <p className="font-semibold text-sm truncate">{item.description || `Item ${idx + 1}`}</p>
                                  <p className="text-xs text-muted-foreground">{item.purity} | {item.metalType || 'Metal'}</p>
                                </div>
                                <div className="text-right text-sm">
                                  <p className="font-semibold">{Number(item.netWeight).toFixed(2)}g</p>
                                  <p className="text-xs text-muted-foreground">@₹{Number(item.rate).toFixed(0)}/g</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}


                  {/* 4. Items Table with Scan Option */}
                  <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsScannerOpen(true)}
                        className="gap-2 w-full sm:w-auto"
                      >
                        <QrCode className="h-4 w-4" />
                        Scan QR Codes
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        className="w-full sm:w-auto"
                        onClick={() => {
                          const items = form.getValues('items') || [];
                          const rate = Number(form.getValues('currentRate')) || 0;
                          items.forEach((_: any, idx: number) => form.setValue(`items.${idx}.rate`, rate));
                        }}
                      >
                        Apply Current Rate to All Items
                      </Button>
                    </div>
                    <InvoiceItemsTable form={form} shopId={activeShop?.id} />
                  </div>

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

                    <Button
                      type="button"
                      onClick={() => setShowConfirmation(true)}
                      className="w-full h-11 text-base shadow-sm font-semibold"
                      disabled={isPending || watchedItems.length === 0}
                    >
                      {isPending ? <Loader2 className="animate-spin" /> : <><Save className="mr-2 h-4 w-4" /> Save Invoice</>}
                    </Button>
                  </div>
                </div>

              </form>
            </Form>
          </div>

          {/* RIGHT COLUMN: SUMMARY (Desktop) */}
          <div className="hidden lg:flex flex-col space-y-6 sticky top-0 h-fit">
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
              <Button
                onClick={() => setShowConfirmation(true)}
                disabled={isPending || watchedItems.length === 0}
                className="flex-1 h-12 shadow-lg"
              >
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

      {/* Multi-QR Scanner */}
      <MultiQRScanner
        shopId={activeShop?.id || ''}
        onItemsAdded={handleItemsFromQR}
        existingTagIds={getExistingTagIds()}
        isOpen={isScannerOpen}
        onOpenChange={setIsScannerOpen}
      />

      {/* UX-001: Invoice Confirmation Modal */}
      <AlertDialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Invoice</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>You are about to create an invoice with the following details:</p>
              <div className="bg-muted p-3 rounded-lg text-sm space-y-1 mt-2">
                <p><strong>Customer:</strong> {form.getValues('customerName') || 'Walk-in'}</p>
                <p><strong>Items:</strong> {watchedItems.length} item(s)</p>
                <p><strong>Total:</strong> {formatCurrency(totals.grandTotal)}</p>
                <p><strong>Status:</strong> <span className={form.getValues('status') === 'paid' ? 'text-emerald-600' : 'text-amber-600'}>{form.getValues('status')?.toUpperCase()}</span></p>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                This action will create an official invoice and update inventory records.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Review Again</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmSubmit}>
              Confirm & Save
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MotionWrapper>
  );
}
