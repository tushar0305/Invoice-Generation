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
  Clock,
  PlayCircle,
  Trash2,
  PauseCircle,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useUser } from '@/supabase/provider';
import { useActiveShop } from '@/hooks/use-active-shop';
import { updateInvoiceAction, createInvoiceAction } from '@/app/actions/invoice-actions';
import { CompactTotalsSummary } from '@/components/invoice/CompactTotalsSummary';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/supabase/client';
import type { Invoice, InvoiceItem } from '@/lib/definitions';
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
import { InvoiceSchema, type InvoiceFormValues } from '@/lib/validation';

// --- 1. Robust Schema Definition ---
// Imported from @/lib/validation



interface InvoiceFormProps {
  invoice?: Invoice & { items?: InvoiceItem[] };
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
  const [showClearConfirmation, setShowClearConfirmation] = useState(false);

  // --- UX-NEW: Parked/Hold Invoices ---
  type ParkedInvoice = {
    id: string;
    timestamp: number;
    customerName: string;
    amount: number;
    itemCount: number;
    data: InvoiceFormValues;
  };
  const [parkedInvoices, setParkedInvoices] = useState<ParkedInvoice[]>([]);
  const [isParkedListOpen, setIsParkedListOpen] = useState(false);

  // Load Parked Invoices
  useEffect(() => {
    if (!activeShop?.id) return;
    const key = `PARKED_INVOICES_${activeShop.id}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        setParkedInvoices(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse parked invoices", e);
      }
    }
  }, [activeShop?.id]);

  // Park Current Invoice
  const handleParkInvoice = () => {
    const values = form.getValues();
    // specific validation for parking: at least one item or customer name
    if (values.items.length === 0 && !values.customerName) {
      toast({ title: "Cannot Hold", description: "Enter some details first", variant: "destructive" });
      return;
    }

    const parked: ParkedInvoice = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      customerName: values.customerName || 'Walk-in Customer',
      amount: totals.grandTotal, // We need to capture accurate total
      itemCount: values.items.length,
      data: values
    };

    const newParked = [parked, ...parkedInvoices];
    setParkedInvoices(newParked);
    localStorage.setItem(`PARKED_INVOICES_${activeShop?.id}`, JSON.stringify(newParked));

    // Clear current form
    form.reset({
      customerName: '',
      customerAddress: '',
      customerPhone: '',
      customerEmail: '',
      items: [],
      discount: 0,
      redeemPoints: false,
      pointsToRedeem: 0,
    });
    // Ensure invoice date is reset to avoid stale dates
    form.setValue('invoiceDate', new Date());

    // Clear Draft
    if (DRAFT_KEY) localStorage.removeItem(DRAFT_KEY);

    toast({ title: "Invoice Held", description: "Invoice parked successfully. You can restore it later." });
  };

  const handleRestoreParked = (invoice: ParkedInvoice) => {
    // Check if current form is dirty and has data?
    // For now, just restore. Ideally prompts if overwriting data.

    // Fix dates (JSON serialization breaks Date objects)
    const restoreData = {
      ...invoice.data,
      invoiceDate: new Date(invoice.data.invoiceDate)
    };

    form.reset(restoreData);

    // Remove from parked
    const newParked = parkedInvoices.filter(p => p.id !== invoice.id);
    setParkedInvoices(newParked);
    localStorage.setItem(`PARKED_INVOICES_${activeShop?.id}`, JSON.stringify(newParked));

    setIsParkedListOpen(false);
    toast({ title: "Invoice Restored", description: "Continuing parked invoice." });
  };

  const handleDeleteParked = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newParked = parkedInvoices.filter(p => p.id !== id);
    setParkedInvoices(newParked);
    localStorage.setItem(`PARKED_INVOICES_${activeShop?.id}`, JSON.stringify(newParked));
  };



  // --- 3. Form Initialization ---
  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(InvoiceSchema),
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
        category: item.category || '',
        metalType: item.metalType || '',

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
          // Fix: Convert date string back to Date object
          if (parsed.invoiceDate) {
            parsed.invoiceDate = new Date(parsed.invoiceDate);
          }
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
        shopName: activeShop.shopName,
        address: activeShop.address,
        state: activeShop.state,
        pincode: activeShop.pincode,
        phoneNumber: activeShop.phoneNumber,
        email: activeShop.email,
        gstNumber: activeShop.gstNumber,
        panNumber: activeShop.panNumber,
        logoUrl: activeShop.logoUrl,
        templateId: activeShop.templateId,
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

  // Calculate Max Redeemable Points based on Invoice Value
  const maxRedeemablePoints = useMemo(() => {
    if (!loyaltySettings?.redemption_conversion_rate) return 0;

    // Max value we can cover with points (Grand Total Before Discount - Cash Discount)
    // We need to recalculate total before discount here to be accurate
    const taxableAmount = totals.subtotal;
    const taxAmount = taxableAmount * ((settings?.sgstRate || 1.5) + (settings?.cgstRate || 1.5)) / 100;
    const totalBeforeDiscount = taxableAmount + taxAmount;

    const maxRedeemableValue = Math.max(0, totalBeforeDiscount - (Number(watchedDiscount) || 0));

    // Convert value to points
    const maxPointsByValue = Math.floor(maxRedeemableValue / loyaltySettings.redemption_conversion_rate);

    // Return lesser of (Customer Balance, Max Allowed by Invoice)
    return Math.min(customerPoints, maxPointsByValue);
  }, [totals.subtotal, watchedDiscount, loyaltySettings, customerPoints, settings?.sgstRate, settings?.cgstRate]);

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
        rate: watchedCurrentRate > 0 ? watchedCurrentRate : 0,
        stoneAmount: item.stone_value || 0,
        stockId: item.id,
        tagId: item.tag_id,
      });
    });

    // UX-004: Feedback on successful scan
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

    // Client-side validation for loyalty points
    if (data.redeemPoints && data.pointsToRedeem > maxRedeemablePoints) {
      form.setError('pointsToRedeem', {
        type: 'manual',
        message: `Cannot redeem more than ${maxRedeemablePoints} points`
      });
      toast({
        title: 'Validation Error',
        description: `You can only redeem up to ${maxRedeemablePoints} points for this invoice.`,
        variant: 'destructive'
      });
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

  const onError = (errors: any) => {
    console.error("Validation Errors:", JSON.stringify(errors, null, 2));

    // Helper to find the first error message recursively
    const getFirstErrorMessage = (errorObj: any): string | null => {
      if (!errorObj) return null;
      if (typeof errorObj.message === 'string') return errorObj.message;

      // If it's an array (like items), iterate
      if (Array.isArray(errorObj)) {
        for (const item of errorObj) {
          const msg = getFirstErrorMessage(item);
          if (msg) return msg;
        }
      }

      // If it's an object, iterate values
      if (typeof errorObj === 'object') {
        for (const key in errorObj) {
          const msg = getFirstErrorMessage(errorObj[key]);
          if (msg) return msg;
        }
      }

      return null;
    };

    const message = getFirstErrorMessage(errors) || "Please check the form for missing or invalid fields.";

    toast({
      title: "Validation Error",
      description: message,
      variant: "destructive",
    });
  };

  if (shopLoading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin" /></div>;

  return (
    <MotionWrapper className="min-h-screen flex flex-col lg:block">

      {/* 1. Fixed Header (Mobile) / Regular Header (Desktop) */}
      <div className="flex-none p-4 py-3 bg-background border-b z-50 sticky top-0 lg:static lg:p-0 lg:border-none lg:mb-4 lg:bg-transparent">
        <div className="container mx-auto px-4 lg:px-0 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-2 -ml-2 pl-0 hover:bg-transparent lg:hover:bg-accent lg:pl-4">
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowClearConfirmation(true)}
              className="text-muted-foreground hover:text-destructive"
            >
              Clear
            </Button>
            <div className="h-4 w-px bg-border mx-2" />

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.preventDefault();
                handleParkInvoice();
              }}
              className="text-orange-600 hover:text-orange-700 hover:bg-orange-50 mr-1"
              title="Hold current invoice to serve another customer"
            >
              <PauseCircle className="h-4 w-4 mr-1.5" />
              Hold
            </Button>

            {parkedInvoices.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsParkedListOpen(true)}
                className="gap-2 border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100 hover:text-orange-800"
              >
                <Clock className="h-4 w-4" />
                Held <span className="ml-0.5 bg-orange-200 px-1.5 py-0.5 rounded-full text-[10px] min-w-[1.25rem] text-center">{parkedInvoices.length}</span>
              </Button>
            )}
          </div>
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
                onSubmit={form.handleSubmit(onSubmit, onError)}
                className="flex flex-col"
              >

                {/* Scrollable Content Area */}
                <div className="px-2 py-3 lg:p-0 space-y-3 lg:space-y-4">

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
                    <Card className="border-2 shadow-sm border-primary/30 dark:border-primary/20">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                          <div className="p-1.5 rounded-lg bg-primary/10">
                            <FileText className="h-4 w-4 text-primary" />
                          </div>
                          Items Added ({watchedItems.length})
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                          {watchedItems.map((item, idx) => (
                            <div key={idx} className="p-3 bg-muted/50 dark:bg-white/5 rounded-lg border-l-4 border-primary/60">
                              <div className="flex justify-between items-start gap-2">
                                <div className="flex-1 min-w-0">
                                  <p className="font-semibold text-sm truncate text-foreground">{item.description || `Item ${idx + 1}`}</p>
                                  <p className="text-xs text-muted-foreground">{item.purity} | {item.metalType || 'Metal'}</p>
                                </div>
                                <div className="text-right text-sm">
                                  <p className="font-semibold text-foreground">{Number(item.netWeight).toFixed(2)}g</p>
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
                    </div>
                    <InvoiceItemsTable form={form} shopId={activeShop?.id} />
                  </div>

                  {/* 4. Loyalty Section */}
                  {loyaltySettings && watchedCustomerPhone && watchedCustomerPhone.length >= 10 && (
                    <Card className="border-2 shadow-sm relative z-10">
                      <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <Users className="h-5 w-5 text-primary" /> Loyalty Program
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex justify-between items-center mb-4 p-3 bg-muted/50 rounded-lg border">
                          <div>
                            <p className="text-sm text-muted-foreground">Available Points</p>
                            <p className="text-2xl font-bold text-primary">{customerPoints}</p>
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
                            <FormItem className="flex items-center justify-between border p-3 rounded-lg bg-card shadow-sm">
                              <FormLabel className="cursor-pointer font-medium">Redeem Points</FormLabel>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={(val) => {
                                    // Wrap in transition to avoid flushSync errors with Radix UI
                                    startTransition(() => {
                                      field.onChange(val);
                                      // Reset points if disabled
                                      if (!val) form.setValue('pointsToRedeem', 0);
                                    });
                                  }}
                                  disabled={customerPoints <= 0 || maxRedeemablePoints <= 0}
                                />
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
                                  <FormLabel>Points to Redeem (Max: {maxRedeemablePoints})</FormLabel>
                                  <div className="flex gap-2">
                                    <FormControl>
                                      <Input
                                        type="number"
                                        max={maxRedeemablePoints}
                                        {...field}
                                        value={field.value === 0 ? '' : (field.value ?? '')}
                                        onChange={e => {
                                          const val = Number(e.target.value);
                                          if (val > maxRedeemablePoints) {
                                            form.setError('pointsToRedeem', {
                                              type: 'manual',
                                              message: `Max points: ${maxRedeemablePoints}`
                                            });
                                          } else {
                                            form.clearErrors('pointsToRedeem');
                                          }
                                          field.onChange(val);
                                        }}
                                        className={cn(
                                          form.formState.errors.pointsToRedeem && "border-destructive focus-visible:ring-destructive"
                                        )}
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
                      <div className="space-y-3 text-sm pb-2 animate-in slide-in-from-bottom-2">
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-muted-foreground whitespace-nowrap">Discount (₹)</span>
                          <Input
                            type="number"
                            value={watchedDiscount === 0 ? '' : watchedDiscount}
                            onChange={(e) => form.setValue('discount', Number(e.target.value))}
                            className="h-8 w-24 text-right"
                            placeholder="0"
                          />
                        </div>
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
                      onClick={form.handleSubmit(() => setShowConfirmation(true), onError)}
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
                onClick={form.handleSubmit(() => setShowConfirmation(true), onError)}
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

      {/* Clear Form Confirmation Modal */}
      <AlertDialog open={showClearConfirmation} onOpenChange={setShowClearConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear Invoice Form?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to clear the form? This will discard all items and customer details. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                form.reset({
                  customerName: '',
                  customerPhone: '',
                  items: [],
                  discount: 0,
                  status: 'paid',
                  invoiceDate: new Date(),
                });
                if (DRAFT_KEY) localStorage.removeItem(DRAFT_KEY);
                toast({ title: 'Form Cleared', description: 'Started a new invoice.' });
                setShowClearConfirmation(false);
              }}
            >
              Clear Form
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Parked Invoices List Modal */}
      <Dialog open={isParkedListOpen} onOpenChange={setIsParkedListOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Held Invoices</DialogTitle>
            <DialogDescription>
              Select an invoice to resume or delete.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 mt-2 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
            {parkedInvoices.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground bg-muted/30 rounded-lg">
                <Clock className="h-10 w-10 mx-auto mb-2 opacity-20" />
                <p>No held invoices</p>
              </div>
            ) : (
              parkedInvoices.map((inv) => (
                <div key={inv.id} className="flex flex-col gap-2 p-3 rounded-lg border bg-card hover:bg-accent/50 hover:border-primary/30 transition-all cursor-pointer group shadow-sm" onClick={() => handleRestoreParked(inv)}>
                  <div className="flex justify-between items-start">
                    <div className="font-semibold text-foreground">{inv.customerName}</div>
                    <div className="text-sm font-bold text-primary">{formatCurrency(inv.amount)}</div>
                  </div>
                  <div className="flex justify-between items-center text-xs text-muted-foreground p-0.5">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(inv.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • <span className="font-medium text-foreground">{inv.itemCount} items</span>
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full opacity-70 group-hover:opacity-100 transition-all"
                      onClick={(e) => handleDeleteParked(inv.id, e)}
                      title="Delete Held Invoice"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </MotionWrapper>
  );
}
