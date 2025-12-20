"use client";

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import {
  Loader2, Upload, X, Image as ImageIcon,
  Store, Building2, Receipt, Shield,
  Save, Trash2, AlertTriangle, CreditCard,
  MapPin, Phone, Mail, FileText, Percent,
  Gift, ArrowLeft, ChevronRight
} from 'lucide-react';
import { MotionWrapper } from '@/components/ui/motion-wrapper';
import { useRouter } from 'next/navigation';
import { useState, useTransition, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

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
import { PaletteSwitcher } from '@/components/palette-switcher';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LoyaltySettingsForm } from '@/components/loyalty-settings-form';
import { RateManager } from '@/components/dashboard/rate-manager';


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
  const { activeShop, permissions, isLoading: shopLoading, refreshShops } = useActiveShop();
  const [settings, setSettings] = useState<any | null>(null);
  const [settingsLoading, setSettingsLoading] = useState<boolean>(true);
  const [showCelebration, setShowCelebration] = useState(false);
  const [previousProgress, setPreviousProgress] = useState(0);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [mobileSection, setMobileSection] = useState<'menu' | 'general' | 'rates' | 'loyalty' | 'billing'>('menu');
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

        const { error, data: updatedRows } = await supabase
          .from('shops')
          .update(payload)
          .eq('id', activeShop.id)
          .select();

        if (error) {
          console.error('Supabase update error:', error);
          throw new Error(error.message || 'Database update failed');
        }

        // Handle case where no rows returned (RLS or not found)
        const updatedData = updatedRows?.[0];
        if (!updatedData) {
          console.error('No rows returned. RLS policy may be blocking. Shop ID:', activeShop.id, 'User:', user.uid);
          throw new Error('Settings update blocked. Check your permissions.');
        }

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

        // Refresh global context to reflect changes immediately
        await refreshShops();

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

  // Settings sections configuration
  const settingsSections = [
    { id: 'general' as const, label: 'General Settings', description: 'Shop details, logo & branding', icon: Store, color: 'bg-blue-500/10 text-blue-500' },
    { id: 'rates' as const, label: 'Market Rates', description: 'Gold & silver daily prices', icon: Receipt, color: 'bg-emerald-500/10 text-emerald-500' },
    { id: 'loyalty' as const, label: 'Loyalty Program', description: 'Points, rewards & tiers', icon: Gift, color: 'bg-pink-500/10 text-pink-500' },
    { id: 'billing' as const, label: 'Billing & Plans', description: 'Subscription & invoices', icon: CreditCard, color: 'bg-purple-500/10 text-purple-500' },
  ];

  return (
    <>
      {/* Mobile View - Native App Experience */}
      <div className="md:hidden min-h-screen bg-background">
        <AnimatePresence mode="wait">
          {mobileSection === 'menu' ? (
            <motion.div
              key="menu"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="pb-24"
            >
              {/* Header */}
              <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-lg border-b border-border/50 px-4 py-4">
                <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
                <p className="text-sm text-muted-foreground mt-0.5">Manage your store preferences</p>
              </div>

              {/* Settings Menu List */}
              <div className="p-4 space-y-2">
                {settingsSections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => setMobileSection(section.id)}
                    className="w-full flex items-center gap-4 p-4 rounded-2xl bg-card border border-border/50 hover:border-border active:scale-[0.98] transition-all duration-150 text-left group"
                  >
                    <div className={cn("p-3 rounded-xl", section.color)}>
                      <section.icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground">{section.label}</h3>
                      <p className="text-sm text-muted-foreground">{section.description}</p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                  </button>
                ))}
              </div>

              {/* Quick Info Card */}
              <div className="px-4 mt-4">
                <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10">
                  <div className="flex items-center gap-3 mb-2">
                    <Shield className="h-5 w-5 text-primary" />
                    <span className="font-medium text-sm">Shop Owner Access</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    You have full access to all settings as the shop owner.
                  </p>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key={mobileSection}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="min-h-screen pb-24"
            >
              {/* Section Header with Back Button */}
              <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-lg border-b border-border/50">
                <div className="flex items-center gap-3 px-4 py-3">
                  <button
                    onClick={() => setMobileSection('menu')}
                    className="p-2 -ml-2 rounded-xl hover:bg-muted active:scale-95 transition-all"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </button>
                  <div>
                    <h1 className="font-semibold text-lg">
                      {settingsSections.find(s => s.id === mobileSection)?.label}
                    </h1>
                  </div>
                </div>
              </div>

              {/* Section Content */}
              <div className="p-4">
                {/* Render content based on active mobile section */}
                {mobileSection === 'general' && (
                  <div className="space-y-6">
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <fieldset disabled={!permissions.canEditSettings} className="space-y-6">
                          {/* Logo Section */}
                          <div className="flex flex-col items-center gap-4 p-6 bg-card rounded-2xl border border-border/50">
                            <div className="relative">
                              <div className={cn(
                                "w-24 h-24 rounded-full border-4 border-background shadow-lg overflow-hidden flex items-center justify-center bg-muted",
                                !logoUrl && "border-dashed border-border"
                              )}>
                                {logoUrl ? (
                                  <img src={logoUrl} alt="Shop Logo" className="w-full h-full object-cover" />
                                ) : (
                                  <ImageIcon className="h-8 w-8 text-muted-foreground/40" />
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploadingLogo}
                                className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-2 shadow-lg"
                              >
                                {uploadingLogo ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                              </button>
                            </div>
                            <input ref={fileInputRef} type="file" accept="image/jpeg,image/jpg,image/png" onChange={handleFileChange} className="hidden" />
                            <FormField control={form.control} name="shopName" render={({ field }) => (
                              <FormItem className="w-full">
                                <FormLabel>Shop Name</FormLabel>
                                <FormControl><Input {...field} placeholder="Your shop name" className="text-center" /></FormControl>
                                <FormMessage />
                              </FormItem>
                            )} />
                          </div>

                          {/* Contact & Address */}
                          <div className="space-y-4">
                            <FormField control={form.control} name="phoneNumber" render={({ field }) => (
                              <FormItem>
                                <FormLabel>Phone</FormLabel>
                                <FormControl><Input {...field} placeholder="Phone number" /></FormControl>
                              </FormItem>
                            )} />
                            <FormField control={form.control} name="address" render={({ field }) => (
                              <FormItem>
                                <FormLabel>Address</FormLabel>
                                <FormControl><Input {...field} placeholder="Shop address" /></FormControl>
                              </FormItem>
                            )} />
                            <div className="grid grid-cols-2 gap-3">
                              <FormField control={form.control} name="state" render={({ field }) => (
                                <FormItem>
                                  <FormLabel>State</FormLabel>
                                  <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                      <SelectTrigger><SelectValue placeholder="State" /></SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {INDIAN_STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                    </SelectContent>
                                  </Select>
                                </FormItem>
                              )} />
                              <FormField control={form.control} name="pincode" render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Pincode</FormLabel>
                                  <FormControl><Input {...field} placeholder="PIN" /></FormControl>
                                </FormItem>
                              )} />
                            </div>
                          </div>

                          {/* Tax Info */}
                          <div className="space-y-4 p-4 bg-muted/30 rounded-xl border border-border/50">
                            <h3 className="font-semibold text-sm flex items-center gap-2">
                              <Building2 className="h-4 w-4 text-muted-foreground" />
                              Tax Information
                            </h3>
                            <div className="grid grid-cols-2 gap-3">
                              <FormField control={form.control} name="gstNumber" render={({ field }) => (
                                <FormItem><FormLabel>GST No.</FormLabel><FormControl><Input {...field} placeholder="GST" /></FormControl></FormItem>
                              )} />
                              <FormField control={form.control} name="panNumber" render={({ field }) => (
                                <FormItem><FormLabel>PAN No.</FormLabel><FormControl><Input {...field} placeholder="PAN" /></FormControl></FormItem>
                              )} />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <FormField control={form.control} name="cgstRate" render={({ field }) => (
                                <FormItem><FormLabel>CGST %</FormLabel><FormControl><Input type="number" step="0.1" {...field} /></FormControl></FormItem>
                              )} />
                              <FormField control={form.control} name="sgstRate" render={({ field }) => (
                                <FormItem><FormLabel>SGST %</FormLabel><FormControl><Input type="number" step="0.1" {...field} /></FormControl></FormItem>
                              )} />
                            </div>
                          </div>

                          {/* Save Button */}
                          <Button type="submit" disabled={isPending} className="w-full h-12 text-base font-semibold">
                            {isPending ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Saving...</> : <><Save className="mr-2 h-5 w-5" />Save Changes</>}
                          </Button>
                        </fieldset>
                      </form>
                    </Form>
                  </div>
                )}

                {mobileSection === 'rates' && (
                  <Card className="border-border/50">
                    <CardContent className="p-6">
                      <RateManager shopId={activeShop?.id || ''} />
                    </CardContent>
                  </Card>
                )}

                {mobileSection === 'loyalty' && (
                  <Card className="border-border/50">
                    <CardContent className="p-6">
                      <LoyaltySettingsForm />
                    </CardContent>
                  </Card>
                )}

                {mobileSection === 'billing' && (
                  <Card className="border-border/50">
                    <CardContent className="p-6 space-y-4">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 rounded-xl bg-purple-500/10">
                          <CreditCard className="h-6 w-6 text-purple-500" />
                        </div>
                        <div>
                          <h3 className="font-semibold">Subscription</h3>
                          <p className="text-sm text-muted-foreground">Manage your plan</p>
                        </div>
                      </div>
                      <div className="p-4 bg-muted/50 rounded-xl border border-border">
                        <p className="text-sm text-muted-foreground mb-4">
                          Upgrade to Pro for unlimited invoices & analytics.
                        </p>
                        <Button asChild className="w-full">
                          <a href={`/shop/${activeShop?.id}/settings/billing`}>Manage Subscription</a>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Settings Bottom Nav */}
              <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-lg border-t border-border/50 px-4 py-2 z-50">
                <div className="flex justify-around">
                  {settingsSections.map((section) => (
                    <button
                      key={section.id}
                      onClick={() => setMobileSection(section.id)}
                      className={cn(
                        "flex flex-col items-center gap-1 py-2 px-3 rounded-xl transition-all",
                        mobileSection === section.id
                          ? "text-primary bg-primary/10"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <section.icon className="h-5 w-5" />
                      <span className="text-[10px] font-medium">{section.id.charAt(0).toUpperCase() + section.id.slice(1, 3)}</span>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Desktop View - Keep existing tabs */}
      <div className="hidden md:block">
        <MotionWrapper className="max-w-5xl mx-auto space-y-8 p-6 pb-24">
          <Tabs defaultValue="general" className="w-full">
            {/* Desktop Tab Navigation */}
            <div className="mb-6">
              <TabsList className="w-full grid grid-cols-4 p-1 h-auto bg-muted/50 rounded-xl border border-border/50">
                <TabsTrigger value="general" className="flex items-center gap-2 py-2.5 px-4 data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg">
                  <Store className="h-4 w-4" />
                  <span className="text-sm font-medium">General</span>
                </TabsTrigger>
                <TabsTrigger value="rates" className="flex items-center gap-2 py-2.5 px-4 data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg">
                  <Receipt className="h-4 w-4" />
                  <span className="text-sm font-medium">Rates</span>
                </TabsTrigger>
                <TabsTrigger value="loyalty" className="flex items-center gap-2 py-2.5 px-4 data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg">
                  <Gift className="h-4 w-4" />
                  <span className="text-sm font-medium">Loyalty</span>
                </TabsTrigger>
                <TabsTrigger value="billing" className="flex items-center gap-2 py-2.5 px-4 data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg">
                  <CreditCard className="h-4 w-4" />
                  <span className="text-sm font-medium">Billing</span>
                </TabsTrigger>
              </TabsList>
            </div>


            <TabsContent value="general">
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
                      <div className="relative overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
                        <div className="absolute inset-0 bg-primary/5 opacity-30"></div>
                        <div className="relative z-10 p-8 md:p-10 flex flex-col md:flex-row items-center md:items-start gap-8">
                          {/* Logo Upload */}
                          <div className="relative group shrink-0">
                            <div className={cn(
                              "w-32 h-32 rounded-full border-4 border-background shadow-lg overflow-hidden flex items-center justify-center bg-muted transition-all duration-500 group-hover:scale-105",
                              !logoUrl && "border-dashed border-border"
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
                              <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                                {form.watch('shopName') || 'Your Shop'}
                              </h1>
                              <p className="text-muted-foreground mt-2 max-w-lg mx-auto md:mx-0">
                                Manage your shop's identity, tax settings, and invoice preferences in one place.
                              </p>
                            </div>

                            <div className="flex flex-wrap justify-center md:justify-start gap-3">
                              {!progress.isComplete && (
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-600 dark:text-yellow-500 text-xs font-medium">
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
                        <Card className="border border-border shadow-sm hover:shadow-md transition-all duration-300 group">
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
                                <FormControl><Input className="bg-background border-input focus:border-primary transition-colors" placeholder="e.g., Jewellers Store" {...field} /></FormControl>
                                <FormMessage />
                              </FormItem>
                            )} />
                            <FormField control={form.control} name="address" render={({ field }) => (
                              <FormItem>
                                <FormLabel>Address</FormLabel>
                                <FormControl>
                                  <div className="relative">
                                    <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input className="pl-9 bg-background border-input focus:border-primary transition-colors" placeholder="Full address" {...field} />
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
                                      <SelectTrigger className="bg-background border-input focus:border-primary transition-colors">
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
                                  <FormControl><Input className="bg-background border-input focus:border-primary transition-colors" placeholder="e.g., 302001" {...field} /></FormControl>
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
                                      <Input className="pl-9 bg-background border-input focus:border-primary transition-colors" placeholder="Phone number" {...field} />
                                    </div>
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )} />
                              <div className="space-y-2">
                                <FormLabel>Email</FormLabel>
                                <div className="relative">
                                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                  <Input value={user?.email || ''} disabled readOnly className="pl-9 bg-muted text-muted-foreground border-input" />
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        {/* Invoice Design Card - Removed as per user request */}

                        {/* Tax & Finance Card */}
                        <Card className="border border-border shadow-sm hover:shadow-md transition-all duration-300 group">
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
                                  <FormControl><Input className="bg-background border-input focus:border-primary transition-colors" placeholder="e.g., 08AAAAA..." {...field} /></FormControl>
                                  <FormMessage />
                                </FormItem>
                              )} />
                              <FormField control={form.control} name="panNumber" render={({ field }) => (
                                <FormItem>
                                  <FormLabel>PAN Number</FormLabel>
                                  <FormControl>
                                    <div className="relative">
                                      <CreditCard className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                      <Input className="pl-9 bg-background border-input focus:border-primary transition-colors" placeholder="e.g., AAAAA..." {...field} />
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
                                      <Input type="number" step="0.01" className="pl-9 bg-background border-input focus:border-primary transition-colors" placeholder="1.5" {...field} />
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
                                      <Input type="number" step="0.01" className="pl-9 bg-background border-input focus:border-primary transition-colors" placeholder="1.5" {...field} />
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

                      {/* Danger Zone — removed as requested */}

                    </fieldset>
                  </form>
                </Form>
              )}
            </TabsContent>

            <TabsContent value="rates">
              {activeShop ? (
                <RateManager shopId={activeShop.id} />
              ) : (
                <div className="p-8 text-center text-muted-foreground">Loading shop details...</div>
              )}
            </TabsContent>

            <TabsContent value="loyalty">
              <LoyaltySettingsForm />
            </TabsContent>

            <TabsContent value="billing">
              <Card className="border border-border shadow-sm">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-500">
                      <CreditCard className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-lg">Subscription & Billing</CardTitle>
                  </div>
                  <CardDescription>
                    Manage your subscription plan, view invoices, and update payment methods.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-muted/50 rounded-lg p-4 border border-border">
                    <h4 className="font-semibold mb-2">Current Plan</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Upgrade to Pro to unlock unlimited invoices, advanced analytics, and priority support.
                    </p>
                    <Button asChild className="w-full sm:w-auto">
                      <a href={`/shop/${activeShop?.id}/settings/billing`}>
                        Manage Subscription <Store className="ml-2 h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <CelebrationModal
            isOpen={showCelebration}
            onClose={() => setShowCelebration(false)}
          />
        </MotionWrapper>
      </div>
    </>
  );
}

