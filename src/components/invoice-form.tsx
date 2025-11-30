'use client';

import { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
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
  Plus,
  Trash2,
  Calendar as CalendarIcon,
  Users,
  Eye,
  EyeOff,
  RefreshCw,
  FileText,
  AlertCircle,
  Search,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useUser } from '@/supabase/provider';
import { useActiveShop } from '@/hooks/use-active-shop';
import { createInvoiceAction, updateInvoiceAction } from '@/app/actions/invoice-actions';
import { PremiumCustomerAutocomplete } from '@/components/invoice/PremiumCustomerAutocomplete';
import { CompactTotalsSummary } from '@/components/invoice/CompactTotalsSummary';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { LineItemsTable } from '@/components/invoice/LineItemsTable';
import { InvoiceSummary } from '@/components/invoice/InvoiceSummary';
import { LiveInvoicePreview } from '@/components/invoice-preview';
import { MotionWrapper, FadeIn } from '@/components/ui/motion-wrapper';
import { CelebrationModal } from '@/components/celebration-modal';
import { supabase } from '@/supabase/client';
import type { Invoice } from '@/lib/definitions';
import type { LoyaltySettings } from '@/lib/loyalty-types';
import { cn, formatCurrency } from '@/lib/utils';

const invoiceSchema = z.object({
  customerName: z.string().min(1, 'Customer name is required'),
  customerAddress: z.string().optional(),
  customerState: z.string().optional(),
  customerPincode: z.string().optional(),
  customerPhone: z.string().optional(),
  customerEmail: z.string().email().optional().or(z.literal('')),
  invoiceDate: z.date(),
  items: z.array(z.object({
    id: z.string(),
    description: z.string().min(1, 'Description is required'),
    purity: z.string().optional(),
    grossWeight: z.number().min(0),
    netWeight: z.number().min(0),
    rate: z.number().min(0),
    making: z.number().min(0),
  })).min(1, 'At least one item is required'),
  discount: z.number().min(0).optional(),
  status: z.enum(['paid', 'due']),
  redeemPoints: z.boolean().optional(),
  pointsToRedeem: z.number().min(0).optional(),
});

type InvoiceFormValues = z.infer<typeof invoiceSchema>;

interface InvoiceFormProps {
  invoice?: Invoice & { items?: any[] };
}

export function InvoiceForm({ invoice }: InvoiceFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const { user } = useUser();
  const { activeShop, isLoading: shopLoading, permissions } = useActiveShop();
  const [settings, setSettings] = useState<any | null>(null);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [showPreview, setShowPreview] = useState(false);
  const [previewCollapsed, setPreviewCollapsed] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [showCelebration, setShowCelebration] = useState(false);

  // Loyalty State
  const [loyaltySettings, setLoyaltySettings] = useState<LoyaltySettings | null>(null);
  const [customerPoints, setCustomerPoints] = useState<number>(0);
  const [pointsToEarn, setPointsToEarn] = useState<number>(0);
  const [maxRedeemablePoints, setMaxRedeemablePoints] = useState<number>(0);
  const [loyaltyDiscount, setLoyaltyDiscount] = useState<number>(0);

  // Load settings
  useEffect(() => {
    const loadSettings = async () => {
      if (activeShop) {
        setSettings({
          id: activeShop.id,
          userId: user?.uid || '',
          cgstRate: activeShop.cgstRate || 1.5,
          sgstRate: activeShop.sgstRate || 1.5,
          shopName: activeShop.shopName,
          gstNumber: activeShop.gstNumber || '',
          panNumber: activeShop.panNumber || '',
          address: activeShop.address || '',
          state: activeShop.state || '',
          pincode: activeShop.pincode || '',
          phoneNumber: activeShop.phoneNumber || '',
          email: activeShop.email || '',
          templateId: activeShop.templateId || 'classic',
        });

        // Load Loyalty Settings
        const { data: loyaltyData } = await supabase
          .from('shop_loyalty_settings')
          .select('*')
          .eq('shop_id', activeShop.id)
          .single();

        if (loyaltyData && loyaltyData.is_enabled) {
          setLoyaltySettings(loyaltyData);
        }

        setSettingsLoading(false);
      } else {
        setSettingsLoading(false);
      }
    };
    loadSettings();
  }, [activeShop, user]);

  // Fetch recent customers
  useEffect(() => {
    const fetchCustomers = async () => {
      if (!activeShop?.id) return;
      try {
        const { getCustomers } = await import('@/services/customers');
        const customerData = await getCustomers(activeShop.id);
        console.log('📊 Fetched customers:', customerData.length, 'customers');
        console.log('📋 Sample customer:', customerData[0]);
        setCustomers(customerData);
      } catch (err) {
        console.error('❌ Error fetching customers:', err);
      }
    };
    fetchCustomers();
  }, [activeShop?.id]);

  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      customerName: invoice?.customerName || '',
      customerAddress: invoice?.customerAddress || '',
      customerState: invoice?.customerState || '',
      customerPincode: invoice?.customerPincode || '',
      customerPhone: invoice?.customerPhone || '',
      customerEmail: invoice?.customerEmail || '',
      invoiceDate: invoice?.invoiceDate ? new Date(invoice.invoiceDate) : new Date(),
      items: invoice?.items?.map((item: any) => ({
        id: item.id,
        description: item.description,
        purity: item.purity,
        grossWeight: Number(item.grossWeight ?? item.gross_weight) || 0,
        netWeight: Number(item.netWeight ?? item.net_weight) || 0,
        rate: Number(item.rate) || 0,
        making: Number(item.making) || 0,
      })) || [{
        id: crypto.randomUUID(),
        description: '',
        purity: '',
        grossWeight: 0,
        netWeight: 0,
        rate: 0,
        making: 0,
      }],
      discount: invoice?.discount || 0,
      status: (invoice?.status as 'paid' | 'due') || 'paid',
      redeemPoints: false,
      pointsToRedeem: 0,
    },
    mode: 'onChange', // Enable real-time validation
  });

  const watchedValues = form.watch();

  // Fetch customer points when phone changes
  useEffect(() => {
    const fetchCustomerPoints = async () => {
      if (!activeShop?.id || !watchedValues.customerPhone || watchedValues.customerPhone.length < 10) {
        setCustomerPoints(0);
        return;
      }

      const { data } = await supabase
        .from('customers')
        .select('loyalty_points')
        .eq('shop_id', activeShop.id)
        .eq('phone', watchedValues.customerPhone)
        .single();

      if (data) {
        setCustomerPoints(data.loyalty_points || 0);
      }
    };

    // Debounce fetch
    const timeoutId = setTimeout(fetchCustomerPoints, 500);
    return () => clearTimeout(timeoutId);
  }, [activeShop?.id, watchedValues.customerPhone]);

  // Calculate Loyalty Discount
  useEffect(() => {
    if (watchedValues.redeemPoints && watchedValues.pointsToRedeem && loyaltySettings) {
      const discount = (watchedValues.pointsToRedeem * loyaltySettings.redemption_conversion_rate);
      setLoyaltyDiscount(discount);
    } else {
      setLoyaltyDiscount(0);
    }
  }, [watchedValues.redeemPoints, watchedValues.pointsToRedeem, loyaltySettings]);

  // Calculate totals
  const calculateTotals = (items: any[], discount: number = 0) => {
    const subtotal = items.reduce((acc, item) => {
      return acc + ((Number(item.netWeight) * Number(item.rate)) + Number(item.making));
    }, 0);

    const taxableAmount = Math.max(0, subtotal - discount);
    const sgstRate = settings?.sgstRate || 1.5;
    const cgstRate = settings?.cgstRate || 1.5;

    const sgstAmount = taxableAmount * (sgstRate / 100);
    const cgstAmount = taxableAmount * (cgstRate / 100);
    const grandTotal = taxableAmount + sgstAmount + cgstAmount;

    return { subtotal, sgstAmount, cgstAmount, grandTotal };
  };

  const { subtotal, sgstAmount, cgstAmount, grandTotal } = calculateTotals(
    watchedValues.items || [],
    watchedValues.discount || 0
  );

  const onSubmit = async (data: InvoiceFormValues) => {
    if (!activeShop?.id || !user?.uid) {
      toast({
        title: 'Error',
        description: 'Shop or user information missing',
        variant: 'destructive',
      });
      return;
    }

    startTransition(async () => {
      try {
        const totals = calculateTotals(data.items, data.discount);

        console.log('Submitting invoice for shop:', activeShop.id);
        const payload = {
          shopId: activeShop.id,
          userId: user.uid,
          ...data,
          discount: data.discount || 0,
          grandTotal: totals.grandTotal,
          subtotal: totals.subtotal,
          sgstAmount: totals.sgstAmount,
          cgstAmount: totals.cgstAmount,
          sgst: settings?.sgstRate || 1.5,
          cgst: settings?.cgstRate || 1.5,
          items: data.items.map(item => ({
            ...item,
            purity: item.purity || '22K', // Default purity if missing
          })),
        };

        let result;
        if (invoice) {
          result = await updateInvoiceAction(invoice.id, activeShop.id, payload);
        } else {
          result = await createInvoiceAction(payload);
        }

        if (result.success) {
          // Show celebration for new invoice creation
          if (!invoice) {
            setShowCelebration(true);
            // Delay navigation to show celebration
            setTimeout(() => {
              router.push(`/shop/${activeShop.id}/invoices`);
            }, 2500);
          } else {
            toast({
              title: 'Success',
              description: 'Invoice updated successfully',
            });
            router.push(`/shop/${activeShop.id}/invoices`);
          }
        } else {
          throw new Error(result.error);
        }
      } catch (error: any) {
        toast({
          title: 'Error',
          description: error.message || 'Failed to save invoice',
          variant: 'destructive',
        });
      }
    });
  };

  if (shopLoading || settingsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]" role="status" aria-live="polite">
        <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden="true" />
        <span className="sr-only">Loading shop settings...</span>
      </div>
    );
  }

  const isShopSetupValid = settings?.gstNumber && settings?.address;

  return (
    <MotionWrapper className="min-h-screen pb-24">
      {/* Main Content - 2 Column Layout */}
      <div className="container mx-auto px-4 py-6">
        {/* Back Button & Mobile Preview Toggle */}
        <div className="mb-4 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="gap-2 -ml-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPreview(true)}
            className="gap-2 lg:hidden"
          >
            <Eye className="h-4 w-4" />
            Preview
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr,400px] gap-6">
          {/* Left Column - Form */}
          <div className="space-y-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Customer Section - Premium Autocomplete */}
                <Card className="border-2 relative z-20">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-primary" />
                        Customer Details
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => {
                          const fetchCustomers = async () => {
                            if (!activeShop?.id) return;
                            const { getCustomers } = await import('@/services/customers');
                            const data = await getCustomers(activeShop.id);
                            setCustomers(data);
                            console.log('Refreshed customers:', data.length);
                          };
                          fetchCustomers();
                        }}
                      >
                        <RefreshCw className="h-3 w-3" />
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <PremiumCustomerAutocomplete
                      customers={customers}
                      value={{
                        name: watchedValues.customerName || '',
                        phone: watchedValues.customerPhone,
                        address: watchedValues.customerAddress,
                        state: watchedValues.customerState,
                        pincode: watchedValues.customerPincode,
                        email: watchedValues.customerEmail,
                      }}
                      onChange={(customer) => {
                        if (customer.name !== undefined) form.setValue('customerName', customer.name);
                        if (customer.phone !== undefined) form.setValue('customerPhone', customer.phone);
                        if (customer.address !== undefined) form.setValue('customerAddress', customer.address);
                        if (customer.state !== undefined) form.setValue('customerState', customer.state);
                        if (customer.pincode !== undefined) form.setValue('customerPincode', customer.pincode);
                        if (customer.email !== undefined) form.setValue('customerEmail', customer.email);
                      }}
                      onSearch={async (query) => {
                        if (!activeShop?.id) return;
                        try {
                          const { searchCustomers } = await import('@/services/customers');
                          const results = await searchCustomers(activeShop.id, query);
                          setCustomers(results);
                        } catch (err) {
                          console.error('Error searching customers:', err);
                        }
                      }}
                      disabled={isPending}
                    />
                  </CardContent>
                </Card>

                {/* Invoice Details - Compact */}
                <Card className="border-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary" />
                      Invoice Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="invoiceDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Invoice Date</FormLabel>
                          <FormControl>
                            <Input
                              type="date"
                              value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''}
                              onChange={(e) => field.onChange(new Date(e.target.value))}
                              className="h-10"
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
                          <FormLabel>Payment Status</FormLabel>
                          <FormControl>
                            <div className="flex items-center gap-2 p-1 bg-muted rounded-lg border h-10">
                              <Button
                                type="button"
                                variant={field.value === 'paid' ? 'default' : 'ghost'}
                                className={cn("flex-1 h-8", field.value === 'paid' && "bg-emerald-600 hover:bg-emerald-700 text-white")}
                                onClick={() => field.onChange('paid')}
                              >
                                Paid
                              </Button>
                              <Button
                                type="button"
                                variant={field.value === 'due' ? 'default' : 'ghost'}
                                className={cn("flex-1 h-8", field.value === 'due' && "bg-amber-600 hover:bg-amber-700 text-white")}
                                onClick={() => field.onChange('due')}
                              >
                                Due
                              </Button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* Items Table */}
                <Card className="border-2">
                  <CardContent className="pt-6">
                    <LineItemsTable
                      items={watchedValues.items.map(item => ({ ...item, purity: item.purity || '22K' }))}
                      onItemsChange={(items) => form.setValue('items', items)}
                      disabled={isPending}
                    />
                  </CardContent>
                </Card>

                {/* Loyalty Redemption */}
                {loyaltySettings && watchedValues.customerPhone && watchedValues.customerPhone.length >= 10 && (
                  <Card className="border-2 border-purple-500/20 bg-purple-50/50 dark:bg-purple-900/10">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-purple-700 dark:text-purple-400 text-base">
                        <div className="p-1.5 rounded-full bg-purple-100 dark:bg-purple-900/50">
                          <Users className="h-4 w-4" />
                        </div>
                        Loyalty Program
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Available Points</p>
                          <p className="text-2xl font-bold text-purple-700 dark:text-purple-400">{customerPoints}</p>
                        </div>
                        <FormField
                          control={form.control}
                          name="redeemPoints"
                          render={({ field }) => (
                            <FormItem className="flex items-center space-x-2 space-y-0">
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <FormLabel className="font-medium cursor-pointer">
                                Redeem Points
                              </FormLabel>
                            </FormItem>
                          )}
                        />
                      </div>

                      {watchedValues.redeemPoints && (
                        <div className="space-y-4 animate-in slide-in-from-top-2">
                          <FormField
                            control={form.control}
                            name="pointsToRedeem"
                            render={({ field }) => (
                              <FormItem>
                                <div className="flex justify-between text-sm mb-1.5">
                                  <FormLabel>Points to Redeem</FormLabel>
                                  <span className="text-muted-foreground">
                                    Max: {Math.min(customerPoints, Math.floor(subtotal * ((loyaltySettings.max_redemption_percentage || 100) / 100) / loyaltySettings.redemption_conversion_rate))}
                                  </span>
                                </div>
                                <FormControl>
                                  <div className="flex gap-2">
                                    <Input
                                      type="number"
                                      min="0"
                                      max={customerPoints}
                                      value={field.value || ''}
                                      onChange={(e) => field.onChange(Number(e.target.value))}
                                      className="h-10"
                                    />
                                    <div className="flex items-center px-3 rounded-md bg-muted text-sm font-medium min-w-[100px] justify-center">
                                      - ₹{loyaltyDiscount.toFixed(2)}
                                    </div>
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}


              </form>
            </Form>
          </div>

          {/* Right Column - Sticky Summary & Preview (Desktop Only) */}
          <div className="hidden lg:block space-y-6 sticky top-10 self-start z-10">
            {/* Compact Totals Summary */}
            <CompactTotalsSummary
              subtotal={subtotal}
              discount={watchedValues.discount || 0}
              loyaltyDiscount={loyaltyDiscount}
              sgstAmount={sgstAmount}
              cgstAmount={cgstAmount}
              grandTotal={grandTotal}
              sgstRate={settings?.sgstRate || 1.5}
              cgstRate={settings?.cgstRate || 1.5}
              onDiscountChange={(val) => form.setValue('discount', val)}
            />

            {/* Action Buttons - Desktop */}
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                className="flex-1 h-12"
                size="lg"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                onClick={form.handleSubmit(onSubmit)}
                className="flex-1 h-12 text-lg font-semibold shadow-lg shadow-primary/20"
                size="lg"
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-5 w-5" />
                    {invoice ? 'Update' : 'Create'}
                  </>
                )}
              </Button>
            </div>

            {/* Live Invoice Preview */}
            <Card className="border-2 overflow-hidden bg-background shadow-lg">
              <CardHeader className="pb-3 bg-slate-50 dark:bg-slate-900/50 border-b">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold">Live Preview</CardTitle>
                  <Badge variant="outline" className="text-xs">Real-time</Badge>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <div className="overflow-hidden bg-white dark:bg-slate-950 rounded-lg border max-h-[460px]">
                  <div className="scale-[0.5] origin-top-left w-[200%]">
                    <LiveInvoicePreview
                      data={{
                        customerName: watchedValues.customerName,
                        customerAddress: watchedValues.customerAddress,
                        customerState: watchedValues.customerState,
                        customerPincode: watchedValues.customerPincode,
                        customerPhone: watchedValues.customerPhone,
                        invoiceDate: watchedValues.invoiceDate,
                        items: watchedValues.items,
                        discount: watchedValues.discount,
                        status: watchedValues.status,
                        sgst: settings?.sgstRate || 1.5,
                        cgst: settings?.cgstRate || 1.5,
                      }}
                      settings={settings}
                      invoiceNumber="Preview"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Mobile Sticky Footer with Summary & Actions */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-background border-t shadow-2xl z-50">
        {/* Compact Summary */}
        <div className="px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border-b">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Subtotal:</span>
            <span className="font-medium">{formatCurrency(subtotal)}</span>
          </div>
          {(watchedValues.discount || loyaltyDiscount > 0) && (
            <div className="flex items-center justify-between text-sm mt-1">
              <span className="text-muted-foreground">Discount:</span>
              <span className="font-medium text-green-600">-{formatCurrency((watchedValues.discount || 0) + loyaltyDiscount)}</span>
            </div>
          )}
          <div className="flex items-center justify-between text-sm mt-1">
            <span className="text-muted-foreground">Tax:</span>
            <span className="font-medium">+{formatCurrency(sgstAmount + cgstAmount)}</span>
          </div>
          <div className="flex items-center justify-between font-bold text-base mt-2 pt-2 border-t">
            <span>Grand Total:</span>
            <span className="text-primary">{formatCurrency(grandTotal)}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="px-4 py-3 flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            className="flex-1 h-12"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isPending}
            onClick={form.handleSubmit(onSubmit)}
            className="flex-1 h-12 text-base font-semibold shadow-lg"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                {invoice ? 'Update' : 'Create'}
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Mobile Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-background z-50 overflow-y-auto lg:hidden">
          <div className="sticky top-0 bg-background border-b p-4 flex items-center justify-between">
            <h2 className="font-semibold">Invoice Preview</h2>
            <Button variant="ghost" size="sm" onClick={() => setShowPreview(false)}>
              <EyeOff className="h-4 w-4" />
            </Button>
          </div>
          <div className="p-4">
            <LiveInvoicePreview
              data={{
                customerName: watchedValues.customerName,
                customerAddress: watchedValues.customerAddress,
                customerState: watchedValues.customerState,
                customerPincode: watchedValues.customerPincode,
                customerPhone: watchedValues.customerPhone,
                invoiceDate: watchedValues.invoiceDate,
                items: watchedValues.items,
                discount: watchedValues.discount,
                status: watchedValues.status,
                sgst: settings?.sgstRate || 1.5,
                cgst: settings?.cgstRate || 1.5,
              }}
              settings={settings}
              invoiceNumber="Preview"
            />
          </div>
        </div>
      )}

      {/* Celebration Modal */}
      <CelebrationModal
        isOpen={showCelebration}
        onClose={() => setShowCelebration(false)}
      />

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: hsl(var(--muted-foreground) / 0.3);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: hsl(var(--muted-foreground) / 0.5);
        }
      `}</style>
    </MotionWrapper>
  );
}
