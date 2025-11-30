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
import { Loader2, Save, ArrowLeft, Eye, EyeOff, AlertCircle, Users, Search, FileText, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useUser } from '@/supabase/provider';
import { useActiveShop } from '@/hooks/use-active-shop';
import { createInvoiceAction, updateInvoiceAction } from '@/app/actions/invoice-actions';
import { CustomerSelector } from '@/components/invoice/CustomerSelector';
import { LineItemsTable } from '@/components/invoice/LineItemsTable';
import { InvoiceSummary } from '@/components/invoice/InvoiceSummary';
import { LiveInvoicePreview } from '@/components/invoice-preview';
import { MotionWrapper, FadeIn } from '@/components/ui/motion-wrapper';
import { CelebrationModal } from '@/components/celebration-modal';
import { supabase } from '@/supabase/client';
import type { Invoice } from '@/lib/definitions';
import { cn } from '@/lib/utils';

const invoiceSchema = z.object({
  customerName: z.string().min(1, 'Customer name is required'),
  customerAddress: z.string().optional(),
  customerState: z.string().optional(),
  customerPincode: z.string().optional(),
  customerPhone: z.string().min(10, 'Phone number must be at least 10 digits'),
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
        setCustomers(customerData);
      } catch (err) {
        console.error('Error fetching customers:', err);
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
      invoiceDate: invoice ? new Date(invoice.invoiceDate) : new Date(),
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
    },
    mode: 'onChange', // Enable real-time validation
  });

  const watchedValues = form.watch();

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
    <div className={`grid grid-cols-1 ${previewCollapsed ? '' : 'lg:grid-cols-12'} gap-6 h-[calc(100vh-4rem)] relative`}>
      {/* Left Column - Form */}
      <div className={`${previewCollapsed ? 'lg:col-span-12' : 'lg:col-span-7'} flex flex-col gap-6 h-full overflow-y-auto pb-20 lg:pb-6 pt-2 no-scrollbar`}>
        <MotionWrapper className="space-y-6">
          {/* Header Actions */}
          <div className="flex items-center justify-between">
             <div className="flex items-center gap-2">
                <Button type="button" variant="ghost" onClick={() => router.back()} className="gap-2">
                  <ArrowLeft className="h-4 w-4" /> Back
                </Button>
             </div>
             <div className="flex items-center gap-2">
                {/* Mobile preview toggle */}
                <div className="lg:hidden">
                  <Button type="button" variant="outline" size="sm" onClick={() => setShowPreview(!showPreview)} className="bg-white/5 border-white/10 hover:bg-white/10">
                    {showPreview ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                    {showPreview ? 'Hide' : 'Preview'}
                  </Button>
                </div>
                {/* Desktop collapse toggle */}
                <div className="hidden lg:block">
                  <Button type="button" variant="ghost" size="sm" onClick={() => setPreviewCollapsed((s) => !s)} className="p-2">
                    {previewCollapsed ? <><ChevronsRight className="h-4 w-4" /> Show Preview</> : <><ChevronsLeft className="h-4 w-4" /> Collapse Preview</>}
                  </Button>
                </div>
             </div>
          </div>

          {/* Shop Setup Warning */}
          {permissions.canEditSettings && !isShopSetupValid && !settingsLoading && (
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

          {/* Mobile Preview */}
          {showPreview && (
            <div className="lg:hidden mb-6 h-[500px] rounded-lg overflow-hidden border border-white/10 shadow-xl">
              <LiveInvoicePreview data={watchedValues} settings={settings} />
            </div>
          )}

          <Form {...form}>
            <form id="invoice-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              {/* Customer Details */}
              <Card className="glass-card border-t-2 border-t-primary/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-primary">
                    <Users className="h-5 w-5" />
                    Customer Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CustomerSelector
                    value={{
                      customerName: watchedValues.customerName,
                      customerAddress: watchedValues.customerAddress || '',
                      customerPhone: watchedValues.customerPhone,
                      customerState: watchedValues.customerState,
                      customerPincode: watchedValues.customerPincode,
                    }}
                    onChange={(customer) => {
                      if (customer.name !== undefined) form.setValue('customerName', customer.name);
                      if (customer.address !== undefined) form.setValue('customerAddress', customer.address);
                      if (customer.phone !== undefined) form.setValue('customerPhone', customer.phone);
                      if (customer.state !== undefined) form.setValue('customerState', customer.state);
                      if (customer.pincode !== undefined) form.setValue('customerPincode', customer.pincode);
                    }}
                    customers={customers}
                    disabled={isPending}
                  />
                </CardContent>
              </Card>

              {/* Invoice Details */}
              <Card className="glass-card border-t-2 border-t-primary/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-primary">
                    <FileText className="h-5 w-5" />
                    Invoice Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="invoiceDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Invoice Date</FormLabel>
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
                      <FormItem className="flex flex-col">
                        <FormLabel>Payment Status</FormLabel>
                        <FormControl>
                          <div className="flex items-center gap-2 p-1 bg-muted rounded-lg border">
                            <Button
                              type="button"
                              variant={field.value === 'paid' ? 'default' : 'ghost'}
                              className={cn("flex-1", field.value === 'paid' && "bg-emerald-600 hover:bg-emerald-700 text-white")}
                              onClick={() => field.onChange('paid')}
                            >
                              Paid
                            </Button>
                            <Button
                              type="button"
                              variant={field.value === 'due' ? 'default' : 'ghost'}
                              className={cn("flex-1", field.value === 'due' && "bg-amber-600 hover:bg-amber-700 text-white")}
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

              {/* Line Items */}
              <Card className="glass-card border-t-2 border-t-gold-500/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-gold-600 dark:text-gold-400">
                    Items
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <LineItemsTable
                    items={watchedValues.items.map(item => ({ ...item, purity: item.purity || '22K' }))}
                    onItemsChange={(items) => form.setValue('items', items)}
                    disabled={isPending}
                  />
                </CardContent>
              </Card>

              {/* Summary */}
              <InvoiceSummary
                subtotal={subtotal}
                discount={watchedValues.discount || 0}
                sgst={settings?.sgstRate || 1.5}
                cgst={settings?.cgstRate || 1.5}
                grandTotal={grandTotal}
                sgstAmount={sgstAmount}
                cgstAmount={cgstAmount}
                onDiscountChange={(val) => form.setValue('discount', val)}
                editable={!isPending}
              />

              {/* Form Actions (Desktop) */}
              <div className="hidden lg:flex items-center justify-end gap-4 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={isPending}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isPending || !isShopSetupValid}
                  className="bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700 text-white shadow-lg shadow-gold-500/20 min-w-[120px]"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      {invoice ? 'Update Invoice' : 'Create Invoice'}
                    </>
                  )}
                </Button>
              </div>

              {/* Mobile Actions - Floating Bottom Bar */}
              <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-xl border-t border-border/40 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] z-50">
                <div className="flex gap-3 max-w-lg mx-auto">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                    disabled={isPending}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isPending || !isShopSetupValid}
                    className="flex-1 bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700 text-white shadow-lg shadow-gold-500/20"
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
            </form>
          </Form>
        </MotionWrapper>
      </div>

      {/* Right Column - Live Preview (Desktop) */}
      {!previewCollapsed && (
        <div className="hidden lg:col-span-5 lg:block sticky top-20 self-start h-[calc(100vh-6rem)] pt-2">
          <div className="rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-transparent p-0 h-full flex items-start justify-center">
            <div className="w-full max-w-[700px] p-4">
              <MotionWrapper>
                <LiveInvoicePreview data={watchedValues} settings={settings} />
              </MotionWrapper>
            </div>
          </div>
        </div>
      )}

      {/* Celebration Modal */}
      <CelebrationModal 
        isOpen={showCelebration} 
        onClose={() => setShowCelebration(false)} 
      />
    </div>
  );
}
