"use client";

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import {
  Loader2, Upload, X, Image as ImageIcon,
  Store, Building2, Receipt, Shield,
  Save, Trash2, AlertTriangle, CreditCard,
  MapPin, Phone, Mail, FileText, Percent
} from 'lucide-react';
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
import { useActiveShop } from '@/hooks/use-active-shop';
// import type { UserSettings } from '@/lib/definitions';
import { Skeleton } from '@/components/ui/skeleton';
import { getSetupProgress } from '@/lib/shop-setup';
import { CelebrationModal } from '@/components/celebration-modal';
import { TemplateSelector } from '@/components/template-selector';
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from '@/lib/utils';

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
});

type SettingsFormValues = z.infer<typeof settingsFormSchema>;

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana",
  "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
  "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana",
  "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", "Andaman and Nicobar Islands", "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"
];

export default function SettingsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const { user, isUserLoading } = useUser();
  const { activeShop, permissions, isLoading: shopLoading } = useActiveShop();
  const [settings, setSettings] = useState<any | null>(null);
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

      if (activeShop) {
        // Map activeShop to the form structure
        // We use 'any' to bypass strict type checking against the deprecated UserSettings for now
        const mapped: any = {
          id: activeShop.id,
          userId: user.uid,
          cgstRate: Number(activeShop.cgstRate) || 0,
          sgstRate: Number(activeShop.sgstRate) || 0,
          shopName: activeShop.shopName || 'Jewellers Store',
          gstNumber: activeShop.gstNumber || '',
          panNumber: activeShop.panNumber || '',
          address: activeShop.address || '',
          state: activeShop.state || '',
          pincode: activeShop.pincode || '',
          phoneNumber: activeShop.phoneNumber || '',
          email: activeShop.email || '',
          templateId: activeShop.templateId || 'classic',
        };
        setSettings(mapped);
        setLogoUrl(activeShop.logoUrl || null);

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
  }, [user?.uid, activeShop, permissions, router, toast, form]);

  const handleLogoUpload = async (file: File) => {
    if (!user) {
      toast({ variant: 'destructive', title: 'Authentication Error', description: 'You must be logged in.' });
      return null;
    }

    if (!permissions.canEditSettings) {
      toast({ variant: 'destructive', title: 'Access Denied', description: 'Only shop owners can change the logo.' });
      return null;
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      toast({ variant: 'destructive', title: 'Invalid File Type', description: 'Please upload a JPEG, JPG, or PNG image.' });
      return null;
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({ variant: 'destructive', title: 'File Too Large', description: 'Logo must be less than 5MB.' });
      return null;
    }

    setUploadingLogo(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${user.uid}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('ShopLogo')
        .upload(filePath, file, { cacheControl: '3600', upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('ShopLogo')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('shops')
        .update({ logo_url: publicUrl })
        .eq('id', activeShop?.id);

      if (updateError) console.error('Failed to save logo URL:', updateError);

      setLogoUrl(publicUrl);
      toast({ title: 'Logo uploaded successfully!' });
      return publicUrl;
    } catch (error: any) {
      console.error('Logo upload error:', error);
      toast({ variant: 'destructive', title: 'Upload Failed', description: error.message || 'Failed to upload logo.' });
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
      const { error } = await supabase
        .from('shops')
        .update({ logo_url: null })
        .eq('id', activeShop?.id);

      if (error) throw error;

      setLogoUrl(null);
      setLogoFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      toast({ title: 'Logo removed successfully!' });
    } catch (error: any) {
      console.error('Remove logo error:', error);
      toast({ variant: 'destructive', title: 'Remove Failed', description: error.message || 'Failed to remove logo.' });
    } finally {
      setUploadingLogo(false);
    }
  };

  async function onSubmit(data: SettingsFormValues) {
    if (!user) {
      toast({ variant: 'destructive', title: 'Authentication Error', description: 'You must be logged in.' });
      return;
    }

    if (!permissions.canEditSettings || !activeShop) {
      toast({ variant: 'destructive', title: 'Access Denied', description: 'You do not have permission to update settings.' });
      return;
    }

    startTransition(async () => {
      try {
        const payload = {
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
        };

        const { error, data: updatedData } = await supabase
          .from('shops')
          .update(payload)
          .eq('id', activeShop.id)
          .select()
          .single();

        if (error) throw error;

        const updatedSettings: any = {
          id: activeShop.id,
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

        const newProgress = getSetupProgress(updatedSettings);
        if (!previousProgress && newProgress.isComplete) {
          setShowCelebration(true);
        }
        setPreviousProgress(newProgress.completionPercentage);

        toast({ title: 'Settings saved successfully!' });
      } catch (error: any) {
        console.error("Failed to save settings:", JSON.stringify(error, null, 2));
        toast({ variant: 'destructive', title: 'An error occurred', description: error?.message || 'Failed to save settings.' });
      }
    });
  }

  const isLoading = isUserLoading || settingsLoading || shopLoading;
  const progress = getSetupProgress(settings);

  // Wait for BOTH shop loading AND settings loading to complete
  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto space-y-6 p-6">
        <Skeleton className="h-64 w-full rounded-3xl bg-white/5" />
        <div className="grid md:grid-cols-2 gap-6">
          <Skeleton className="h-48 w-full rounded-3xl bg-white/5" />
          <Skeleton className="h-48 w-full rounded-3xl bg-white/5" />
        </div>
      </div>
    );
  }

  if (!permissions.canEditSettings) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center p-4">
        <Shield className="h-16 w-16 text-muted-foreground mb-4 opacity-50" />
        <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
        <p className="text-muted-foreground max-w-md">
          You do not have permission to manage settings. Only shop owners can access this page.
        </p>
      </div>
    );
  }

  return (
    <MotionWrapper className="max-w-5xl mx-auto space-y-8 pb-24">
      {isLoading ? (
        <div className="space-y-6">
          <Skeleton className="h-64 w-full rounded-3xl bg-white/5" />
          <div className="grid md:grid-cols-2 gap-6">
            <Skeleton className="h-48 w-full rounded-3xl bg-white/5" />
            <Skeleton className="h-48 w-full rounded-3xl bg-white/5" />
          </div>
        </div>
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <fieldset disabled={!permissions.canEditSettings} className="space-y-8">

              {/* Hero / Profile Section */}
              <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-background/60 to-background/30 backdrop-blur-xl shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 opacity-50"></div>
                <div className="relative z-10 p-8 md:p-10 flex flex-col md:flex-row items-center md:items-start gap-8">
                  {/* Logo Upload */}
                  <div className="relative group shrink-0">
                    <div className={cn(
                      "w-32 h-32 rounded-full border-4 border-white/10 shadow-2xl overflow-hidden flex items-center justify-center bg-background/50 backdrop-blur-md transition-all duration-500 group-hover:scale-105",
                      !logoUrl && "border-dashed"
                    )}>
                      {logoUrl ? (
                        <img src={logoUrl} alt="Shop Logo" className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon className="h-10 w-10 text-muted-foreground/40" />
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingLogo || !permissions.canEditSettings}
                      className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-2.5 shadow-lg hover:scale-110 transition-transform disabled:opacity-50 hover:shadow-primary/25"
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

                  {/* Shop Info Header */}
                  <div className="flex-1 text-center md:text-left space-y-4">
                    <div>
                      <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
                        {form.watch('shopName') || 'Your Shop'}
                      </h1>
                      <p className="text-muted-foreground mt-2 max-w-lg mx-auto md:mx-0">
                        Manage your shop's identity, tax settings, and invoice preferences in one place.
                      </p>
                    </div>

                    <div className="flex flex-wrap justify-center md:justify-start gap-3">
                      {!progress.isComplete && (
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 text-xs font-medium">
                          <AlertTriangle className="h-3 w-3" />
                          Profile {progress.completionPercentage}% Complete
                        </div>
                      )}
                      {logoUrl && permissions.canEditSettings && (
                        <Button type="button" variant="ghost" size="sm" onClick={handleRemoveLogo} className="text-destructive hover:text-destructive hover:bg-destructive/10 h-7 text-xs">
                          <Trash2 className="mr-2 h-3 w-3" /> Remove Logo
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Save Button (Floating on Desktop) */}
                  <div className="hidden md:block">
                    <Button type="submit" disabled={isPending} size="lg" className="shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all">
                      {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </Button>
                  </div>
                </div>
              </div>

              {/* Settings Grid */}
              <div className="grid md:grid-cols-2 gap-6">

                {/* Shop Details Card */}
                <Card className="border-white/10 bg-background/40 backdrop-blur-xl shadow-lg hover:shadow-xl transition-all duration-300 group">
                  <CardHeader className="pb-4">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-500 group-hover:scale-110 transition-transform duration-300">
                        <Store className="h-5 w-5" />
                      </div>
                      <CardTitle className="text-lg">Shop Details</CardTitle>
                    </div>
                    <CardDescription>Business information and contact details</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField control={form.control} name="shopName" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Shop Name</FormLabel>
                        <FormControl><Input className="bg-white/5 border-white/10 focus:bg-white/10 transition-colors" placeholder="e.g., Jewellers Store" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="address" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input className="pl-9 bg-white/5 border-white/10 focus:bg-white/10 transition-colors" placeholder="Full address" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <div className="grid grid-cols-2 gap-4">
                      <FormField control={form.control} name="state" render={({ field }) => (
                        <FormItem>
                          <FormLabel>State</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="bg-white/5 border-white/10 focus:bg-white/10 transition-colors">
                                <SelectValue placeholder="Select State" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {INDIAN_STATES.map((state) => (
                                <SelectItem key={state} value={state}>{state}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="pincode" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Pincode</FormLabel>
                          <FormControl><Input className="bg-white/5 border-white/10 focus:bg-white/10 transition-colors" placeholder="e.g., 302001" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <FormField control={form.control} name="phoneNumber" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                              <Input className="pl-9 bg-white/5 border-white/10 focus:bg-white/10 transition-colors" placeholder="Phone number" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <div className="space-y-2">
                        <FormLabel>Email</FormLabel>
                        <div className="relative">
                          <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input value={user?.email || ''} disabled readOnly className="pl-9 bg-muted/50 border-white/5 text-muted-foreground" />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Tax & Finance Card */}
                <Card className="border-white/10 bg-background/40 backdrop-blur-xl shadow-lg hover:shadow-xl transition-all duration-300 group">
                  <CardHeader className="pb-4">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500 group-hover:scale-110 transition-transform duration-300">
                        <Building2 className="h-5 w-5" />
                      </div>
                      <CardTitle className="text-lg">Tax & Finance</CardTitle>
                    </div>
                    <CardDescription>GST, PAN, and tax rate configuration</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField control={form.control} name="gstNumber" render={({ field }) => (
                        <FormItem>
                          <FormLabel>GST Number</FormLabel>
                          <FormControl><Input className="bg-white/5 border-white/10 focus:bg-white/10 transition-colors" placeholder="e.g., 08AAAAA..." {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="panNumber" render={({ field }) => (
                        <FormItem>
                          <FormLabel>PAN Number</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <CreditCard className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                              <Input className="pl-9 bg-white/5 border-white/10 focus:bg-white/10 transition-colors" placeholder="e.g., AAAAA..." {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <FormField control={form.control} name="cgstRate" render={({ field }) => (
                        <FormItem>
                          <FormLabel>CGST Rate (%)</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Percent className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                              <Input type="number" step="0.01" className="pl-9 bg-white/5 border-white/10 focus:bg-white/10 transition-colors" placeholder="1.5" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="sgstRate" render={({ field }) => (
                        <FormItem>
                          <FormLabel>SGST Rate (%)</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Percent className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                              <Input type="number" step="0.01" className="pl-9 bg-white/5 border-white/10 focus:bg-white/10 transition-colors" placeholder="1.5" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Mobile Save Button */}
              <div className="md:hidden">
                <Button type="submit" disabled={isPending} size="lg" className="w-full shadow-lg shadow-primary/20">
                  {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Changes
                </Button>
              </div>

              {/* Danger Zone */}
              {permissions.canEditSettings && (
                <div className="pt-8">
                  <Card className="border-destructive/20 bg-destructive/5 backdrop-blur-sm overflow-hidden">
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-destructive/10 text-destructive">
                          <AlertTriangle className="h-5 w-5" />
                        </div>
                        <CardTitle className="text-destructive">Danger Zone</CardTitle>
                      </div>
                      <CardDescription className="text-destructive/70">
                        Irreversible actions that will permanently delete your data
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between p-4 rounded-lg border border-destructive/10 bg-background/50">
                        <div>
                          <h4 className="font-medium text-foreground">Delete Account</h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            Permanently remove your account and all associated data
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="destructive"
                          onClick={async () => {
                            const confirmDelete = confirm('Are you absolutely sure? This cannot be undone.');
                            if (!confirmDelete) return;

                            const doubleConfirm = confirm('FINAL WARNING: Type your email to confirm deletion.');
                            if (!doubleConfirm) return;

                            try {
                              if (!user) throw new Error('No user found');
                              await supabase.from('invoices').delete().eq('user_id', user.uid);
                              await supabase.from('customers').delete().eq('user_id', user.uid);
                              await supabase.from('stock_items').delete().eq('user_id', user.uid);
                              // Shops will be handled by cascade or manual deletion if needed, but for now we just delete user data related
                              // If owner, maybe delete shop? For now let's keep it simple.
                              // await supabase.from('user_settings').delete().eq('user_id', user.uid); // Removed
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
                          Delete Account
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

            </fieldset>
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
