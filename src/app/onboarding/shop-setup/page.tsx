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
    ArrowRight,
    Loader2,
    Sparkles,
    X,
    Store,
    CreditCard,
    Palette,
    Globe,
    ShieldCheck,
    TrendingUp,
    Receipt,
    Hammer,
    Zap
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

// --- Validation Schemas ---
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

// --- Components ---

function FloatingIcon({ icon: Icon, delay = 0 }: { icon: any, delay?: number }) {
    return (
        <motion.div
            animate={{ y: [0, -10, 0], rotate: [0, 5, 0] }}
            transition={{ duration: 4, repeat: Infinity, delay, ease: "easeInOut" }}
            className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gold-400 to-gold-600 shadow-lg shadow-gold-500/30 flex items-center justify-center mb-6 mx-auto relative z-10"
        >
            <div className="absolute inset-0 bg-white/20 rounded-2xl backdrop-blur-sm" />
            <Icon className="w-8 h-8 text-white relative z-10" />
        </motion.div>
    );
}

function ShopBuildingAnimation() {
    return (
        <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col items-center justify-center overflow-hidden">
            {/* Ambient Background */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-gold-900/20 via-slate-950 to-slate-950" />
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.05]" />

            {/* 3D Construction Scene */}
            <div className="relative w-[400px] h-[400px] perspective-1000">
                <motion.div
                    className="w-full h-full relative preserve-3d"
                    animate={{ rotateX: [60, 60], rotateZ: [0, 360] }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                >
                    {/* Base Platform */}
                    <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="absolute inset-0 m-auto w-64 h-64 bg-slate-800/50 border border-gold-500/30 rounded-full shadow-[0_0_50px_rgba(234,179,8,0.2)]"
                        style={{ transform: 'translateZ(0px)' }}
                    />

                    {/* Floor */}
                    <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.8, delay: 0.5, ease: "backOut" }}
                        className="absolute inset-0 m-auto w-40 h-40 bg-slate-900 border border-gold-500/50"
                        style={{ transform: 'translateZ(20px)' }}
                    />

                    {/* Walls Rising */}
                    {[0, 90, 180, 270].map((deg, i) => (
                        <motion.div
                            key={i}
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 60, opacity: 1 }}
                            transition={{ duration: 1, delay: 1 + (i * 0.2), ease: "easeOut" }}
                            className="absolute bottom-1/2 left-1/2 w-40 h-0 bg-gradient-to-t from-gold-500/20 to-transparent border-x border-gold-500/30 origin-bottom"
                            style={{
                                transform: `translate(-50%, 0) rotateZ(${deg}deg) translateY(20px) rotateX(-90deg)`,
                                transformOrigin: 'bottom'
                            }}
                        />
                    ))}

                    {/* Roof / Top */}
                    <motion.div
                        initial={{ opacity: 0, z: 100 }}
                        animate={{ opacity: 1, z: 80 }}
                        transition={{ duration: 0.8, delay: 2.5, ease: "easeOut" }}
                        className="absolute inset-0 m-auto w-44 h-44 bg-gold-500/10 border border-gold-400/50 shadow-[0_0_30px_rgba(234,179,8,0.3)] backdrop-blur-sm"
                        style={{ transform: 'translateZ(80px)' }}
                    >
                        {/* Logo Hologram */}
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Store className="w-16 h-16 text-gold-400 animate-pulse" />
                        </div>
                    </motion.div>

                    {/* Scanning Lasers */}
                    <motion.div
                        animate={{ top: ['0%', '100%'] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-0 w-full h-2 bg-gold-400/50 blur-md shadow-[0_0_20px_rgba(234,179,8,0.8)]"
                        style={{ transform: 'translateZ(50px) rotateX(0deg)' }}
                    />
                </motion.div>
            </div>

            {/* Text Status */}
            <div className="relative z-10 text-center mt-12 space-y-2">
                <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="text-3xl font-bold font-heading text-white"
                >
                    Constructing Your Empire
                </motion.h2>
                <div className="h-6 overflow-hidden">
                    <motion.div
                        animate={{ y: [-24, -48, -72, -96, 0] }} // Cycle through messages
                        transition={{ duration: 4, times: [0, 0.25, 0.5, 0.75, 1], repeat: Infinity }}
                        className="flex flex-col items-center"
                    >
                        <p className="h-6 text-gold-400 font-medium">Laying foundations...</p>
                        <p className="h-6 text-gold-400 font-medium">Installing security vaults...</p>
                        <p className="h-6 text-gold-400 font-medium">Polishing the counters...</p>
                        <p className="h-6 text-gold-400 font-medium">Stocking inventory...</p>
                        <p className="h-6 text-gold-400 font-medium">Opening doors...</p>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}

function BrandShowcase({ step }: { step: number }) {
    const content = [
        {
            title: "The Heart of Your Business",
            description: "Centralize your inventory, sales, and customers in one premium workspace designed for modern jewellers.",
            icon: Store,
            visual: (
                <div className="relative w-full h-48 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-4 flex flex-col gap-3 overflow-hidden">
                    <div className="flex gap-2">
                        <div className="w-2/3 h-20 bg-white/10 rounded-lg animate-pulse" />
                        <div className="w-1/3 h-20 bg-gold-500/20 rounded-lg" />
                    </div>
                    <div className="w-full h-12 bg-white/5 rounded-lg" />
                    <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-gold-500/30 rounded-full blur-2xl" />
                </div>
            )
        },
        {
            title: "Compliance Made Simple",
            description: "Seamlessly handle GST, billing, and regional regulations. We take care of the math so you can focus on sales.",
            icon: ShieldCheck,
            visual: (
                <div className="relative w-full h-48 flex items-center justify-center">
                    <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20" />
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                        className="w-32 h-32 border-2 border-dashed border-gold-400/50 rounded-full flex items-center justify-center"
                    >
                        <div className="w-24 h-24 bg-gold-500/10 rounded-full backdrop-blur-md flex items-center justify-center border border-gold-500/30">
                            <ShieldCheck className="w-10 h-10 text-gold-400" />
                        </div>
                    </motion.div>
                    <div className="absolute top-4 right-4 bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-full text-xs font-bold border border-emerald-500/30">
                        GST Ready
                    </div>
                </div>
            )
        },
        {
            title: "Your Brand, Elevated",
            description: "Impress customers with professional, branded invoices and loyalty programs that keep them coming back.",
            icon: Receipt,
            visual: (
                <div className="relative w-full h-48 flex items-center justify-center perspective-1000">
                    <motion.div
                        animate={{ rotateY: [0, 10, 0] }}
                        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                        className="w-32 h-40 bg-white shadow-2xl rounded-lg p-3 flex flex-col gap-2 transform rotate-6"
                    >
                        <div className="w-8 h-8 bg-gold-500 rounded-full mb-2" />
                        <div className="w-full h-2 bg-slate-100 rounded" />
                        <div className="w-2/3 h-2 bg-slate-100 rounded" />
                        <div className="mt-auto w-full h-8 bg-slate-50 rounded border border-dashed border-slate-200" />
                    </motion.div>
                    <div className="absolute -z-10 w-40 h-40 bg-gold-500/20 blur-3xl" />
                </div>
            )
        }
    ];

    const current = content[step - 1];

    return (
        <div className="h-full flex flex-col justify-center p-8 lg:p-12 text-white relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-slate-900" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-gold-900/40 via-slate-900 to-slate-900" />
            <div className="absolute top-0 right-0 w-96 h-96 bg-gold-500/10 rounded-full blur-[100px] translate-x-1/2 -translate-y-1/2" />

            <div className="relative z-10 space-y-8">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={step}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.5 }}
                    >
                        <div className="mb-8">
                            {current.visual}
                        </div>

                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-gold-500/20 rounded-lg border border-gold-500/30">
                                <current.icon className="w-6 h-6 text-gold-400" />
                            </div>
                            <span className="text-gold-400 font-bold tracking-wider text-sm uppercase">
                                Step {step} of 3
                            </span>
                        </div>

                        <h2 className="text-4xl font-bold font-heading mb-4 leading-tight">
                            {current.title}
                        </h2>
                        <p className="text-slate-400 text-lg leading-relaxed">
                            {current.description}
                        </p>
                    </motion.div>
                </AnimatePresence>

                {/* Testimonials or Trust Indicators */}
                <div className="pt-8 border-t border-white/10">
                    <div className="flex -space-x-3 mb-3">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="w-10 h-10 rounded-full border-2 border-slate-900 bg-slate-800 flex items-center justify-center text-xs text-slate-400">
                                U{i}
                            </div>
                        ))}
                        <div className="w-10 h-10 rounded-full border-2 border-slate-900 bg-gold-600 flex items-center justify-center text-xs font-bold text-white">
                            +2k
                        </div>
                    </div>
                    <p className="text-sm text-slate-500">Trusted by 2,000+ jewellers across India</p>
                </div>
            </div>
        </div>
    );
}

export default function ShopSetupPage() {
    const [currentStep, setCurrentStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [isBuilding, setIsBuilding] = useState(false); // New state for animation
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

    // Restore onboarding step
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
        setIsBuilding(true); // Start the animation immediately

        try {
            // Minimum animation duration (4.5 seconds)
            const animationPromise = new Promise(resolve => setTimeout(resolve, 4500));

            const finalData = { ...formData, ...data };
            let logoUrl = '';
            if (logoFile) {
                try {
                    const fileExt = logoFile.name.split('.').pop();
                    const fileName = `${user?.uid}-${Date.now()}.${fileExt}`;
                    const { error: uploadError } = await supabase.storage
                        .from('ShopLogo')
                        .upload(fileName, logoFile);

                    if (!uploadError) {
                        const { data: { publicUrl } } = supabase.storage
                            .from('ShopLogo')
                            .getPublicUrl(fileName);
                        logoUrl = publicUrl;
                    }
                } catch (logoErr) {
                    console.warn('Logo upload error:', logoErr);
                }
            }

            // Perform API call
            const apiCallPromise = supabase.rpc('create_new_shop_with_details', {
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

            // Wait for both animation and API call
            const [_, { data: shopId, error: shopError }] = await Promise.all([
                animationPromise,
                apiCallPromise
            ]);

            if (shopError) throw new Error(shopError.message);

            await supabase.rpc('complete_onboarding', { p_shop_id: shopId });

            // Redirect to the shop dashboard
            window.location.href = `/shop/${shopId}/dashboard`;

        } catch (error: any) {
            setIsBuilding(false); // Stop animation on error
            toast({
                variant: 'destructive',
                title: 'Setup failed',
                description: error.message,
            });
        } finally {
            setIsLoading(false);
        }
    });

    // --- Render Helpers ---

    const InputField = ({ label, icon: Icon, error, ...props }: any) => (
        <div className="space-y-2 group">
            <Label className="text-sm font-medium text-slate-600 ml-1 group-focus-within:text-gold-600 transition-colors">{label}</Label>
            <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-gold-200 to-gold-100 rounded-xl blur opacity-0 group-focus-within:opacity-40 transition-opacity duration-500" />
                <div className="relative">
                    <Icon className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-gold-600 transition-colors" />
                    <Input
                        className="pl-11 h-14 bg-white border-slate-200 focus:border-gold-400 focus:ring-4 focus:ring-gold-100 transition-all text-slate-900 rounded-xl shadow-sm text-base"
                        {...props}
                    />
                </div>
            </div>
            {error && <p className="text-sm text-red-500 ml-1">{error.message}</p>}
        </div>
    );

    const renderStep1 = () => (
        <div className="space-y-6">
            <div className="text-center mb-8">
                <FloatingIcon icon={Store} />
                <h2 className="text-2xl font-bold font-heading text-slate-900">Name Your Empire</h2>
                <p className="text-slate-500">Start by giving your business an identity.</p>
            </div>

            <div className="space-y-5">
                <InputField
                    label="Shop Name *"
                    icon={Building2}
                    error={step1Form.formState.errors.shopName}
                    placeholder="e.g. Royal Jewellers"
                    {...step1Form.register('shopName')}
                />
                <InputField
                    label="Phone Number *"
                    icon={Phone}
                    error={step1Form.formState.errors.phoneNumber}
                    placeholder="9876543210"
                    maxLength={10}
                    {...step1Form.register('phoneNumber')}
                />
                <InputField
                    label="Business Email *"
                    icon={Mail}
                    error={step1Form.formState.errors.email}
                    placeholder="contact@royaljewellers.com"
                    {...step1Form.register('email')}
                />

                <Button onClick={handleStep1Next} className="w-full h-14 text-base font-bold rounded-xl mt-4 bg-gradient-to-r from-slate-900 to-slate-800 text-white shadow-xl shadow-slate-900/20 hover:shadow-2xl hover:scale-[1.02] transition-all">
                    Continue Step
                    <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
            </div>
        </div>
    );

    const renderStep2 = () => (
        <div className="space-y-6">
            <div className="text-center mb-8">
                <FloatingIcon icon={MapPin} delay={0.2} />
                <h2 className="text-2xl font-bold font-heading text-slate-900">Location & Legal</h2>
                <p className="text-slate-500">Where can customers find you?</p>
            </div>

            <div className="space-y-5">
                <InputField
                    label="Address *"
                    icon={MapPin}
                    error={step2Form.formState.errors.address}
                    placeholder="Shop No. 1, Gold Market"
                    {...step2Form.register('address')}
                />

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label className="text-sm font-medium text-slate-600 ml-1">State *</Label>
                        <Select
                            value={step2Form.watch('state')}
                            onValueChange={(value) => step2Form.setValue('state', value)}
                        >
                            <SelectTrigger className="h-14 bg-white border-slate-200 rounded-xl focus:ring-gold-100 focus:border-gold-400">
                                <SelectValue placeholder="Select State" />
                            </SelectTrigger>
                            <SelectContent>
                                {INDIAN_STATES.map(state => (
                                    <SelectItem key={state} value={state}>{state}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {step2Form.formState.errors.state && <p className="text-sm text-red-500">{step2Form.formState.errors.state.message}</p>}
                    </div>

                    <InputField
                        label="Pincode *"
                        icon={MapPin}
                        error={step2Form.formState.errors.pincode}
                        placeholder="400001"
                        maxLength={6}
                        {...step2Form.register('pincode')}
                    />
                </div>

                <InputField
                    label="GSTIN (Optional)"
                    icon={FileText}
                    error={step2Form.formState.errors.gstNumber}
                    placeholder="22AAAAA0000A1Z5"
                    maxLength={15}
                    className="uppercase pl-11 h-14 bg-white border-slate-200 focus:border-gold-400 focus:ring-4 focus:ring-gold-100 transition-all text-slate-900 rounded-xl shadow-sm text-base"
                    {...step2Form.register('gstNumber')}
                />

                <div className="flex gap-4 mt-8">
                    <Button variant="ghost" onClick={() => setCurrentStep(1)} className="flex-1 h-14 text-slate-500 hover:text-slate-800">
                        Back
                    </Button>
                    <Button onClick={handleStep2Next} className="flex-1 h-14 text-base font-bold rounded-xl bg-gradient-to-r from-slate-900 to-slate-800 text-white shadow-xl shadow-slate-900/20 hover:shadow-2xl hover:scale-[1.02] transition-all">
                        Next Step
                        <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );

    const renderStep3 = () => (
        <div className="space-y-6">
            <div className="text-center mb-8">
                <FloatingIcon icon={Palette} delay={0.4} />
                <h2 className="text-2xl font-bold font-heading text-slate-900">Brand Identity</h2>
                <p className="text-slate-500">Make it yours with a logo and tax settings.</p>
            </div>

            <div className="space-y-6">
                {/* Logo Upload */}
                <div
                    className={cn(
                        "relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-300 group",
                        logoPreview
                            ? "border-gold-500 bg-gold-50/50"
                            : "border-slate-200 hover:border-gold-400 hover:bg-slate-50"
                    )}
                    onClick={() => document.getElementById('logo-upload')?.click()}
                >
                    {logoPreview ? (
                        <div className="space-y-4">
                            <div className="relative mx-auto w-24 h-24 rounded-xl overflow-hidden border-4 border-white shadow-lg">
                                <img src={logoPreview} alt="Logo preview" className="w-full h-full object-contain" />
                            </div>
                            <p className="text-sm font-medium text-gold-700">Logo Ready!</p>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setLogoFile(null);
                                    setLogoPreview('');
                                }}
                                className="text-red-500 hover:text-red-600 hover:bg-red-50"
                            >
                                <X className="h-3 w-3 mr-1" /> Remove
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto group-hover:bg-gold-100 transition-colors">
                                <Upload className="h-6 w-6 text-slate-400 group-hover:text-gold-600" />
                            </div>
                            <p className="text-sm font-semibold text-slate-700">Upload Logo</p>
                            <p className="text-xs text-slate-400">PNG, JPG up to 5MB</p>
                        </div>
                    )}
                    <input
                        id="logo-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleLogoUpload}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <InputField
                        label="CGST (%)"
                        icon={CreditCard}
                        type="number"
                        step="0.01"
                        {...step3Form.register('cgstRate', { valueAsNumber: true })}
                    />
                    <InputField
                        label="SGST (%)"
                        icon={CreditCard}
                        type="number"
                        step="0.01"
                        {...step3Form.register('sgstRate', { valueAsNumber: true })}
                    />
                </div>

                <div className="flex gap-4 mt-8">
                    <Button variant="ghost" onClick={() => setCurrentStep(2)} className="flex-1 h-14 text-slate-500 hover:text-slate-800">
                        Back
                    </Button>
                    <Button
                        onClick={handleFinalSubmit}
                        disabled={isLoading}
                        className="flex-1 h-14 text-base font-bold rounded-xl bg-gradient-to-r from-gold-500 to-gold-600 text-white shadow-xl shadow-gold-500/30 hover:shadow-2xl hover:scale-[1.02] transition-all relative overflow-hidden"
                    >
                        {isLoading ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                            <>
                                <span className="relative z-10 flex items-center">
                                    Launch Shop <Sparkles className="ml-2 h-5 w-5" />
                                </span>
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] animate-[shimmer_2s_infinite]" />
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );

    return (
        <>
            {/* Full Screen Construction Animation */}
            <AnimatePresence>
                {isBuilding && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50"
                    >
                        <ShopBuildingAnimation />
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="w-full max-w-6xl mx-auto lg:h-[800px] flex flex-col lg:flex-row bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100">

                {/* --- Left Side: Form --- */}
                <div className="flex-1 p-8 lg:p-12 overflow-y-auto bg-[#FDFBF7]">
                    {/* Progress Bar */}
                    <div className="mb-10">
                        <div className="flex justify-between mb-2">
                            {['Identity', 'Location', 'Branding'].map((label, idx) => (
                                <span
                                    key={label}
                                    className={cn(
                                        "text-xs font-bold uppercase tracking-wider transition-colors duration-300",
                                        currentStep > idx ? "text-gold-600" : "text-slate-300"
                                    )}
                                >
                                    {label}
                                </span>
                            ))}
                        </div>
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <motion.div
                                className="h-full bg-gradient-to-r from-gold-400 to-gold-600"
                                initial={{ width: '0%' }}
                                animate={{ width: `${((currentStep - 1) / 2) * 100}%` }}
                                transition={{ duration: 0.5, ease: "easeInOut" }}
                            />
                        </div>
                    </div>

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

                {/* --- Right Side: Brand Experience Panel --- */}
                <div className="hidden lg:block w-[45%] bg-slate-900 relative">
                    <BrandShowcase step={currentStep} />
                </div>
            </div>
        </>
    );
}
