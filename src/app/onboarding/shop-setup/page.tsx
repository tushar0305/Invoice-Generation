'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Building2,
    Phone,
    Mail,
    MapPin,
    FileText,
    Upload,
    Check,
    ArrowRight,
    ArrowLeft,
    Loader2,
    Sparkles,
    X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/supabase/client';
import { useUser } from '@/supabase/provider';
import { cn } from '@/lib/utils';
import type { ShopSetupData } from '@/lib/definitions';

// Validation schemas for each step
const step1Schema = z.object({
    shopName: z.string().min(2, 'Shop name must be at least 2 characters'),
    phoneNumber: z.string().regex(/^[0-9]{10}$/, 'Please enter a valid 10-digit phone number'),
    email: z.string().email('Please enter a valid email'),
});

const step2Schema = z.object({
    address: z.string().min(5, 'Please enter your complete address'),
    state: z.string().min(2, 'Please select a state'),
    pincode: z.string().regex(/^[0-9]{6}$/, 'Please enter a valid 6-digit pincode'),
    gstNumber: z.string().regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'Invalid GSTIN format').optional().or(z.literal('')),
    panNumber: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Invalid PAN format').optional().or(z.literal('')),
});

const step3Schema = z.object({
    cgstRate: z.number().min(0).max(50),
    sgstRate: z.number().min(0).max(50),
    templateId: z.string(),
});

const INDIAN_STATES = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
    'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
    'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
    'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
    'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
    'Delhi', 'Puducherry', 'Jammu and Kashmir', 'Ladakh',
];

export default function ShopSetupPage() {
    const [currentStep, setCurrentStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState<string>('');
    const router = useRouter();
    const { toast } = useToast();
    const { user } = useUser();

    const [formData, setFormData] = useState<Partial<ShopSetupData>>({
        email: user?.email || '',
        cgstRate: 1.5,
        sgstRate: 1.5,
        templateId: 'classic',
    });

    // Restore onboarding step from database
    useEffect(() => {
        const restoreProgress = async () => {
            if (!user) return;

            try {
                const { data, error } = await supabase
                    .from('user_preferences')
                    .select('onboarding_step')
                    .eq('user_id', user.uid)
                    .maybeSingle();

                if (!error && data?.onboarding_step) {
                    // Only restore if step is valid (1, 2, or 3)
                    if (data.onboarding_step >= 1 && data.onboarding_step <= 3) {
                        setCurrentStep(data.onboarding_step);
                    }
                }
            } catch (err) {
                console.warn('Failed to restore onboarding progress:', err);
            }
        };

        restoreProgress();
    }, [user]);

    const step1Form = useForm({
        resolver: zodResolver(step1Schema),
        defaultValues: {
            shopName: formData.shopName || '',
            phoneNumber: formData.phoneNumber || '',
            email: formData.email || '',
        },
    });

    const step2Form = useForm({
        resolver: zodResolver(step2Schema),
        defaultValues: {
            address: formData.address || '',
            state: formData.state || '',
            pincode: formData.pincode || '',
            gstNumber: formData.gstNumber || '',
            panNumber: formData.panNumber || '',
        },
    });

    const step3Form = useForm({
        resolver: zodResolver(step3Schema),
        defaultValues: {
            cgstRate: formData.cgstRate || 1.5,
            sgstRate: formData.sgstRate || 1.5,
            templateId: formData.templateId || 'classic',
        },
    });

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                toast({
                    variant: 'destructive',
                    title: 'File too large',
                    description: 'Please upload an image smaller than 5MB',
                });
                return;
            }
            setLogoFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setLogoPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleStep1Next = step1Form.handleSubmit((data) => {
        setFormData(prev => ({ ...prev, ...data }));
        setCurrentStep(2);
        supabase.rpc('update_onboarding_step', { p_step: 1 });
    });

    const handleStep2Next = step2Form.handleSubmit((data) => {
        setFormData(prev => ({ ...prev, ...data }));
        setCurrentStep(3);
        supabase.rpc('update_onboarding_step', { p_step: 2 });
    });

    const handleFinalSubmit = step3Form.handleSubmit(async (data) => {
        setIsLoading(true);
        try {
            const finalData = { ...formData, ...data };

            // Upload logo only if file provided (make it truly optional)
            let logoUrl = '';
            if (logoFile) {
                try {
                    const fileExt = logoFile.name.split('.').pop();
                    const fileName = `${user?.uid}-${Date.now()}.${fileExt}`;

                    // Try to upload, but don't fail if bucket doesn't exist
                    const { data: uploadData, error: uploadError } = await supabase.storage
                        .from('ShopLogo')
                        .upload(fileName, logoFile);

                    if (!uploadError) {
                        const { data: { publicUrl } } = supabase.storage
                            .from('ShopLogo')
                            .getPublicUrl(fileName);
                        logoUrl = publicUrl;
                    } else {
                        console.warn('Logo upload failed (non-critical):', uploadError);
                        // Continue without logo
                    }
                } catch (logoErr) {
                    console.warn('Logo upload error (non-critical):', logoErr);
                    // Continue without logo
                }
            }

            // Create shop with ALL details at once (avoids RLS issues)
            const { data: shopId, error: shopError } = await supabase.rpc('create_new_shop_with_details', {
                p_shop_name: finalData.shopName!,
                p_phone_number: finalData.phoneNumber || null,
                p_email: finalData.email || null,
                p_address: finalData.address || null,
                p_state: finalData.state || null,
                p_pincode: finalData.pincode || null,
                p_gst_number: finalData.gstNumber || null,
                p_pan_number: finalData.panNumber || null,
                p_logo_url: logoUrl || null,
                p_cgst_rate: finalData.cgstRate || 1.5,
                p_sgst_rate: finalData.sgstRate || 1.5,
                p_template_id: finalData.templateId || 'classic',
            });

            if (shopError) {
                console.error('Shop creation error:', shopError);
                throw new Error('Failed to create shop: ' + (shopError.message || 'Unknown error'));
            }

            // Mark onboarding as complete
            const { error: onboardingError } = await supabase.rpc('complete_onboarding', { p_shop_id: shopId });

            if (onboardingError) {
                console.warn('Onboarding completion warning:', onboardingError);
                // Don't fail, just warn
            }

            toast({
                title: '🎉 Shop created successfully!',
                description: 'Welcome to SwarnaVyapar',
            });

            // Use window.location.href instead of router.push to force full page reload
            // This ensures AuthWrapper refreshes onboarding_completed status
            setTimeout(() => {
                window.location.href = '/dashboard/admin';
            }, 500);
        } catch (error: any) {
            console.error('Shop setup error:', error);
            toast({
                variant: 'destructive',
                title: 'Setup failed',
                description: error.message || 'Please try again. Contact support if issue persists.',
            });
        } finally {
            setIsLoading(false);
        }
    });

    const renderStep1 = () => (
        <div className="space-y-6">
            <div className="text-center space-y-2 mb-8">
                <h2 className="text-3xl font-bold font-heading bg-gradient-to-r from-gold-600 to-amber-600 bg-clip-text text-transparent">
                    Welcome! Let's Get Started
                </h2>
                <p className="text-muted-foreground">Tell us about your jewellery shop</p>
            </div>

            <div className="space-y-5">
                <div className="space-y-2">
                    <Label htmlFor="shopName" className="text-sm font-semibold">Shop Name *</Label>
                    <div className="relative">
                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gold-500" />
                        <Input
                            id="shopName"
                            placeholder="e.g., Shree Jewellers"
                            className="pl-11 h-12 text-lg bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus:border-gold-500 focus:ring-gold-500/20"
                            {...step1Form.register('shopName')}
                        />
                    </div>
                    {step1Form.formState.errors.shopName && (
                        <p className="text-sm text-destructive">{step1Form.formState.errors.shopName.message}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="phoneNumber" className="text-sm font-semibold">Phone Number *</Label>
                    <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gold-500" />
                        <Input
                            id="phoneNumber"
                            placeholder="9876543210"
                            maxLength={10}
                            className="pl-11 h-12 text-lg bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus:border-gold-500 focus:ring-gold-500/20"
                            {...step1Form.register('phoneNumber')}
                        />
                    </div>
                    {step1Form.formState.errors.phoneNumber && (
                        <p className="text-sm text-destructive">{step1Form.formState.errors.phoneNumber.message}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-semibold">Email *</Label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gold-500" />
                        <Input
                            id="email"
                            type="email"
                            placeholder="shop@example.com"
                            className="pl-11 h-12 text-lg bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus:border-gold-500 focus:ring-gold-500/20"
                            {...step1Form.register('email')}
                        />
                    </div>
                    {step1Form.formState.errors.email && (
                        <p className="text-sm text-destructive">{step1Form.formState.errors.email.message}</p>
                    )}
                </div>

                <Button onClick={handleStep1Next} className="w-full h-13 text-lg font-semibold mt-8 bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700 shadow-lg shadow-gold-500/25">
                    Continue
                    <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
            </div>
        </div>
    );

    const renderStep2 = () => (
        <div className="space-y-6">
            <div className="text-center space-y-2 mb-8">
                <h2 className="text-3xl font-bold font-heading bg-gradient-to-r from-gold-600 to-amber-600 bg-clip-text text-transparent">
                    Business Details
                </h2>
                <p className="text-muted-foreground">Help us complete your business profile</p>
            </div>

            <div className="space-y-5">
                <div className="space-y-2">
                    <Label htmlFor="address" className="text-sm font-semibold">Address *</Label>
                    <div className="relative">
                        <MapPin className="absolute left-3 top-3 h-5 w-5 text-gold-500" />
                        <Input
                            id="address"
                            placeholder="123, Main Street, Shop No. 5"
                            className="pl-11 h-12 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus:border-gold-500 focus:ring-gold-500/20"
                            {...step2Form.register('address')}
                        />
                    </div>
                    {step2Form.formState.errors.address && (
                        <p className="text-sm text-destructive">{step2Form.formState.errors.address.message}</p>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="state" className="text-sm font-semibold">State *</Label>
                        <Select
                            value={step2Form.watch('state')}
                            onValueChange={(value) => step2Form.setValue('state', value)}
                        >
                            <SelectTrigger className="h-12 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800">
                                <SelectValue placeholder="Select state" />
                            </SelectTrigger>
                            <SelectContent className="max-h-[300px]">
                                {INDIAN_STATES.map(state => (
                                    <SelectItem key={state} value={state}>{state}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {step2Form.formState.errors.state && (
                            <p className="text-sm text-destructive">{step2Form.formState.errors.state.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="pincode" className="text-sm font-semibold">Pincode *</Label>
                        <Input
                            id="pincode"
                            placeholder="400001"
                            maxLength={6}
                            className="h-12 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus:border-gold-500 focus:ring-gold-500/20"
                            {...step2Form.register('pincode')}
                        />
                        {step2Form.formState.errors.pincode && (
                            <p className="text-sm text-destructive">{step2Form.formState.errors.pincode.message}</p>
                        )}
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="gstNumber" className="text-sm font-semibold">GSTIN <span className="text-muted-foreground font-normal">(Optional)</span></Label>
                    <div className="relative">
                        <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gold-500" />
                        <Input
                            id="gstNumber"
                            placeholder="22AAAAA0000A1Z5"
                            className="pl-11 h-12 uppercase bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus:border-gold-500 focus:ring-gold-500/20"
                            maxLength={15}
                            {...step2Form.register('gstNumber')}
                        />
                    </div>
                    {step2Form.formState.errors.gstNumber && (
                        <p className="text-sm text-destructive">{step2Form.formState.errors.gstNumber.message}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="panNumber" className="text-sm font-semibold">PAN <span className="text-muted-foreground font-normal">(Optional)</span></Label>
                    <div className="relative">
                        <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gold-500" />
                        <Input
                            id="panNumber"
                            placeholder="ABCDE1234F"
                            className="pl-11 h-12 uppercase bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus:border-gold-500 focus:ring-gold-500/20"
                            maxLength={10}
                            {...step2Form.register('panNumber')}
                        />
                    </div>
                    {step2Form.formState.errors.panNumber && (
                        <p className="text-sm text-destructive">{step2Form.formState.errors.panNumber.message}</p>
                    )}
                </div>

                <div className="flex gap-4 mt-8">
                    <Button variant="outline" onClick={() => setCurrentStep(1)} className="flex-1 h-12 border-slate-300">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back
                    </Button>
                    <Button onClick={handleStep2Next} className="flex-1 h-12 font-semibold bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700 shadow-lg shadow-gold-500/25">
                        Continue
                        <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );

    const renderStep3 = () => (
        <div className="space-y-6">
            <div className="text-center space-y-2 mb-8">
                <h2 className="text-3xl font-bold font-heading bg-gradient-to-r from-gold-600 to-amber-600 bg-clip-text text-transparent">
                    Final Touches
                </h2>
                <p className="text-muted-foreground">Customize your shop's appearance</p>
            </div>

            <div className="space-y-6">
                <div className="space-y-3">
                    <Label className="text-sm font-semibold">Shop Logo <span className="text-muted-foreground font-normal">(Optional)</span></Label>
                    <div
                        className={cn(
                            "relative border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-200",
                            logoPreview
                                ? "border-gold-500 bg-gold-50 dark:bg-gold-950/10"
                                : "border-slate-200 dark:border-slate-800 hover:border-gold-400 hover:bg-slate-50 dark:hover:bg-slate-900"
                        )}
                        onClick={() => document.getElementById('logo-upload')?.click()}
                    >
                        {logoPreview ? (
                            <div className="space-y-4">
                                <div className="relative mx-auto w-32 h-32 rounded-xl overflow-hidden border-4 border-white dark:border-slate-800 shadow-xl">
                                    <img src={logoPreview} alt="Logo preview" className="w-full h-full object-contain" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gold-700 dark:text-gold-400">Logo uploaded successfully!</p>
                                    <p className="text-xs text-muted-foreground mt-1">Click to change</p>
                                </div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setLogoFile(null);
                                        setLogoPreview('');
                                    }}
                                    className="mt-2"
                                >
                                    <X className="h-3 w-3 mr-1" />
                                    Remove
                                </Button>
                            </div>
                        ) : (
                            <>
                                <Upload className="mx-auto h-14 w-14 text-gold-500 mb-4" />
                                <p className="text-base font-semibold mb-1">Upload Your Shop Logo</p>
                                <p className="text-sm text-muted-foreground">PNG, JPG up to 5MB</p>
                            </>
                        )}
                        <input
                            id="logo-upload"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleLogoUpload}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="cgst" className="text-sm font-semibold">CGST Rate (%)</Label>
                        <Input
                            id="cgst"
                            type="number"
                            step="0.01"
                            className="h-12 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus:border-gold-500 focus:ring-gold-500/20"
                            {...step3Form.register('cgstRate', { valueAsNumber: true })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="sgst" className="text-sm font-semibold">SGST Rate (%)</Label>
                        <Input
                            id="sgst"
                            type="number"
                            step="0.01"
                            className="h-12 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus:border-gold-500 focus:ring-gold-500/20"
                            {...step3Form.register('sgstRate', { valueAsNumber: true })}
                        />
                    </div>
                </div>

                <div className="flex gap-4 mt-8">
                    <Button variant="outline" onClick={() => setCurrentStep(2)} className="flex-1 h-12 border-slate-300">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back
                    </Button>
                    <Button
                        onClick={handleFinalSubmit}
                        disabled={isLoading}
                        className="flex-1 h-13 text-lg font-semibold bg-gradient-to-r from-gold-500 via-gold-600 to-amber-600 hover:from-gold-600 hover:via-gold-700 hover:to-amber-700 shadow-xl shadow-gold-500/30"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                Creating Your Shop...
                            </>
                        ) : (
                            <>
                                <Sparkles className="mr-2 h-5 w-5" />
                                Complete Setup
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="w-full max-w-xl mx-auto px-4 py-8">
            {/* Enhanced Progress Indicator - Better aligned */}
            <div className="mb-12">
                <div className="flex items-center justify-center mb-6">
                    {[1, 2, 3].map((step, index) => (
                        <div key={step} className="flex items-center">
                            {/* Step Circle */}
                            <div className="relative flex-shrink-0">
                                <div
                                    className={cn(
                                        "flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full border-2 transition-all duration-300 font-bold text-base sm:text-lg",
                                        currentStep >= step
                                            ? "border-gold-500 bg-gradient-to-br from-gold-500 to-gold-600 text-white shadow-lg shadow-gold-500/40"
                                            : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-400 dark:text-slate-600"
                                    )}
                                >
                                    {currentStep > step ? (
                                        <Check className="h-5 w-5 sm:h-6 sm:w-6" />
                                    ) : (
                                        <span>{step}</span>
                                    )}
                                </div>
                                {currentStep === step && (
                                    <div className="absolute inset-0 rounded-full bg-gold-500 animate-ping opacity-20"></div>
                                )}
                            </div>
                            {/* Connector Line */}
                            {index < 2 && (
                                <div
                                    className={cn(
                                        "w-12 sm:w-20 h-1 mx-2 sm:mx-3 rounded-full transition-all duration-500",
                                        currentStep > step
                                            ? "bg-gradient-to-r from-gold-500 to-gold-600"
                                            : "bg-slate-200 dark:bg-slate-800"
                                    )}
                                />
                            )}
                        </div>
                    ))}
                </div>
                <p className="text-center text-sm sm:text-base font-semibold text-gold-700 dark:text-gold-400">
                    Step {currentStep} of 3 • {currentStep === 1 ? 'Basic Info' : currentStep === 2 ? 'Business Details' : 'Final Touches'}
                </p>
            </div>

            {/* Step Content with Glass Effect */}
            <div className="bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-8 md:p-12">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentStep}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                    >
                        {currentStep === 1 && renderStep1()}
                        {currentStep === 2 && renderStep2()}
                        {currentStep === 3 && renderStep3()}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}
