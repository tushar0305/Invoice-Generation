"use client";

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Loader2, Save, AlertTriangle, Info } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useUser } from '@/supabase/provider';
import { supabase } from '@/supabase/client';
import { useActiveShop } from '@/hooks/use-active-shop';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import type { LoyaltySettings } from '@/lib/loyalty-types';
import { updateLoyaltySettingsAction } from '@/app/actions/loyalty-actions';

const loyaltySettingsSchema = z.object({
  isEnabled: z.boolean(),
  earningType: z.enum(['flat', 'percentage']),
  flatPointsRatio: z.coerce.number().min(0).optional(),
  percentageBack: z.coerce.number().min(0).max(100).optional(),
  redemptionEnabled: z.boolean(),
  redemptionConversionRate: z.coerce.number().min(0),
  maxRedemptionPercentage: z.coerce.number().min(0).max(100).optional(),
  minPointsRequired: z.coerce.number().min(0).optional(),
  pointsValidityDays: z.coerce.number().min(0).optional(),
  earnOnDiscountedItems: z.boolean(),
  earnOnFullPaymentOnly: z.boolean(),
});

type LoyaltySettingsValues = z.infer<typeof loyaltySettingsSchema>;

export function LoyaltySettingsForm() {
  const { toast } = useToast();
  const { user } = useUser();
  const { activeShop, permissions } = useActiveShop();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<LoyaltySettingsValues>({
    resolver: zodResolver(loyaltySettingsSchema),
    defaultValues: {
      isEnabled: false,
      earningType: 'flat',
      flatPointsRatio: 1,
      percentageBack: 1,
      redemptionEnabled: true,
      redemptionConversionRate: 1,
      maxRedemptionPercentage: 100,
      minPointsRequired: 0,
      pointsValidityDays: 365,
      earnOnDiscountedItems: true,
      earnOnFullPaymentOnly: false,
    },
  });

  useEffect(() => {
    const loadSettings = async () => {
      if (!activeShop) return;
      setIsLoading(true);

      const { data, error } = await supabase
        .from('shop_loyalty_settings')
        .select('*')
        .eq('shop_id', activeShop.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        console.error('Error loading loyalty settings:', error);
        // Don't show error toast for missing settings, just use defaults
      }

      if (data) {
        form.reset({
          isEnabled: data.is_enabled,
          earningType: data.earning_type || 'flat',
          flatPointsRatio: data.flat_points_ratio || 1,
          percentageBack: data.percentage_back || 1,
          redemptionEnabled: data.redemption_enabled,
          redemptionConversionRate: data.redemption_conversion_rate || 1,
          maxRedemptionPercentage: data.max_redemption_percentage || 100,
          minPointsRequired: data.min_points_required || 0,
          pointsValidityDays: data.points_validity_days || 365,
          earnOnDiscountedItems: data.earn_on_discounted_items,
          earnOnFullPaymentOnly: data.earn_on_full_payment_only,
        });
      }
      setIsLoading(false);
    };

    loadSettings();
  }, [activeShop, form, toast]);

  async function onSubmit(data: LoyaltySettingsValues) {
    if (!activeShop || !permissions.canEditSettings) {
      toast({ variant: 'destructive', title: 'Error', description: 'You do not have permission to update settings.' });
      return;
    }

    setIsSaving(true);
    try {
      const payload: Partial<LoyaltySettings> = {
        is_enabled: data.isEnabled,
        earning_type: data.earningType,
        flat_points_ratio: data.flatPointsRatio,
        percentage_back: data.percentageBack,
        redemption_enabled: data.redemptionEnabled,
        redemption_conversion_rate: data.redemptionConversionRate,
        max_redemption_percentage: data.maxRedemptionPercentage,
        min_points_required: data.minPointsRequired,
        points_validity_days: data.pointsValidityDays || null,
        earn_on_discounted_items: data.earnOnDiscountedItems,
        earn_on_full_payment_only: data.earnOnFullPaymentOnly,
      };

      const result = await updateLoyaltySettingsAction(activeShop.id, payload);

      if (!result.success) {
        throw new Error(result.error);
      }

      toast({ title: 'Success', description: 'Loyalty settings updated successfully.' });
    } catch (error: any) {
      console.error('Error saving loyalty settings:', error);
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to save settings.' });
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Switch
                checked={form.watch('isEnabled')}
                onCheckedChange={(checked) => form.setValue('isEnabled', checked)}
              />
              Enable Loyalty Program
            </CardTitle>
            <CardDescription>
              Turn on to start rewarding your customers with points.
            </CardDescription>
          </CardHeader>
          {form.watch('isEnabled') && (
            <CardContent className="space-y-6">

              {/* Earning Rules */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Earning Rules</h3>
                <Separator />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="earningType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Earning Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select earning type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="flat">Flat Points (e.g. 1 point per ₹100)</SelectItem>
                            <SelectItem value="percentage">Percentage Back (e.g. 1% of amount)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {form.watch('earningType') === 'flat' ? (
                    <FormField
                      control={form.control}
                      name="flatPointsRatio"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Points per Currency Unit</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" {...field} />
                          </FormControl>
                          <FormDescription>
                            How many points earned per 1 unit of currency. E.g., 0.01 means 1 point for every 100.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ) : (
                    <FormField
                      control={form.control}
                      name="percentageBack"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Percentage Back (%)</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.1" {...field} />
                          </FormControl>
                          <FormDescription>
                            Percentage of the invoice amount given as points.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>
              </div>

              {/* Redemption Rules */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Redemption Rules</h3>
                <Separator />
                <FormField
                  control={form.control}
                  name="redemptionEnabled"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Enable Redemption</FormLabel>
                        <FormDescription>
                          Allow customers to redeem their points.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {form.watch('redemptionEnabled') && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="redemptionConversionRate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Conversion Rate (1 Point = ? ₹)</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="maxRedemptionPercentage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Max Redemption % per Invoice</FormLabel>
                          <FormControl>
                            <Input type="number" step="1" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="minPointsRequired"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Min Points Required to Redeem</FormLabel>
                          <FormControl>
                            <Input type="number" step="1" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}
              </div>

              {/* Expiry & Conditions */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Expiry & Conditions</h3>
                <Separator />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="pointsValidityDays"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Points Expiry (Days)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="365" {...field} />
                        </FormControl>
                        <FormDescription>
                          Leave empty or 0 for no expiry.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="flex flex-col gap-4">
                  <FormField
                    control={form.control}
                    name="earnOnDiscountedItems"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            Earn on Discounted Items
                          </FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="earnOnFullPaymentOnly"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            Earn only on Full Payment
                          </FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={isSaving}>
                  {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Changes
                </Button>
              </div>
            </CardContent>
          )}
        </Card>
      </form>
    </Form>
  );
}
