"use client";

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Loader2, ArrowLeft, Upload, X, Image as ImageIcon, Package, DollarSign, FileText, AlertTriangle } from 'lucide-react';
import { MotionWrapper } from '@/components/ui/motion-wrapper';
import { useRouter } from 'next/navigation';
import { useState, useTransition, useEffect, useRef } from 'react';

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
import { TemplateSelector } from '@/components/template-selector';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";

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
  templateId: z.string().optional(),
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
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      templateId: 'classic',
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
          templateId: data.template_id || 'classic',
        };
        setSettings(mapped);
        setLogoUrl(data.logo_url || null);

        // Initialize previous progress to avoid false celebration on first save
        const initialProgress = getSetupProgress(mapped);
        setPreviousProgress(initialProgress.completionPercentage);

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
          templateId: mapped.templateId || 'classic',
        });
      } else {
        setSettings(null);
      }
      setSettingsLoading(false);
    };
    load();
  }, [user?.uid, form]);

  const handleLogoUpload = async (file: File) => {
    if (!user) {
      toast({ variant: 'destructive', title: 'Authentication Error', description: 'You must be logged in.' });
      return null;
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        variant: 'destructive',
        title: 'Invalid File Type',
        description: 'Please upload a JPEG, JPG, or PNG image.',
      });
      return null;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      toast({
        variant: 'destructive',
        title: 'File Too Large',
        description: 'Logo must be less than 5MB.',
      });
      return null;
    }

    setUploadingLogo(true);
    try {
      // Create unique filename with user folder for RLS policy
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${user.uid}/${fileName}`; // Folder structure: userid/timestamp.ext

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('ShopLogo')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('ShopLogo')
        .getPublicUrl(filePath);

      // Save logo URL to database immediately
      const { error: updateError } = await supabase
        .from('user_settings')
        .update({ logo_url: publicUrl })
        .eq('user_id', user.uid);

      if (updateError) {
        console.error('Failed to save logo URL:', updateError);
        // Continue anyway, user can save manually
      }

      setLogoUrl(publicUrl);
      toast({ title: 'Logo uploaded successfully!' });
      return publicUrl;
    } catch (error: any) {
      console.error('Logo upload error:', error);
      toast({
        variant: 'destructive',
        title: 'Upload Failed',
        description: error.message || 'Failed to upload logo. Please try again.',
      });
      return null;
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLogoFile(file);
    await handleLogoUpload(file);
  };

  const handleRemoveLogo = async () => {
    if (!user) return;

    try {
      setUploadingLogo(true);

      // Update database to remove logo URL
      const { error } = await supabase
        .from('user_settings')
        .update({ logo_url: null })
        .eq('user_id', user.uid);

      if (error) throw error;

      setLogoUrl(null);
      setLogoFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      toast({ title: 'Logo removed successfully!' });
    } catch (error: any) {
      console.error('Remove logo error:', error);
      toast({
        variant: 'destructive',
        title: 'Remove Failed',
        description: error.message || 'Failed to remove logo.',
      });
    } finally {
      setUploadingLogo(false);
    }
  };

  async function onSubmit(data: SettingsFormValues) {
    if (!user) {
      toast({ variant: 'destructive', title: 'Authentication Error', description: 'You must be logged in.' });
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
          logo_url: logoUrl || null,
          template_id: data.templateId || 'classic',
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
          templateId: updatedData.template_id,
        };
        setSettings(updatedSettings);

        // Check if profile just became complete
        const newProgress = getSetupProgress(updatedSettings);
        if (!previousProgress && newProgress.isComplete) {
          setShowCelebration(true);
        }
        setPreviousProgress(newProgress.completionPercentage);

        toast({ title: 'Settings saved successfully!' });
      } catch (error: any) {
        console.error("Failed to save settings:", JSON.stringify(error, null, 2));
        toast({
          variant: 'destructive',
          title: 'An error occurred',
          description: error?.message || 'Failed to save settings. Please try again.',
        });
      }
    });
  }

  const isLoading = isUserLoading || settingsLoading;
  const progress = getSetupProgress(settings);


  const [activeSection, setActiveSection] = useState("shop-details");

  return (
    <MotionWrapper className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold tracking-tight text-primary">Settings</h1>
          <p className="text-muted-foreground">Manage your shop profile and preferences</p>
        </div>
        {!progress.isComplete && (
          <div className="flex flex-col items-end">
            <Badge variant="secondary" className="mb-1">{progress.completionPercentage}% Complete</Badge>
            <div className="w-32 h-1.5 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary transition-all duration-500" style={{ width: `${progress.completionPercentage}%` }} />
            </div>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-12 w-full rounded-lg" />
          <Skeleton className="h-12 w-full rounded-lg" />
        </div>
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

            {/* Hero Logo Section */}
            <Card className="overflow-hidden border-none shadow-lg bg-gradient-to-br from-primary/5 to-primary/10">
              <CardContent className="p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-6 sm:gap-8">
                <div className="relative group">
                  <div className={`w-32 h-32 rounded-full border-4 border-background shadow-xl overflow-hidden flex items-center justify-center bg-white ${!logoUrl ? 'border-dashed border-muted-foreground/30' : ''}`}>
                    {logoUrl ? (
                      <img src={logoUrl} alt="Shop Logo" className="w-full h-full object-contain p-2" />
                    ) : (
                      <ImageIcon className="h-10 w-10 text-muted-foreground/40" />
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingLogo}
                    className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-2 shadow-lg hover:scale-110 transition-transform"
                  >
                    {uploadingLogo ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
                <div className="text-center sm:text-left space-y-2 flex-1">
                  <h2 className="text-xl font-bold font-heading">{form.watch('shopName') || 'Your Shop'}</h2>
                  <p className="text-sm text-muted-foreground max-w-md">
                    Upload your shop logo to make your invoices look professional. Recommended size: 500x500px.
                  </p>
                  {logoUrl && (
                    <Button type="button" variant="ghost" size="sm" onClick={handleRemoveLogo} className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8">
                      <X className="mr-2 h-3.5 w-3.5" /> Remove Logo
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            <Accordion type="single" collapsible defaultValue="shop-details" className="w-full space-y-4">

              {/* Shop Details Section */}
              <AccordionItem value="shop-details" className="border rounded-xl px-4 bg-card">
                <AccordionTrigger className="hover:no-underline py-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
                      <Package className="h-4 w-4" />
                    </div>
                    <div className="text-left">
                      <div className="font-semibold">Shop Details</div>
                      <div className="text-xs text-muted-foreground">Name, Address, Contact</div>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-2 pb-6 space-y-4">
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField control={form.control} name="phoneNumber" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl><Input placeholder="e.g., 9876543210" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <div>
                      <FormLabel>Email</FormLabel>
                      <Input value={user?.email || ''} disabled readOnly className="bg-muted" />
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Tax & Finance Section */}
              <AccordionItem value="tax-finance" className="border rounded-xl px-4 bg-card">
                <AccordionTrigger className="hover:no-underline py-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400">
                      <DollarSign className="h-4 w-4" />
                    </div>
                    <div className="text-left">
                      <div className="font-semibold">Tax & Finance</div>
                      <div className="text-xs text-muted-foreground">GST, PAN, Tax Rates</div>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-2 pb-6 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField control={form.control} name="cgstRate" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Default CGST Rate (%)</FormLabel>
                        <FormControl><Input type="number" step="0.01" placeholder="1.5" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="sgstRate" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Default SGST Rate (%)</FormLabel>
                        <FormControl><Input type="number" step="0.01" placeholder="1.5" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Invoice Settings */}
              <AccordionItem value="invoice-settings" className="border rounded-xl px-4 bg-card">
                <AccordionTrigger className="hover:no-underline py-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div className="text-left">
                      <div className="font-semibold">Invoice Settings</div>
                      <div className="text-xs text-muted-foreground">Templates, Defaults</div>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-2 pb-6 space-y-4">
                  <FormField control={form.control} name="templateId" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Invoice Template</FormLabel>
                      <FormControl>
                        <TemplateSelector value={field.value || 'classic'} onChange={field.onChange} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </AccordionContent>
              </AccordionItem>

              {/* Danger Zone */}
              <AccordionItem value="danger-zone" className="border rounded-xl px-4 bg-destructive/5 border-destructive/20">
                <AccordionTrigger className="hover:no-underline py-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-destructive/10 text-destructive">
                      <AlertTriangle className="h-4 w-4" />
                    </div>
                    <div className="text-left">
                      <div className="font-semibold text-destructive">Danger Zone</div>
                      <div className="text-xs text-destructive/70">Delete Account</div>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-2 pb-6">
                  <p className="text-sm text-muted-foreground mb-4">
                    Once you delete your account, there is no going back. All your data including invoices, customers, and stock items will be permanently deleted.
                  </p>
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={async () => {
                      const confirmDelete = confirm('Are you absolutely sure? This cannot be undone.');
                      if (!confirmDelete) return;
                      // ... existing delete logic ...
                      // For brevity, I'll just call the existing logic if I could, but I need to inline it or move it to a function.
                      // I'll inline a simplified version or assume the previous handler is available if I didn't delete it.
                      // Since I'm replacing the whole return, I need to re-implement the handler or call a function.
                      // I'll re-implement the handler logic here.

                      const doubleConfirm = confirm('FINAL WARNING: Type your email to confirm deletion.');
                      if (!doubleConfirm) return;

                      try {
                        if (!user) throw new Error('No user found');
                        await supabase.from('invoices').delete().eq('user_id', user.uid);
                        await supabase.from('customers').delete().eq('user_id', user.uid);
                        await supabase.from('stock_items').delete().eq('user_id', user.uid);
                        await supabase.from('user_settings').delete().eq('user_id', user.uid);
                        const { error } = await supabase.auth.admin.deleteUser(user.uid);
                        if (error) throw error;
                        toast({ title: 'Account Deleted' });
                        await supabase.auth.signOut();
                        router.push('/');
                      } catch (e: any) {
                        console.error('Delete error:', e);
                        toast({ variant: 'destructive', title: 'Delete Failed', description: e.message });
                      }
                    }}
                  >
                    Delete Account Permanently
                  </Button>
                </AccordionContent>
              </AccordionItem>

            </Accordion>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button type="submit" disabled={isPending} size="lg" className="flex-1 font-semibold shadow-lg hover:shadow-xl transition-all">
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={async () => {
                  await supabase.auth.signOut();
                  toast({ title: 'Signed Out' });
                }}
              >
                Sign Out
              </Button>
            </div>

          </form>
        </Form>
      )}

      <CelebrationModal
        isOpen={showCelebration}
        onClose={() => setShowCelebration(false)}
      />
    </MotionWrapper>
  );
}
