'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
    Store, Palette, Smartphone,
    Save, Monitor, Smartphone as PhoneIcon, Link as LinkIcon,
    Instagram, Loader2, RefreshCw, Check, ArrowLeft,
    LayoutGrid, List, Layers, Eye, Sparkles, Copy
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useToast } from '@/hooks/use-toast';
import { saveCatalogueSettings } from '@/actions/catalogue-actions';
import { cn } from '@/lib/utils';

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
    initialSettings: any;
}

export function CatalogueSettingsForm({ shopId, initialSettings }: Props) {
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [previewMode, setPreviewMode] = useState<'mobile' | 'desktop'>('mobile');
    const [hasChanges, setHasChanges] = useState(false);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            shop_display_name: initialSettings?.shop_display_name || '',
            public_slug: initialSettings?.public_slug || '',
            about_text: initialSettings?.about_text || '',
            template_id: initialSettings?.template_id || 'basic',
            contact_phone: initialSettings?.contact_phone || '',
            primary_color: initialSettings?.primary_color || '#D4AF37',
            is_active: initialSettings?.is_active ?? true,
        }
    });

    const watchAll = form.watch();

    // Track changes
    useEffect(() => {
        const isDirty = form.formState.isDirty;
        setHasChanges(isDirty);
    }, [form.formState.isDirty]);

    const onSubmit = async (data: FormValues) => {
        setIsSubmitting(true);
        try {
            const result = await saveCatalogueSettings(shopId, data);
            if (result.success) {
                toast({ title: 'Settings Saved', description: 'Your store has been updated successfully.' });
                form.reset(data); // Reset dirty state
                setHasChanges(false);
            } else {
                toast({ title: 'Error', description: result.error, variant: 'destructive' });
            }
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to save settings', variant: 'destructive' });
        } finally {
            setIsSubmitting(false);
        }
    };

    // Color Presets
    const COLORS = [
        { name: 'Gold', value: '#D4AF37' },
        { name: 'Rose', value: '#E0587C' },
        { name: 'Royal', value: '#1E40AF' },
        { name: 'Emerald', value: '#059669' },
        { name: 'Classic', value: '#111827' },
    ];

    // Helper for Mobile Section Header
    const MobileSectionHeader = ({ icon: Icon, title }: { icon: any, title: string }) => (
        <div className="flex items-center gap-2 px-4 py-3 bg-muted/30 md:hidden">
            <Icon className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-sm text-foreground">{title}</h3>
        </div>
    );

    // --- PREVIEW COMPONENT (Reusable) ---
    const PreviewFrame = ({ className }: { className?: string }) => {
        const template = watchAll.template_id;
        const isPremium = template === 'premium';
        const isModern = template === 'modern';
        const isBasic = template === 'basic';

        return (
            <div className={cn(
                "relative transition-all duration-500 ease-in-out border-4 border-gray-900 bg-black rounded-[2rem] shadow-2xl overflow-hidden mx-auto",
                className
            )}>
                {/* Inner Screen */}
                <div className="h-full w-full bg-background overflow-hidden flex flex-col relative group">

                    {/* Header Area */}
                    <div className={cn(
                        "w-full transition-all duration-300 shrink-0",
                        isPremium ? "h-40 relative" : "h-auto"
                    )}>

                        {/* PREMIUM HEADER */}
                        {isPremium && (
                            <>
                                <div
                                    className="absolute inset-0"
                                    style={{
                                        backgroundColor: '#0F172A',
                                        backgroundImage: 'linear-gradient(to bottom right, #0F172A, #1E293B)'
                                    }}
                                />
                                <div className="absolute inset-x-0 bottom-0 top-12 bg-white/90 backdrop-blur-sm rounded-t-3xl p-6 flex flex-col items-center text-center">
                                    <div className="mb-2 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] text-amber-700">
                                        <Sparkles className="h-3 w-3" /> <span>Premium</span>
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-1 line-clamp-1">
                                        {watchAll.shop_display_name || 'Store Name'}
                                    </h3>
                                    <p className="text-xs text-gray-500 line-clamp-2 max-w-[200px]">
                                        {watchAll.about_text || 'Store subtitle...'}
                                    </p>
                                </div>
                            </>
                        )}

                        {/* MODERN HEADER */}
                        {isModern && (
                            <div className="bg-muted/30 pt-8 px-4 pb-8">
                                <div
                                    className="rounded-2xl p-6 text-center shadow-lg text-white relative overflow-hidden"
                                    style={{ backgroundColor: watchAll.primary_color }}
                                >
                                    <Sparkles className="absolute top-0 right-0 h-24 w-24 opacity-10 -mr-4 -mt-4 text-white" />
                                    <h3 className="text-xl font-bold mb-1 relative z-10 line-clamp-1">
                                        {watchAll.shop_display_name || 'Store Name'}
                                    </h3>
                                    <p className="text-xs text-white/80 relative z-10 line-clamp-2">
                                        {watchAll.about_text || 'Store subtitle...'}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* BASIC HEADER */}
                        {isBasic && (
                            <div className="bg-background border-b p-6 text-left">
                                <h3 className="text-xl font-bold text-foreground mb-1 line-clamp-1">
                                    {watchAll.shop_display_name || 'Store Name'}
                                </h3>
                                <p className="text-xs text-muted-foreground line-clamp-2">
                                    {watchAll.about_text || 'Store subtitle...'}
                                </p>
                                <div className="mt-4 flex gap-2">
                                    <div className="h-6 px-3 bg-primary rounded-full flex items-center text-[10px] font-bold text-white shadow-sm" style={{ backgroundColor: watchAll.primary_color }}>
                                        Visit Store
                                    </div>
                                    <div className="h-6 w-6 rounded-full border flex items-center justify-center">
                                        <Copy className="h-3 w-3 text-muted-foreground" />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 overflow-hidden p-4 bg-background">
                        {/* Mock Products */}
                        <div className={cn(
                            "w-full",
                            isBasic ? "space-y-3" : "grid grid-cols-2 gap-3"
                        )}>
                            {[1, 2, 3, 4].map(i => (
                                <div
                                    key={i}
                                    className={cn(
                                        "bg-muted/50 rounded-lg animate-pulse",
                                        isBasic ? "h-20 w-full flex gap-3 p-2 items-center" : "aspect-square w-full"
                                    )}
                                    style={{ animationDelay: `${i * 100}ms` }}
                                >
                                    {isBasic && (
                                        <>
                                            <div className="h-16 w-16 bg-muted-foreground/10 rounded-md shrink-0" />
                                            <div className="space-y-2 flex-1">
                                                <div className="h-2 w-3/4 bg-muted-foreground/10 rounded" />
                                                <div className="h-2 w-1/2 bg-muted-foreground/10 rounded" />
                                            </div>
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Modern/Premium Floating CTA (Basic has it in header) */}
                    {!isBasic && (
                        <div className="absolute bottom-6 left-0 right-0 px-12">
                            <div
                                className="h-10 rounded-full w-full shadow-lg flex items-center justify-center text-white text-xs font-bold"
                                style={{ backgroundColor: watchAll.primary_color }}
                            >
                                Visit Store
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }


    return (
        <div className="space-y-6 pb-24 md:pb-0 relative">
            {/* Header Actions - Desktop Only */}
            <div className="hidden md:flex flex-row justify-between items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-foreground">Store Configuration</h2>
                    <p className="text-muted-foreground">Manage your digital storefront appearance and details</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        onClick={form.handleSubmit(onSubmit)}
                        disabled={!hasChanges || isSubmitting}
                        className={cn(
                            "transition-all",
                            hasChanges ? "bg-primary shadow-lg" : "bg-muted text-muted-foreground"
                        )}
                    >
                        {isSubmitting ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />}
                        {hasChanges ? 'Save Changes' : 'Saved'}
                    </Button>
                </div>
            </div>

            <div className="grid lg:grid-cols-12 gap-6 md:gap-8">
                {/* LEFT COLUMN: SETTINGS FORM */}
                <div className="lg:col-span-7 space-y-0 md:space-y-6">

                    {/* 1. Identity */}
                    <div className="bg-background md:bg-card md:border md:border-border/50 md:shadow-sm md:rounded-xl overflow-hidden">
                        {/* Mobile Header */}
                        <MobileSectionHeader icon={Store} title="Store Identity" />

                        {/* Desktop Header */}
                        <div className="hidden md:flex items-center gap-2 p-6 pb-4 bg-muted/30 border-b border-border/50">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                <Store className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <CardTitle className="text-lg">Store Identity</CardTitle>
                        </div>

                        <div className="p-4 md:p-6 space-y-5">
                            {/* ... Fields (Shop Name, Slug, About) ... */}
                            <div className="space-y-2">
                                <Label className="text-xs font-semibold uppercase text-muted-foreground md:text-sm md:normal-case md:text-foreground">Store Name</Label>
                                <Input
                                    {...form.register('shop_display_name')}
                                    className="h-12 md:h-11 md:text-lg font-medium bg-muted/30 md:bg-background border-transparent md:border-input focus:bg-background transition-colors rounded-xl px-4"
                                    placeholder="My Jewellery Shop"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-semibold uppercase text-muted-foreground md:text-sm md:normal-case md:text-foreground">Public URL</Label>
                                <div className="flex items-center rounded-lg bg-muted/20 md:bg-background border border-transparent md:border-input focus-within:ring-1 focus-within:ring-ring focus-within:bg-background transition-colors">
                                    <span className="pl-3 text-muted-foreground text-sm font-mono hidden sm:inline-block">swarnavyapar.in/store/</span>
                                    <span className="pl-3 text-muted-foreground text-sm font-mono sm:hidden">.../</span>
                                    <Input
                                        {...form.register('public_slug')}
                                        className="border-0 shadow-none focus-visible:ring-0 px-1 font-mono text-foreground font-semibold h-12 md:h-11 bg-transparent"
                                        placeholder="shop-name"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-semibold uppercase text-muted-foreground md:text-sm md:normal-case md:text-foreground">About Store</Label>
                                <Textarea
                                    {...form.register('about_text')}
                                    className="resize-none min-h-[100px] bg-muted/30 md:bg-background border-transparent md:border-input focus:bg-background transition-colors rounded-xl p-4"
                                    placeholder="Tell customers about your brand..."
                                />
                            </div>
                        </div>
                    </div>

                    <div className="h-2 bg-muted/20 md:hidden" />

                    {/* 2. Appearance */}
                    <div className="bg-background md:bg-card md:border md:border-border/50 md:shadow-sm md:rounded-xl overflow-hidden">
                        <MobileSectionHeader icon={Palette} title="Appearance" />

                        <div className="hidden md:flex items-center gap-2 p-6 pb-4 bg-muted/30 border-b border-border/50">
                            <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                                <Palette className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                            </div>
                            <CardTitle className="text-lg">Appearance</CardTitle>
                        </div>

                        <div className="p-4 md:p-6 space-y-6">
                            {/* Color Picker (Existing) */}
                            <div className="space-y-3">
                                <Label className="text-xs font-semibold uppercase text-muted-foreground md:text-sm md:normal-case md:text-foreground">Brand Color</Label>
                                <div className="flex flex-wrap gap-3">
                                    {COLORS.map((c) => (
                                        <button
                                            key={c.value}
                                            type="button"
                                            onClick={() => form.setValue('primary_color', c.value, { shouldDirty: true })}
                                            className={cn(
                                                "group relative h-10 w-10 rounded-full border-2 transition-all hover:scale-110",
                                                watchAll.primary_color === c.value ? "border-primary scale-110 shadow-md ring-2 ring-primary/20" : "border-transparent"
                                            )}
                                            style={{ backgroundColor: c.value }}
                                        >
                                            {watchAll.primary_color === c.value && (
                                                <Check className="absolute inset-0 m-auto h-5 w-5 text-white" />
                                            )}
                                        </button>
                                    ))}
                                    <div className="flex items-center gap-2 ml-2">
                                        <Input
                                            type="color"
                                            {...form.register('primary_color')}
                                            className="h-10 w-14 p-1 cursor-pointer bg-transparent border-0"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* VISUAL TEMPLATE SELECTOR */}
                            <div className="space-y-3">
                                <Label className="text-xs font-semibold uppercase text-muted-foreground md:text-sm md:normal-case md:text-foreground">Theme Template</Label>
                                <div className="grid grid-cols-3 gap-3">
                                    {/* Basic - List */}
                                    <div
                                        onClick={() => form.setValue('template_id', 'basic', { shouldDirty: true })}
                                        className={cn(
                                            "cursor-pointer rounded-xl border-2 p-3 transition-all hover:border-primary/50 relative overflow-hidden flex flex-col group",
                                            watchAll.template_id === 'basic' ? "border-primary bg-primary/5 shadow-md ring-2 ring-primary/20" : "border-border bg-card"
                                        )}
                                    >
                                        {/* Mini Preview - List Style */}
                                        <div className="aspect-[3/4] w-full bg-white dark:bg-gray-800 rounded-lg mb-2 p-2 overflow-hidden border shadow-inner">
                                            <div className="h-3 w-8 bg-foreground/80 rounded mb-2" />
                                            <div className="space-y-1.5">
                                                {[1, 2, 3].map(i => (
                                                    <div key={i} className="flex gap-1.5 items-center">
                                                        <div className="h-4 w-4 bg-muted rounded shrink-0" />
                                                        <div className="h-2 flex-1 bg-muted/60 rounded" />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="text-center">
                                            <div className="font-semibold text-xs">Basic</div>
                                            <p className="text-[10px] text-muted-foreground">List view</p>
                                        </div>
                                        {watchAll.template_id === 'basic' && <div className="absolute top-2 right-2 h-2 w-2 rounded-full bg-primary" />}
                                    </div>

                                    {/* Modern - Grid */}
                                    <div
                                        onClick={() => form.setValue('template_id', 'modern', { shouldDirty: true })}
                                        className={cn(
                                            "cursor-pointer rounded-xl border-2 p-3 transition-all hover:border-primary/50 relative overflow-hidden flex flex-col group",
                                            watchAll.template_id === 'modern' ? "border-primary bg-primary/5 shadow-md ring-2 ring-primary/20" : "border-border bg-card"
                                        )}
                                    >
                                        {/* Mini Preview - Grid Style */}
                                        <div className="aspect-[3/4] w-full bg-white dark:bg-gray-800 rounded-lg mb-2 overflow-hidden border shadow-inner">
                                            <div className="h-6 w-full rounded-t-sm mb-1" style={{ backgroundColor: watchAll.primary_color }} />
                                            <div className="p-1.5 grid grid-cols-2 gap-1">
                                                {[1, 2, 3, 4].map(i => (
                                                    <div key={i} className="aspect-square bg-muted/50 rounded" />
                                                ))}
                                            </div>
                                        </div>
                                        <div className="text-center">
                                            <div className="font-semibold text-xs">Modern</div>
                                            <p className="text-[10px] text-muted-foreground">Grid layout</p>
                                        </div>
                                        {watchAll.template_id === 'modern' && <div className="absolute top-2 right-2 h-2 w-2 rounded-full bg-primary" />}
                                    </div>

                                    {/* Premium - Luxury */}
                                    <div
                                        onClick={() => form.setValue('template_id', 'premium', { shouldDirty: true })}
                                        className={cn(
                                            "cursor-pointer rounded-xl border-2 p-3 transition-all hover:border-primary/50 relative overflow-hidden flex flex-col group",
                                            watchAll.template_id === 'premium' ? "border-primary bg-primary/5 shadow-md ring-2 ring-primary/20" : "border-border bg-card"
                                        )}
                                    >
                                        {/* Mini Preview - Luxury Style */}
                                        <div className="aspect-[3/4] w-full bg-gradient-to-b from-slate-900 to-slate-800 rounded-lg mb-2 overflow-hidden border border-slate-700 shadow-inner">
                                            <div className="h-5 w-full bg-gradient-to-r from-slate-800 to-slate-700" />
                                            <div className="p-1.5 pt-2">
                                                <div className="h-2 w-6 bg-amber-400/60 rounded mb-1.5 mx-auto" />
                                                <div className="h-1.5 w-10 bg-white/30 rounded mb-2 mx-auto" />
                                                <div className="grid grid-cols-2 gap-1">
                                                    {[1, 2].map(i => (
                                                        <div key={i} className="aspect-square bg-white/10 rounded" />
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-center">
                                            <div className="font-semibold text-xs inline-flex items-center gap-0.5">
                                                Premium <Sparkles className="h-2.5 w-2.5 text-amber-500 fill-amber-500" />
                                            </div>
                                            <p className="text-[10px] text-muted-foreground">Luxury UI</p>
                                        </div>
                                        {watchAll.template_id === 'premium' && <div className="absolute top-2 right-2 h-2 w-2 rounded-full bg-primary" />}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="h-2 bg-muted/20 md:hidden" />

                    {/* 3. Contact (Simplified) */}
                    <div className="bg-background md:bg-card md:border md:border-border/50 md:shadow-sm md:rounded-xl overflow-hidden">
                        <MobileSectionHeader icon={PhoneIcon} title="Details" />
                        <div className="hidden md:flex items-center gap-2 p-6 pb-4 bg-muted/30 border-b border-border/50">
                            <CardTitle className="text-lg">Contact</CardTitle>
                        </div>
                        <div className="p-4 md:p-6 space-y-6">
                            <div className="space-y-2">
                                <Label className="text-xs font-semibold uppercase text-muted-foreground md:text-sm md:normal-case md:text-foreground">WhatsApp Number</Label>
                                <Input {...form.register('contact_phone')} className="h-11 rounded-xl" placeholder="9876543210" />
                            </div>
                            <div className="flex items-center justify-between p-4 rounded-xl border bg-muted/10">
                                <Label>Store Active</Label>
                                <Switch checked={watchAll.is_active} onCheckedChange={(c) => form.setValue('is_active', c, { shouldDirty: true })} />
                            </div>
                        </div>
                    </div>

                </div>

                {/* RIGHT COLUMN: PREVIEW (Desktop) */}
                <div className="lg:col-span-5 hidden lg:block space-y-6">
                    <div className="sticky top-24">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2"><Monitor className="h-4 w-4" /><span className="font-semibold text-sm">Live Preview</span></div>
                        </div>
                        <PreviewFrame className="w-[300px] h-[600px]" />
                    </div>
                </div>
            </div>

            {/* STICKY FOOTER + MOBILE PREVIEW TRIGGER */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-lg border-t border-border/50 md:hidden z-50 pb-safe flex items-center gap-3">
                <Sheet>
                    <SheetTrigger asChild>
                        <Button size="icon" variant="outline" className="h-12 w-12 rounded-full shrink-0 border-2 border-primary/20 text-primary">
                            <Eye className="h-5 w-5" />
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="bottom" className="h-[90vh] rounded-t-[20px] p-0 overflow-hidden">
                        <SheetTitle className="sr-only">Preview</SheetTitle> {/* Accessibility fix */}
                        <div className="h-full w-full bg-muted/30 p-6 flex flex-col items-center">
                            <div className="w-12 h-1.5 bg-muted-foreground/20 rounded-full mb-6 shrink-0" />
                            <h3 className="text-lg font-bold mb-4">Live Preview</h3>
                            <div className="flex-1 w-full max-w-[320px] overflow-hidden">
                                <PreviewFrame className="w-full h-full border-2 rounded-[24px]" />
                            </div>
                            <div className="h-8 shrink-0" /> {/* Spacer */}
                        </div>
                    </SheetContent>
                </Sheet>

                <Button
                    onClick={form.handleSubmit(onSubmit)}
                    disabled={!hasChanges || isSubmitting}
                    className={cn(
                        "flex-1 h-12 text-lg rounded-xl shadow-lg transition-all",
                        hasChanges ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    )}
                >
                    {isSubmitting ? <Loader2 className="animate-spin mr-2 h-5 w-5" /> : <Save className="mr-2 h-5 w-5" />}
                    {hasChanges ? 'Save Changes' : 'Saved'}
                </Button>
            </div>
        </div >
    );
}
