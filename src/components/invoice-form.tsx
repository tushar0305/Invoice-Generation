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
import { Loader2, Save, ArrowLeft, Eye, EyeOff, AlertCircle, Users, Search } from 'lucide-react';
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
import { supabase } from '@/supabase/client';
import type { Invoice } from '@/lib/definitions';

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
  const [customers, setCustomers] = useState<any[]>([]);

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
        const { data } = await supabase
          .from('invoices')
          .select('customer_name, customer_address, customer_phone, customer_state, customer_pincode')
          .eq('shop_id', activeShop.id)
          .order('created_at', { ascending: false })
          .limit(100);

        const uniqueCustomers = Array.from(
          new Map(
            data?.map(c => [
              c.customer_name.toLowerCase(),
              {
                name: c.customer_name,
                address: c.customer_address || '',
                phone: c.customer_phone || '',
                state: c.customer_state || '',
                pincode: c.customer_pincode || '',
              }
            ]) || []
          ).values()
        );
        setCustomers(uniqueCustomers);
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
      items: invoice?.items?.map(item => ({
        id: item.id,
        description: item.description,
        purity: item.purity || '',
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
          toast({
            title: 'Success',
            description: invoice ? 'Invoice updated successfully' : 'Invoice created successfully',
          });
          router.push(`/shop/${activeShop.id}/invoices`);
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
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const isShopSetupValid = settings?.gstNumber && settings?.address;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-4rem)] relative">
      {/* Sticky Action Bar (Desktop Only) */}
      <div className="hidden lg:block fixed top-0 left-0 right-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border/40 px-8 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button type="button" variant="ghost" onClick={() => router.back()} className="gap-2">
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
            <div className="h-6 w-px bg-border/40" />
            <h2 className="text-lg font-semibold">
              {invoice ? 'Edit Invoice' : 'New Invoice'}
            </h2>
          </div>
          <div className="flex items-center gap-3">
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
              form="invoice-form"
              disabled={isPending || !isShopSetupValid}
              className="bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700 text-white shadow-lg shadow-gold-500/20"
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
      </div>

      {/* Left Column - Form */}
      <div className="lg:col-span-7 flex flex-col gap-6 h-full overflow-y-auto pb-20 lg:pb-6 lg:pt-20 no-scrollbar">
        <MotionWrapper className="space-y-6">
          {/* Mobile Header */}
          <div className="flex items-center justify-between lg:hidden">
            <Button type="button" variant="ghost" onClick={() => router.back()} className="gap-2 hover:bg-white/5">
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setShowPreview(!showPreview)} className="bg-white/5 border-white/10 hover:bg-white/10">
                {showPreview ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                {showPreview ? 'Hide Preview' : 'Show Preview'}
              </Button>
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
      <div className="hidden lg:col-span-5 lg:block sticky top-20 self-start h-[calc(100vh-6rem)] pt-4">
        <div className="rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-slate-900/50 backdrop-blur-xl p-4 h-full">
          <LiveInvoicePreview data={watchedValues} settings={settings} />
        </div>
      </div>
    </div>
  );
}
