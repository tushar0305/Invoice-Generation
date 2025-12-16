'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, ArrowRight, Check, Smartphone, Globe, Palette, ChevronLeft, Store } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { saveCatalogueSettings } from '@/actions/catalogue-actions';
import { cn } from '@/lib/utils';

// Import Templates for Preview
import { TemplateBasic } from './templates/template-basic';
import { TemplateModern } from './templates/template-modern';
import { TemplatePremium } from './templates/template-premium';

// Dummy Data for Preview
const PREVIEW_DATA = {
    shop: {
        shop_id: 'preview',
        shop_display_name: 'Luxe Jewellery',
        about_text: 'Crafting elegance since 1990. We specialize in diamond and gold jewellery.',
        contact_address: '123 Gold Market, Mumbai',
        contact_phone: '+919876543210',
    },
    products: [
        {
            id: '1',
            name: 'Diamond Necklace',
            price: 145000,
            purity: '22K',
            weight_g: 24.5,
            category_id: 'necklaces',
            images: []
        },
        {
            id: '2',
            name: 'Gold Bangles Set',
            price: 85000,
            purity: '22K',
            weight_g: 18.2,
            category_id: 'bangles',
            images: []
        },
        {
            id: '3',
            name: 'Solitaire Ring',
            price: 45000,
            purity: '18K',
            weight_g: 4.2,
            category_id: 'rings',
            images: []
        }
    ],
    categories: [
        { id: 'necklaces', name: 'Necklaces' },
        { id: 'bangles', name: 'Bangles' },
        { id: 'rings', name: 'Rings' }
    ]
};

const formSchema = z.object({
    shop_display_name: z.string().min(3, "Shop name must be at least 3 characters"),
    public_slug: z.string().min(3, "URL slug must be at least 3 characters").regex(/^[a-z0-9-]+$/, "Only lowercase letters, numbers, and hyphens allowed"),
    about_text: z.string().optional(),
    template_id: z.enum(['basic', 'modern', 'premium']),
    contact_phone: z.string().min(10, "Valid phone number required"),
    primary_color: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Invalid color code').default('#D4AF37'),
    is_active: z.boolean().default(true),
});

type FormValues = z.infer<typeof formSchema>;

interface Props {
    shopId: string;
    onComplete: () => void;
    initialData?: Partial<FormValues>;
}

export function CatalogueSetupWizard({ shopId, onComplete, initialData }: Props) {
    const { toast } = useToast();
    const [step, setStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [previewDevice, setPreviewDevice] = useState<'mobile' | 'desktop'>('mobile');

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            shop_display_name: initialData?.shop_display_name || '',
            public_slug: initialData?.public_slug || '',
            about_text: initialData?.about_text || '',
            template_id: (initialData?.template_id as any) || 'basic',
            contact_phone: initialData?.contact_phone || '',
            primary_color: initialData?.primary_color || '#D4AF37',
            is_active: true
        }
    });

    const watchTemplate = form.watch('template_id');

    const onSubmit = async (data: FormValues) => {
        setIsSubmitting(true);
        try {
            const result = await saveCatalogueSettings(shopId, data);
            if (result.success) {
                toast({ title: 'Success!', description: 'Your store has been updated.' });
                onComplete();
            } else {
                toast({ title: 'Error', description: result.error, variant: 'destructive' });
            }
        } catch (error) {
            toast({ title: 'Error', description: 'Something went wrong', variant: 'destructive' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const nextStep = async () => {
        // Validate current step fields
        let fieldsToValidate: (keyof FormValues)[] = [];
        if (step === 1) fieldsToValidate = ['shop_display_name', 'public_slug'];
        if (step === 2) fieldsToValidate = ['template_id'];

        const isValid = await form.trigger(fieldsToValidate);
        if (isValid) setStep(s => s + 1);
    };

    const prevStep = () => setStep(s => s - 1);

    return (
        <div className="min-h-screen w-full bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
            <div className="w-full max-w-[1400px] mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6 md:space-y-8">

                    {/* Modern Step Progress Bar */}
                    <div className="sticky top-0 z-40 -mx-3 sm:-mx-4 md:-mx-6 lg:-mx-8 px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-4 md:py-6 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800">
                        <div className="flex items-center justify-center gap-2 sm:gap-3 md:gap-12 max-w-4xl mx-auto">
                            {[
                                { id: 1, label: 'Store Identity', icon: Store, desc: 'Basic info' },
                                { id: 2, label: 'Choose Design', icon: Palette, desc: 'Template' },
                                { id: 3, label: 'Go Live', icon: Globe, desc: 'Contact' }
                            ].map((s, idx) => (
                                <div key={s.id} className="flex items-center">
                                    <div className={cn(
                                        "flex items-center gap-2 sm:gap-3 md:gap-4 transition-all duration-300",
                                        step >= s.id ? "opacity-100" : "opacity-40"
                                    )}>
                                        <div className={cn(
                                            "relative flex items-center justify-center h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 rounded-xl md:rounded-2xl border-2 transition-all duration-300",
                                            step === s.id ? "border-[#D4AF37] bg-[#D4AF37] text-white shadow-xl shadow-[#D4AF37]/30 scale-110" :
                                                step > s.id ? "border-[#D4AF37] bg-[#D4AF37] text-white" :
                                                    "border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800"
                                        )}>
                                            {step > s.id ? (
                                                <Check className="h-3 w-3 sm:h-4 sm:w-4 md:h-6 md:w-6" />
                                            ) : (
                                                <s.icon className="h-3 w-3 sm:h-4 sm:w-4 md:h-6 md:w-6" />
                                            )}
                                        </div>
                                        <div className="hidden md:block">
                                            <p className={cn(
                                                "font-bold text-xs md:text-sm",
                                                step >= s.id ? "text-gray-900 dark:text-white" : "text-gray-400"
                                            )}>{s.label}</p>
                                            <p className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400">{s.desc}</p>
                                        </div>
                                    </div>
                                    {idx < 2 && (
                                        <div className={cn(
                                            "h-[2px] md:h-[3px] w-6 sm:w-12 md:w-24 mx-1 sm:mx-2 md:mx-6 rounded-full transition-all duration-500",
                                            step > s.id ? "bg-[#D4AF37]" : "bg-gray-200 dark:bg-gray-700"
                                        )} />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <AnimatePresence mode="wait">
                        {step === 1 && (
                            <motion.div
                                key="step1"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.3 }}
                                className="w-full"
                            >
                                <div className="max-w-6xl mx-auto">
                                    <div className="text-center mb-6 sm:mb-8 md:mb-12">
                                        <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-2 md:mb-4">
                                            Setup Your Store Identity
                                        </h2>
                                        <p className="text-sm sm:text-base md:text-lg text-gray-600 dark:text-gray-400">
                                            Let's start with the basics - your store name and public link
                                        </p>
                                    </div>

                                    <div className="grid lg:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
                                        {/* Left Column - Form Fields */}
                                        <div className="space-y-4 sm:space-y-6 md:space-y-8 bg-white dark:bg-gray-900 rounded-2xl md:rounded-3xl p-4 sm:p-6 md:p-8 lg:p-10 border-2 border-gray-200 dark:border-gray-800 shadow-xl">
                                            <div className="space-y-2 md:space-y-3">
                                                <Label className="text-sm sm:text-base font-semibold">Shop Display Name</Label>
                                                <Input 
                                                    {...form.register('shop_display_name')} 
                                                    placeholder="e.g. Luxe Jewellery" 
                                                    className="h-10 sm:h-12 md:h-14 text-base sm:text-lg border-2 rounded-xl"
                                                />
                                                {form.formState.errors.shop_display_name && (
                                                    <p className="text-xs sm:text-sm text-red-500 flex items-center gap-2">
                                                        ⚠️ {form.formState.errors.shop_display_name.message}
                                                    </p>
                                                )}
                                                <p className="text-xs sm:text-sm text-gray-500">This is how customers will see your shop</p>
                                            </div>

                                            <div className="space-y-2 md:space-y-3">
                                                <Label className="text-sm sm:text-base font-semibold">Public URL Slug</Label>
                                                <div className="flex items-stretch border-2 rounded-xl overflow-hidden focus-within:border-[#D4AF37] transition-colors">
                                                    <span className="bg-gray-100 dark:bg-gray-800 px-2 sm:px-3 md:px-4 flex items-center text-xs sm:text-sm text-gray-600 dark:text-gray-400 border-r-2 border-gray-200 dark:border-gray-700 font-semibold">
                                                        swarnavyapar.in/store/
                                                    </span>
                                                    <Input 
                                                        {...form.register('public_slug')} 
                                                        className="h-10 sm:h-12 md:h-14 text-base sm:text-lg border-0 rounded-none focus-visible:ring-0" 
                                                        placeholder="luxe-jewellery" 
                                                    />
                                                </div>
                                                {form.formState.errors.public_slug && (
                                                    <p className="text-xs sm:text-sm text-red-500 flex items-center gap-2">
                                                        ⚠️ {form.formState.errors.public_slug.message}
                                                    </p>
                                                )}
                                                <p className="text-xs sm:text-sm text-gray-500">This will be your unique website link</p>
                                            </div>

                                            <div className="space-y-2 md:space-y-3">
                                                <Label className="text-sm sm:text-base font-semibold">About Your Store (Optional)</Label>
                                                <Textarea
                                                    {...form.register('about_text')}
                                                    placeholder="Tell your customers about your brand, heritage, and what makes you special..."
                                                    className="min-h-[120px] sm:min-h-[150px] md:min-h-[180px] text-sm sm:text-base border-2 rounded-xl resize-none"
                                                />
                                                <p className="text-xs sm:text-sm text-gray-500">Share your story to build trust with customers</p>
                                            </div>
                                        </div>

                                        {/* Right Column - Preview */}
                                        <div className="bg-gradient-to-br from-[#D4AF37]/10 to-amber-50 dark:from-[#D4AF37]/5 dark:to-gray-900 rounded-2xl md:rounded-3xl p-4 sm:p-6 md:p-8 lg:p-10 border-2 border-[#D4AF37]/30 flex flex-col justify-center">
                                            <div className="text-center mb-4 sm:mb-6">
                                                <div className="inline-block p-3 sm:p-4 bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-lg mb-3 sm:mb-4">
                                                    <Store className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 text-[#D4AF37]" />
                                                </div>
                                                <h3 className="text-lg sm:text-xl md:text-2xl font-bold mb-1 sm:mb-2">Your Store Preview</h3>
                                                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">This is how it will appear</p>
                                            </div>
                                            
                                            <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-xl space-y-3 sm:space-y-4">
                                                <div className="text-center">
                                                    <h4 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
                                                        {form.watch('shop_display_name') || 'Your Shop Name'}
                                                    </h4>
                                                </div>
                                                
                                                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-gray-200 dark:border-gray-700">
                                                    <p className="text-[10px] sm:text-xs text-gray-500 mb-1">Public URL:</p>
                                                    <p className="text-xs sm:text-sm font-mono text-[#D4AF37] truncate">
                                                        swarnavyapar.in/store/{form.watch('public_slug') || 'your-shop'}
                                                    </p>
                                                </div>

                                                {form.watch('about_text') && (
                                                    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-gray-200 dark:border-gray-700">
                                                        <p className="text-[10px] sm:text-xs text-gray-500 mb-2">About:</p>
                                                        <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 leading-relaxed line-clamp-4">
                                                            {form.watch('about_text')}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex justify-end mt-6 sm:mt-8 md:mt-12">
                                        <Button type="button" onClick={nextStep} size="lg" className="h-10 sm:h-12 md:h-14 px-6 sm:px-10 md:px-12 text-sm sm:text-base md:text-lg rounded-xl bg-[#D4AF37] hover:bg-[#B8941F]">
                                            Continue to Design <ArrowRight className="ml-2 h-4 w-4 md:h-5 md:w-5" />
                                        </Button>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {step === 2 && (
                            <motion.div
                                key="step2"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.3 }}
                                className="w-full"
                            >
                                <div className="max-w-7xl mx-auto">
                                    <div className="text-center mb-6 sm:mb-8 md:mb-12">
                                        <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-2 md:mb-4">
                                            Choose Your Perfect Design
                                        </h2>
                                        <p className="text-sm sm:text-base md:text-lg text-gray-600 dark:text-gray-400">
                                            Select a template that matches your brand style
                                        </p>
                                    </div>

                                    {/* Template Selection Cards */}
                                    <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-5 md:gap-6 mb-6 sm:mb-8 md:mb-12">
                                        {['basic', 'modern', 'premium'].map((template) => (
                                            <button
                                                key={template}
                                                type="button"
                                                onClick={() => form.setValue('template_id', template as any)}
                                                className={cn(
                                                    "relative p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl border-2 sm:border-3 md:border-4 transition-all duration-300 text-left group hover:scale-105",
                                                    watchTemplate === template
                                                        ? "bg-gradient-to-br from-[#D4AF37] to-amber-500 border-[#D4AF37] shadow-2xl shadow-[#D4AF37]/40 scale-105"
                                                        : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 hover:border-[#D4AF37]/50 shadow-lg"
                                                )}
                                            >
                                                {watchTemplate === template && (
                                                    <div className="absolute -top-2 sm:-top-3 md:-top-4 -right-2 sm:-right-3 md:-right-4 bg-white dark:bg-gray-900 text-[#D4AF37] p-2 sm:p-2.5 md:p-3 rounded-full shadow-xl border-2 sm:border-3 md:border-4 border-[#D4AF37]">
                                                        <Check className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6" />
                                                    </div>
                                                )}
                                                
                                                <div className={cn(
                                                    "mb-3 sm:mb-4",
                                                    watchTemplate === template ? "text-white" : "text-gray-900 dark:text-white"
                                                )}>
                                                    <Palette className="h-6 w-6 sm:h-8 sm:w-8 md:h-10 md:w-10 mb-2 sm:mb-3" />
                                                    <h3 className="text-lg sm:text-xl md:text-2xl font-bold capitalize mb-1 sm:mb-2">{template}</h3>
                                                    <p className={cn(
                                                        "text-sm leading-relaxed",
                                                        watchTemplate === template ? "text-white/90" : "text-gray-600 dark:text-gray-400"
                                                    )}>
                                                        {template === 'basic' && "Clean & Simple design. Perfect for traditional shops. Fast loading and easy to navigate."}
                                                        {template === 'modern' && "Soft tones with smooth animations. Contemporary look with elegant cards and transitions."}
                                                        {template === 'premium' && "Dark luxury aesthetic with gold accents. Sophisticated design for high-end products."}
                                                    </p>
                                                </div>
                                                
                                                <div className={cn(
                                                    "flex items-center gap-2 text-sm font-semibold",
                                                    watchTemplate === template ? "text-white" : "text-[#D4AF37]"
                                                )}>
                                                    {watchTemplate === template ? "✓ Selected" : "Click to select"} →
                                                </div>
                                            </button>
                                        ))}
                                    </div>

                                    {/* Device Preview Section */}
                                    <div className="bg-white dark:bg-gray-900 rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 lg:p-12 border-2 border-gray-200 dark:border-gray-800 shadow-2xl">
                                        <div className="flex flex-col items-center">
                                            {/* Device Toggle */}
                                            <div className="flex gap-1.5 sm:gap-2 mb-6 sm:mb-8 md:mb-10 bg-gray-100 dark:bg-gray-800 rounded-xl sm:rounded-2xl p-1.5 sm:p-2 shadow-inner">
                                                <button
                                                    type="button"
                                                    onClick={() => setPreviewDevice('mobile')}
                                                    className={cn(
                                                        "px-4 sm:px-6 md:px-8 py-2 sm:py-2.5 md:py-3 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold transition-all duration-300 flex items-center gap-1.5 sm:gap-2",
                                                        previewDevice === 'mobile'
                                                            ? "bg-[#D4AF37] text-white shadow-lg"
                                                            : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                                                    )}
                                                >
                                                    <Smartphone className="h-4 w-4" />
                                                    Mobile View
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setPreviewDevice('desktop')}
                                                    className={cn(
                                                        "px-8 py-3 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-2",
                                                        previewDevice === 'desktop'
                                                            ? "bg-[#D4AF37] text-white shadow-lg"
                                                            : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                                                    )}
                                                >
                                                    💻 Desktop View
                                                </button>
                                            </div>

                                            {/* Device Frame */}
                                            {previewDevice === 'mobile' ? (
                                                /* iPhone Frame */
                                                <div className="relative mx-auto w-full max-w-[280px] sm:max-w-[320px] md:max-w-[360px]">
                                                    <div className="relative rounded-[2.5rem] sm:rounded-[3rem] md:rounded-[3.5rem] bg-black p-2 sm:p-2.5 md:p-3 shadow-2xl">
                                                        <div className="relative rounded-[3rem] overflow-hidden bg-white">
                                                            {/* Notch */}
                                                            <div className="absolute top-0 left-1/2 -translate-x-1/2 h-7 w-40 bg-black rounded-b-3xl z-50"></div>
                                                            
                                                            {/* Screen */}
                                                            <div className="relative aspect-[9/19.5] overflow-y-auto overflow-x-hidden bg-white scrollbar-hide">
                                                                <div className="min-h-full">
                                                                    {watchTemplate === 'basic' && (
                                                                        <TemplateBasic
                                                                            shop={{ ...PREVIEW_DATA.shop, shop_display_name: form.getValues('shop_display_name') || 'Your Shop' }}
                                                                            initialProducts={PREVIEW_DATA.products}
                                                                            categories={PREVIEW_DATA.categories}
                                                                        />
                                                                    )}
                                                                    {watchTemplate === 'modern' && (
                                                                        <TemplateModern
                                                                            shop={{ ...PREVIEW_DATA.shop, shop_display_name: form.getValues('shop_display_name') || 'Your Shop' }}
                                                                            initialProducts={PREVIEW_DATA.products}
                                                                            categories={PREVIEW_DATA.categories}
                                                                        />
                                                                    )}
                                                                    {watchTemplate === 'premium' && (
                                                                        <TemplatePremium
                                                                            shop={{ ...PREVIEW_DATA.shop, shop_display_name: form.getValues('shop_display_name') || 'Your Shop' }}
                                                                            initialProducts={PREVIEW_DATA.products}
                                                                            categories={PREVIEW_DATA.categories}
                                                                        />
                                                                    )}
                                                                </div>
                                                            </div>
                                                            
                                                            {/* Home Indicator */}
                                                            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-black rounded-full opacity-40 z-50"></div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                /* MacBook Frame */
                                                <div className="relative mx-auto w-full max-w-6xl">
                                                    {/* Screen */}
                                                    <div className="relative rounded-t-2xl bg-black p-4 shadow-2xl">
                                                        <div className="relative rounded-xl overflow-hidden bg-white border-4 border-gray-800">
                                                            {/* Browser Chrome */}
                                                            <div className="bg-gray-100 border-b-2 border-gray-200 px-6 py-3 flex items-center gap-3">
                                                                <div className="flex gap-2">
                                                                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                                                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                                                                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                                                </div>
                                                                <div className="flex-1 mx-6 bg-white rounded-lg px-4 py-2 text-sm text-gray-500 flex items-center gap-2 shadow-inner">
                                                                    <div className="text-base">🔒</div>
                                                                    <span className="font-medium">swarnavyapar.in/store/{form.getValues('public_slug') || 'your-shop'}</span>
                                                                </div>
                                                            </div>
                                                            
                                                            {/* Screen Content */}
                                                            <div className="relative aspect-[16/10] overflow-y-auto overflow-x-hidden bg-white scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                                                                <div className="min-h-full">
                                                                    {watchTemplate === 'basic' && (
                                                                        <TemplateBasic
                                                                            shop={{ ...PREVIEW_DATA.shop, shop_display_name: form.getValues('shop_display_name') || 'Your Shop' }}
                                                                            initialProducts={PREVIEW_DATA.products}
                                                                            categories={PREVIEW_DATA.categories}
                                                                        />
                                                                    )}
                                                                    {watchTemplate === 'modern' && (
                                                                        <TemplateModern
                                                                            shop={{ ...PREVIEW_DATA.shop, shop_display_name: form.getValues('shop_display_name') || 'Your Shop' }}
                                                                            initialProducts={PREVIEW_DATA.products}
                                                                            categories={PREVIEW_DATA.categories}
                                                                        />
                                                                    )}
                                                                    {watchTemplate === 'premium' && (
                                                                        <TemplatePremium
                                                                            shop={{ ...PREVIEW_DATA.shop, shop_display_name: form.getValues('shop_display_name') || 'Your Shop' }}
                                                                            initialProducts={PREVIEW_DATA.products}
                                                                            categories={PREVIEW_DATA.categories}
                                                                        />
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {/* MacBook Base */}
                                                    <div className="relative h-3 bg-gradient-to-b from-gray-300 to-gray-400 rounded-b-xl shadow-lg"></div>
                                                    <div className="relative h-5 bg-gradient-to-b from-gray-400 to-gray-500 rounded-b-2xl -mt-0.5 mx-auto w-[65%] shadow-xl"></div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex gap-4 justify-between mt-12 max-w-4xl mx-auto">
                                        <Button type="button" variant="outline" onClick={prevStep} size="lg" className="h-14 px-8 text-lg rounded-xl border-2">
                                            <ChevronLeft className="mr-2 h-5 w-5" /> Back
                                        </Button>
                                        <Button type="button" onClick={nextStep} size="lg" className="h-14 px-12 text-lg rounded-xl bg-[#D4AF37] hover:bg-[#B8941F]">
                                            Continue to Launch <ArrowRight className="ml-2 h-5 w-5" />
                                        </Button>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {step === 3 && (
                            <motion.div
                                key="step3"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.3 }}
                                className="w-full"
                            >
                                <div className="max-w-5xl mx-auto">
                                    <div className="text-center mb-6 sm:mb-8 md:mb-12">
                                        <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-2 md:mb-4">
                                            Almost There! 🎉
                                        </h2>
                                        <p className="text-sm sm:text-base md:text-lg text-gray-600 dark:text-gray-400">
                                            Add your contact details to let customers reach you
                                        </p>
                                    </div>

                                    <div className="grid lg:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
                                        {/* Left Column - Contact Form */}
                                        <div className="bg-white dark:bg-gray-900 rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 lg:p-10 border-2 border-gray-200 dark:border-gray-800 shadow-xl space-y-4 sm:space-y-6 md:space-y-8">
                                            <div className="space-y-2 md:space-y-3">
                                                <Label className="text-sm sm:text-base font-semibold flex items-center gap-2">
                                                    📱 WhatsApp Number
                                                </Label>
                                                <div className="flex items-stretch border-2 rounded-xl overflow-hidden focus-within:border-[#25D366] transition-colors">
                                                    <span className="bg-gray-100 dark:bg-gray-800 px-3 sm:px-4 md:px-5 flex items-center text-sm sm:text-base text-gray-600 dark:text-gray-400 border-r-2 border-gray-200 dark:border-gray-700 font-semibold">
                                                        +91
                                                    </span>
                                                    <Input 
                                                        {...form.register('contact_phone')} 
                                                        className="h-10 sm:h-12 md:h-14 text-base sm:text-lg border-0 rounded-none focus-visible:ring-0" 
                                                        placeholder="9876543210" 
                                                    />
                                                </div>
                                                {form.formState.errors.contact_phone && (
                                                    <p className="text-sm text-red-500 flex items-center gap-2">
                                                        ⚠️ {form.formState.errors.contact_phone.message}
                                                    </p>
                                                )}
                                                <p className="text-sm text-gray-500">
                                                    This number will be used for all customer inquiries
                                                </p>
                                            </div>

                                            <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-6 rounded-2xl border-2 border-green-200 dark:border-green-800">
                                                <div className="flex gap-4">
                                                    <div className="flex-shrink-0">
                                                        <div className="p-3 bg-green-500 rounded-xl">
                                                            <Smartphone className="h-6 w-6 text-white" />
                                                        </div>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <h4 className="font-bold text-green-900 dark:text-green-100">
                                                            Why WhatsApp?
                                                        </h4>
                                                        <ul className="text-sm text-green-800 dark:text-green-200 space-y-1">
                                                            <li className="flex items-start gap-2">
                                                                <span className="text-green-500 mt-0.5">✓</span>
                                                                <span>Direct communication with customers</span>
                                                            </li>
                                                            <li className="flex items-start gap-2">
                                                                <span className="text-green-500 mt-0.5">✓</span>
                                                                <span>One-click inquiry buttons on all products</span>
                                                            </li>
                                                            <li className="flex items-start gap-2">
                                                                <span className="text-green-500 mt-0.5">✓</span>
                                                                <span>Share photos, videos, and catalogs easily</span>
                                                            </li>
                                                        </ul>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Right Column - Preview Summary */}
                                        <div className="bg-gradient-to-br from-[#D4AF37]/10 to-amber-50 dark:from-[#D4AF37]/5 dark:to-gray-900 rounded-3xl p-8 md:p-10 border-2 border-[#D4AF37]/30">
                                            <div className="text-center mb-6">
                                                <div className="inline-block p-4 bg-white dark:bg-gray-800 rounded-2xl shadow-lg mb-4">
                                                    <Globe className="h-12 w-12 text-[#D4AF37]" />
                                                </div>
                                                <h3 className="text-2xl font-bold mb-2">Your Store Summary</h3>
                                                <p className="text-gray-600 dark:text-gray-400">Everything looks perfect!</p>
                                            </div>
                                            
                                            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl space-y-4">
                                                <div className="pb-4 border-b border-gray-200 dark:border-gray-700">
                                                    <p className="text-xs text-gray-500 mb-1">Store Name:</p>
                                                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                                                        {form.watch('shop_display_name') || 'Your Shop Name'}
                                                    </p>
                                                </div>

                                                <div className="pb-4 border-b border-gray-200 dark:border-gray-700">
                                                    <p className="text-xs text-gray-500 mb-1">Public URL:</p>
                                                    <p className="text-sm font-mono text-[#D4AF37] break-all">
                                                        swarnavyapar.in/store/{form.watch('public_slug') || 'your-shop'}
                                                    </p>
                                                </div>

                                                <div className="pb-4 border-b border-gray-200 dark:border-gray-700">
                                                    <p className="text-xs text-gray-500 mb-1">Template:</p>
                                                    <p className="text-base font-semibold text-gray-900 dark:text-white capitalize">
                                                        {form.watch('template_id')} Design
                                                    </p>
                                                </div>

                                                <div>
                                                    <p className="text-xs text-gray-500 mb-1">WhatsApp:</p>
                                                    <p className="text-base font-semibold text-gray-900 dark:text-white">
                                                        +91 {form.watch('contact_phone') || '..........'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-2 sm:gap-3 md:gap-4 justify-between mt-6 sm:mt-8 md:mt-12 max-w-4xl mx-auto">
                                        <Button type="button" variant="outline" onClick={prevStep} size="lg" className="h-10 sm:h-12 md:h-14 px-4 sm:px-6 md:px-8 text-sm sm:text-base md:text-lg rounded-xl border-2">
                                            <ChevronLeft className="mr-1 sm:mr-2 h-4 w-4 md:h-5 md:w-5" /> Back
                                        </Button>
                                        <Button 
                                            type="submit" 
                                            disabled={isSubmitting} 
                                            size="lg" 
                                            className="h-10 sm:h-12 md:h-14 px-6 sm:px-10 md:px-12 text-sm sm:text-base md:text-lg rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-xl shadow-green-500/30"
                                        >
                                            {isSubmitting ? (
                                                <>
                                                    <Loader2 className="animate-spin mr-2 h-5 w-5" />
                                                    Launching...
                                                </>
                                            ) : (
                                                <>
                                                    🚀 Launch Your Store
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </form>
            </div>
        </div>
    );
}
