"use client";

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Loader2, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useTransition, useEffect } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/supabase/provider';
import { supabase } from '@/supabase/client';
import type { UserSettings } from '@/lib/definitions';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2 as LoaderIcon } from 'lucide-react';
import { getSetupProgress } from '@/lib/shop-setup';
import { CelebrationModal } from '@/components/celebration-modal';

const settingsFormSchema = z.object({
  cgstRate: z.coerce.number().min(0, 'CGST rate must be positive'),
  sgstRate: z.coerce.number().min(0, 'SGST rate must be positive'),
  shopName: z.string().trim().min(1, 'Shop name is required').optional(),
  gstNumber: z.string().trim().optional(),
  panNumber: z.string().trim().optional(),
  address: z.string().trim().optional(),
  state: z.string().trim().optional(),
  pincode: z.string().trim().optional(),
  phoneNumber: z.string().trim().optional(),
  // email is not part of the form schema anymore
});

type SettingsFormValues = z.infer<typeof settingsFormSchema>;

export default function SettingsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const { user, isUserLoading } = useUser();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [settingsLoading, setSettingsLoading] = useState<boolean>(true);
  const [showCelebration, setShowCelebration] = useState(false);
  const [previousProgress, setPreviousProgress] = useState(0);
  
  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsFormSchema),
    defaultValues: {
  cgstRate: 1.5,
  sgstRate: 1.5,
  shopName: 'Jewellers Store',
  gstNumber: '',
  panNumber: '',
  address: '',
  state: '',
  pincode: '',
  phoneNumber: '',
    },
  });

  useEffect(() => {
    const load = async () => {
      if (!user) { setSettings(null); setSettingsLoading(false); return; }
      setSettingsLoading(true);
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.uid)
        .maybeSingle();
      if (error) {
        console.error(error);
        setSettings(null);
      } else if (data) {
        const mapped: UserSettings = {
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
        };
        setSettings(mapped);
        form.reset({
          cgstRate: mapped.cgstRate,
          sgstRate: mapped.sgstRate,
          shopName: mapped.shopName || 'Jewellers Store',
          gstNumber: mapped.gstNumber || '',
          panNumber: mapped.panNumber || '',
          address: mapped.address || '',
          state: mapped.state || '',
          pincode: mapped.pincode || '',
          phoneNumber: mapped.phoneNumber || '',
        });
      } else {
        setSettings(null);
      }
      setSettingsLoading(false);
    };
    load();
  }, [user?.uid, form]);

  async function onSubmit(data: SettingsFormValues) {
    if (!user) {
        toast({ variant: 'destructive', title: 'Authentication Error', description: 'You must be logged in.'});
        return;
    }

    startTransition(async () => {
      try {
    const payload = {
      user_id: user.uid,
      cgst_rate: data.cgstRate,
      sgst_rate: data.sgstRate,
      shop_name: data.shopName || 'Jewellers Store',
      gst_number: data.gstNumber || '',
      pan_number: data.panNumber || '',
      address: data.address || '',
      state: data.state || '',
      pincode: data.pincode || '',
      phone_number: data.phoneNumber || '',
      email: user.email || '',
      updated_at: new Date().toISOString(),
    } as any;
    if (!settings) {
      payload.created_at = new Date().toISOString();
    }
    const { error, data: updatedData } = await supabase.from('user_settings').upsert(payload, { onConflict: 'user_id' }).select().single();
    if (error) throw error;
    
    // Update local settings state
    const updatedSettings: UserSettings = {
      id: user.uid,
      userId: user.uid,
      cgstRate: updatedData.cgst_rate,
      sgstRate: updatedData.sgst_rate,
      shopName: updatedData.shop_name,
      gstNumber: updatedData.gst_number,
      panNumber: updatedData.pan_number,
      address: updatedData.address,
      state: updatedData.state,
      pincode: updatedData.pincode,
      phoneNumber: updatedData.phone_number,
      email: updatedData.email,
    };
    setSettings(updatedSettings);
    
    // Check if profile just became complete
    const newProgress = getSetupProgress(updatedSettings);
    if (!previousProgress && newProgress.isComplete) {
      setShowCelebration(true);
    }
    setPreviousProgress(newProgress.completionPercentage);
    
    toast({ title: 'Settings saved successfully!' });
  } catch (error) {
    console.error("Failed to save settings:", error);
    toast({
      variant: 'destructive',
      title: 'An error occurred',
      description: 'Failed to save settings. Please try again.',
    });
  }
  });
  }
  
  const isLoading = isUserLoading || settingsLoading;
  const progress = getSetupProgress(settings);

  return (
    <>
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Profile & Tax Settings</CardTitle>
          <CardDescription>Your shop details appear on invoices. Tax rates auto-fill new invoices.</CardDescription>
          
          {/* Setup Progress Bar */}
          {!progress.isComplete && (
            <div className="mt-4 space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Setup Completion</span>
                <span className="font-semibold">{progress.completionPercentage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-blue-600 h-full transition-all duration-300"
                  style={{ width: `${progress.completionPercentage}%` }}
                />
              </div>
              {progress.missingFields.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  Missing: {progress.missingFields.join(', ')}
                </p>
              )}
            </div>
          )}
        </CardHeader>
        <CardContent>
            {isLoading ? (
                <div className="space-y-8">
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                     <div className="space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                    <Skeleton className="h-10 w-28" />
                </div>
            ) : (
                <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                    <div className="grid grid-cols-1 gap-6">
                      <FormField control={form.control} name="shopName" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Shop Name</FormLabel>
                          <FormControl><Input placeholder="e.g., Jewellers Store" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="address" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Address</FormLabel>
                          <FormControl><Input placeholder="Full address" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <FormField control={form.control} name="state" render={({ field }) => (
                          <FormItem>
                            <FormLabel>State</FormLabel>
                            <FormControl><Input placeholder="e.g., Rajasthan" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="pincode" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Pincode</FormLabel>
                            <FormControl><Input placeholder="e.g., 302001" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <FormField control={form.control} name="phoneNumber" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone</FormLabel>
                            <FormControl><Input placeholder="e.g., 9876543210" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <div>
                          <FormLabel>Email</FormLabel>
                          <Input
                            placeholder="you@example.com"
                            value={user?.email || ''}
                            disabled
                            readOnly
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <FormField control={form.control} name="gstNumber" render={({ field }) => (
                          <FormItem>
                            <FormLabel>GST Number</FormLabel>
                            <FormControl><Input placeholder="e.g., 08AAAAA0000A1Z5" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="panNumber" render={({ field }) => (
                          <FormItem>
                            <FormLabel>PAN Number</FormLabel>
                            <FormControl><Input placeholder="e.g., AAAAA0000A" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <FormField control={form.control} name="cgstRate" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Default CGST Rate (%)</FormLabel>
                            <FormControl><Input type="number" step="0.01" placeholder="e.g., 1.5" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="sgstRate" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Default SGST Rate (%)</FormLabel>
                            <FormControl><Input type="number" step="0.01" placeholder="e.g., 1.5" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                      </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-3 mt-2">
                      <Button type="submit" disabled={isPending} className="flex-1">
                          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Save Settings
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        className="sm:w-40"
                        onClick={async () => {
                          try {
                            const { error } = await supabase.auth.signOut();
                            if (error) throw error;
                            toast({ title: 'Signed Out', description: 'You have been signed out.' });
                          } catch (e) {
                            console.error(e);
                            toast({ variant: 'destructive', title: 'Sign out failed', description: 'Please try again.' });
                          }
                        }}
                      >
                        Sign Out
                      </Button>
                    </div>
                    
                    <div className="mt-8 pt-6 border-t border-destructive/20">
                      <div className="rounded-lg bg-destructive/5 p-4 border border-destructive/20">
                        <h3 className="text-sm font-semibold text-destructive mb-2">Danger Zone</h3>
                        <p className="text-xs text-muted-foreground mb-3">Once you delete your account, there is no going back. All your data including invoices, customers, and stock items will be permanently deleted.</p>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={async () => {
                            const confirmDelete = confirm(
                              'Are you absolutely sure you want to delete your account? This action cannot be undone and all your data will be permanently deleted.'
                            );
                            if (!confirmDelete) return;
                            
                            const doubleConfirm = confirm(
                              'FINAL WARNING: This will delete ALL your data permanently. Type your email to confirm deletion.'
                            );
                            if (!doubleConfirm) return;
                            
                            try {
                              if (!user) throw new Error('No user found');
                              
                              // Delete all user data
                              await supabase.from('invoices').delete().eq('user_id', user.uid);
                              await supabase.from('customers').delete().eq('user_id', user.uid);
                              await supabase.from('stock_items').delete().eq('user_id', user.uid);
                              await supabase.from('user_settings').delete().eq('user_id', user.uid);
                              
                              // Delete user account from Firebase Auth
                              const { error } = await supabase.auth.admin.deleteUser(user.uid);
                              if (error) throw error;
                              
                              toast({ 
                                title: 'Account Deleted', 
                                description: 'Your account has been permanently deleted.' 
                              });
                              
                              // Sign out and redirect
                              await supabase.auth.signOut();
                              router.push('/');
                            } catch (e: any) {
                              console.error('Delete account error:', e);
                              toast({ 
                                variant: 'destructive', 
                                title: 'Delete Failed', 
                                description: e.message || 'Failed to delete account. Please contact support.' 
                              });
                            }
                          }}
                        >
                          Delete Account Permanently
                        </Button>
                      </div>
                    </div>
                </form>
                </Form>
            )}
        </CardContent>
      </Card>
      
      <CelebrationModal 
        isOpen={showCelebration} 
        onClose={() => setShowCelebration(false)} 
      />
    </>
  );
}
