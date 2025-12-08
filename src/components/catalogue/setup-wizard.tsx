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
        <Card className="border-none shadow-none bg-transparent">
            <CardContent className="p-0">
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                    {/* Step Visualization for Mobile */}
                    <div className="flex items-center justify-between mb-8 px-2 max-w-sm mx-auto w-full md:max-w-none md:justify-center md:gap-8">
                        {[
                            { id: 1, label: 'Identity', icon: Store },
                            { id: 2, label: 'Design', icon: Palette },
                            { id: 3, label: 'Launch', icon: Globe }
                        ].map((s, idx) => (
                            <div key={s.id} className="flex items-center">
                                <div className={cn(
                                    "flex flex-col items-center gap-2 transition-colors",
                                    step >= s.id ? "text-primary" : "text-muted-foreground/50"
                                )}>
                                    <div className={cn(
                                        "h-8 w-8 rounded-full flex items-center justify-center border-2 text-xs font-bold transition-all",
                                        step === s.id ? "border-primary bg-primary text-primary-foreground scale-110 shadow-glow" :
                                            step > s.id ? "border-primary bg-primary text-primary-foreground" :
                                                "border-muted-foreground/30 bg-background"
                                    )}>
                                        {step > s.id ? <Check className="h-4 w-4" /> : s.icon ? <s.icon className="h-4 w-4" /> : s.id}
                                    </div>
                                    <span className="text-[10px] font-medium uppercase tracking-wider">{s.label}</span>
                                </div>
                                {idx < 2 && (
                                    <div className={cn(
                                        "h-[2px] w-12 mx-2 mb-6 transition-colors",
                                        step > s.id ? "bg-primary" : "bg-muted-foreground/20"
                                    )} />
                                )}
                            </div>
                        ))}
                    </div>

                    <AnimatePresence mode="wait">
                        {step === 1 && (
                            <motion.div
                                key="step1"
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                className="space-y-6 max-w-md mx-auto"
                            >
                                <div className="text-center mb-6">
                                    <h2 className="text-xl font-bold">Store Identity</h2>
                                    <p className="text-sm text-muted-foreground">Setup your store name and public link</p>
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Shop Display Name</Label>
                                        <Input {...form.register('shop_display_name')} placeholder="e.g. Luxe Jewellery" className="h-11" />
                                        {form.formState.errors.shop_display_name && (
                                            <p className="text-xs text-red-500">{form.formState.errors.shop_display_name.message}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Public URL Slug</Label>
                                        <div className="flex items-center">
                                            <span className="bg-muted px-3 py-3 border border-r-0 rounded-l-md text-sm text-muted-foreground border-input">
                                                swarnavyapar.in/store/
                                            </span>
                                            <Input {...form.register('public_slug')} className="rounded-l-none h-11" placeholder="luxe-jewellery" />
                                        </div>
                                        <p className="text-xs text-muted-foreground">This will be your website link.</p>
                                        {form.formState.errors.public_slug && (
                                            <p className="text-xs text-red-500">{form.formState.errors.public_slug.message}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label>About Text</Label>
                                        <Textarea
                                            {...form.register('about_text')}
                                            placeholder="Tell customers about your brand..."
                                            className="min-h-[100px] resize-none"
                                        />
                                    </div>
                                </div>

                                <Button type="button" onClick={nextStep} className="w-full h-11 mt-4">
                                    Next Step <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </motion.div>
                        )}

                        {step === 2 && (
                            <motion.div
                                key="step2"
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                className="space-y-6"
                            >
                                <div className="text-center mb-4">
                                    <h2 className="text-xl font-bold">Choose Layout</h2>
                                    <p className="text-sm text-muted-foreground">Select a design for your store</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {['basic', 'modern', 'premium'].map((template) => (
                                        <div
                                            key={template}
                                            onClick={() => form.setValue('template_id', template as any)}
                                            className={cn(
                                                "cursor-pointer rounded-xl border-2 overflow-hidden transition-all duration-300 relative group",
                                                watchTemplate === template ? "border-[#D4AF37] ring-4 ring-[#D4AF37]/10 shadow-lg scale-[1.02]" : "border-border hover:border-gray-300"
                                            )}
                                        >
                                            {/* Live Preview Container */}
                                            <div className="aspect-[9/16] md:aspect-[3/5] bg-gray-100 relative overflow-hidden pointer-events-none select-none">
                                                {/* Scaled Preview Wrapper */}
                                                <div className="absolute inset-0 w-[400%] h-[400%] origin-top-left transform scale-25">
                                                    {template === 'basic' && (
                                                        <TemplateBasic
                                                            shop={{ ...PREVIEW_DATA.shop, shop_display_name: form.getValues('shop_display_name') || 'Your Shop' }}
                                                            initialProducts={PREVIEW_DATA.products}
                                                            categories={PREVIEW_DATA.categories}
                                                        />
                                                    )}
                                                    {template === 'modern' && (
                                                        <TemplateModern
                                                            shop={{ ...PREVIEW_DATA.shop, shop_display_name: form.getValues('shop_display_name') || 'Your Shop' }}
                                                            initialProducts={PREVIEW_DATA.products}
                                                            categories={PREVIEW_DATA.categories}
                                                        />
                                                    )}
                                                    {template === 'premium' && (
                                                        <TemplatePremium
                                                            shop={{ ...PREVIEW_DATA.shop, shop_display_name: form.getValues('shop_display_name') || 'Your Shop' }}
                                                            initialProducts={PREVIEW_DATA.products}
                                                            categories={PREVIEW_DATA.categories}
                                                        />
                                                    )}
                                                </div>

                                                {/* Overlay to prevent interaction */}
                                                <div className="absolute inset-0 bg-transparent group-hover:bg-black/5 transition-colors" />

                                                {watchTemplate === template && (
                                                    <div className="absolute inset-0 flex items-center justify-center bg-black/10 backdrop-blur-[1px]">
                                                        <div className="bg-[#D4AF37] text-white px-4 py-2 rounded-full shadow-lg font-bold flex items-center gap-2">
                                                            <Check className="h-4 w-4" /> Selected
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="p-4 bg-card text-center relative z-10 border-t">
                                                <h3 className="font-bold capitalize mb-1">{template} Theme</h3>
                                                <p className="text-xs text-muted-foreground">
                                                    {template === 'basic' && "Clean & Simple. Fast loading."}
                                                    {template === 'modern' && "Soft tones with smooth animations."}
                                                    {template === 'premium' && "Dark luxury aesthetic with gold accents."}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="flex gap-3 max-w-md mx-auto pt-6">
                                    <Button type="button" variant="outline" onClick={prevStep} className="flex-1 h-11">
                                        <ChevronLeft className="mr-2 h-4 w-4" /> Back
                                    </Button>
                                    <Button type="button" onClick={nextStep} className="flex-1 h-11">
                                        Next
                                    </Button>
                                </div>
                            </motion.div>
                        )}

                        {step === 3 && (
                            <motion.div
                                key="step3"
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                className="space-y-6 max-w-md mx-auto"
                            >
                                <div className="text-center mb-6">
                                    <h2 className="text-xl font-bold">Contact Details</h2>
                                    <p className="text-sm text-muted-foreground">Where customers can reach you</p>
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>WhatsApp Number</Label>
                                        <div className="flex items-center">
                                            <span className="bg-muted px-3 py-3 border border-r-0 rounded-l-md text-sm text-muted-foreground border-input">
                                                +91
                                            </span>
                                            <Input {...form.register('contact_phone')} className="rounded-l-none h-11" placeholder="9876543210" />
                                        </div>
                                        <p className="text-xs text-muted-foreground">Customers will message this number from one-click buttons.</p>
                                        {form.formState.errors.contact_phone && (
                                            <p className="text-xs text-red-500">{form.formState.errors.contact_phone.message}</p>
                                        )}
                                    </div>

                                    <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg flex gap-3 items-start md:items-center">
                                        <Smartphone className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5 md:mt-0" />
                                        <p className="text-xs text-amber-800 dark:text-amber-300">
                                            This number is crucial. All "Enquire" buttons on your store will open a WhatsApp chat with this number.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-6">
                                    <Button type="button" variant="outline" onClick={prevStep} className="flex-1 h-11">
                                        Back
                                    </Button>
                                    <Button type="submit" disabled={isSubmitting} className="flex-1 h-11 bg-green-600 hover:bg-green-700 text-white">
                                        {isSubmitting ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : null}
                                        Launch Store
                                    </Button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </form>
            </CardContent>
        </Card>
    );
}
