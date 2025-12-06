'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import {
    Store,
    Globe,
    Palette,
    Check,
    ChevronRight,
    Loader2,
    Layout,
    ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { saveCatalogueSettings } from '@/actions/catalogue-actions';

interface SetupWizardProps {
    shopId: string;
    onComplete: () => void;
    initialData?: any;
}

const COLORS = [
    { name: 'Gold', value: '#D4AF37' },
    { name: 'Classic Blue', value: '#1e40af' },
    { name: 'Emerald', value: '#059669' },
    { name: 'Ruby', value: '#dc2626' },
    { name: 'Black', value: '#000000' },
];

export function CatalogueSetupWizard({ shopId, onComplete, initialData }: SetupWizardProps) {
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const form = useForm({
        defaultValues: {
            public_slug: initialData?.public_slug || '',
            shop_display_name: initialData?.shop_display_name || '',
            about_text: initialData?.about_text || '',
            primary_color: initialData?.primary_color || '#D4AF37',
            contact_phone: initialData?.contact_phone || '',
            is_active: true,
        }
    });

    const isEditMode = !!initialData;

    const onSubmit = async (data: any) => {
        setIsLoading(true);
        try {
            const result = await saveCatalogueSettings(shopId, data);
            if (result.success) {
                toast({
                    title: 'Success!',
                    description: isEditMode ? 'Settings updated.' : 'Your online catalogue is ready.',
                });
                onComplete();
            } else {
                toast({
                    title: 'Error',
                    description: result.error,
                    variant: 'destructive',
                });
            }
        } catch (error) {
            toast({ title: 'Error', description: 'Something went wrong', variant: 'destructive' });
        } finally {
            setIsLoading(false);
        }
    };

    const nextStep = async () => {
        let fieldsToValidate: any[] = [];
        if (step === 1) fieldsToValidate = ['public_slug', 'shop_display_name'];
        if (step === 2) fieldsToValidate = ['primary_color', 'about_text'];

        const isValid = await form.trigger(fieldsToValidate);
        if (isValid) setStep(s => s + 1);
    };

    return (
        <Card className="max-w-2xl mx-auto border-gray-200 dark:border-gray-800 shadow-xl">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Store className="h-6 w-6 text-blue-600" />
                    {isEditMode ? 'Catalogue Settings' : 'Setup Online Catalogue'}
                </CardTitle>
                {!isEditMode && (
                    <CardDescription>
                        Step {step} of 3: {step === 1 ? 'Basic Info' : step === 2 ? 'Branding' : 'Review'}
                    </CardDescription>
                )}
            </CardHeader>
            <CardContent>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

                    {/* Basic Info Section */}
                    {(step === 1 || isEditMode) && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                            {isEditMode && <h3 className="font-semibold text-lg border-b pb-2">Basic Information</h3>}
                            <div>
                                <Label>Catalogue URL</Label>
                                <div className="flex mt-1.5">
                                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                                        swarnavyapar.com/store/
                                    </span>
                                    <Input
                                        {...form.register('public_slug')}
                                        placeholder="my-shop-name"
                                        className="rounded-l-none"
                                    />
                                </div>
                                <p className="text-xs text-gray-500 mt-1">Unique link for your customers</p>
                            </div>

                            <div>
                                <Label>Shop Display Name</Label>
                                <Input
                                    {...form.register('shop_display_name')}
                                    placeholder="e.g. Kohinoor Jewellers"
                                    className="mt-1.5"
                                />
                            </div>

                            <div>
                                <Label>WhatsApp Number</Label>
                                <Input
                                    {...form.register('contact_phone')}
                                    placeholder="+91 9876543210"
                                    className="mt-1.5"
                                />
                                <p className="text-xs text-gray-500 mt-1">Customers will message you on this number</p>
                            </div>
                        </motion.div>
                    )}

                    {/* Branding Section */}
                    {(step === 2 || isEditMode) && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                            {isEditMode && <h3 className="font-semibold text-lg border-b pb-2">Branding & Appearance</h3>}
                            <div>
                                <Label>Brand Color</Label>
                                <div className="flex flex-wrap gap-3 mt-3">
                                    {COLORS.map((color) => (
                                        <button
                                            key={color.value}
                                            type="button"
                                            onClick={() => form.setValue('primary_color', color.value)}
                                            className={`h-10 w-10 rounded-full border-2 flex items-center justify-center transition-all ${form.watch('primary_color') === color.value
                                                ? 'border-gray-900 scale-110'
                                                : 'border-transparent'
                                                }`}
                                            style={{ backgroundColor: color.value }}
                                        >
                                            {form.watch('primary_color') === color.value && (
                                                <Check className="h-5 w-5 text-white drop-shadow-md" />
                                            )}
                                        </button>
                                    ))}

                                    {/* Custom Color Picker */}
                                    <div className="relative group">
                                        <div className={`h-10 w-10 rounded-full border-2 flex items-center justify-center bg-white transition-all ${!COLORS.some(c => c.value === form.watch('primary_color'))
                                                ? 'border-gray-900 scale-110'
                                                : 'border-gray-200'
                                            }`}>
                                            <Palette className="h-5 w-5 text-gray-500" />
                                        </div>
                                        <Input
                                            type="color"
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                            onChange={(e) => form.setValue('primary_color', e.target.value)}
                                            value={form.watch('primary_color')}
                                        />
                                    </div>
                                </div>
                                <p className="text-xs text-muted-foreground mt-2">
                                    Selected: <span className="font-mono">{form.watch('primary_color')}</span>
                                </p>
                            </div>

                            <div>
                                <Label>About Shop</Label>
                                <Textarea
                                    {...form.register('about_text')}
                                    placeholder="Tell customers about your legacy..."
                                    className="mt-1.5 min-h-[100px]"
                                />
                            </div>
                        </motion.div>
                    )}

                    {/* Review Section (Only for Wizard) */}
                    {!isEditMode && step === 3 && (
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="text-center py-6">
                            <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Layout className="h-8 w-8 text-blue-600" />
                            </div>
                            <h3 className="text-lg font-semibold mb-2">Ready to Launch?</h3>
                            <p className="text-gray-500 mb-6">
                                Your catalogue will be live at:<br />
                                <span className="font-mono text-blue-600 font-medium">
                                    swarnavyapar.com/store/{form.watch('public_slug')}
                                </span>
                            </p>
                        </motion.div>
                    )}

                    {/* Actions */}
                    <div className="flex justify-between pt-4 border-t gap-4">
                        {!isEditMode && step > 1 && (
                            <Button type="button" variant="outline" onClick={() => setStep(s => s - 1)}>
                                Back
                            </Button>
                        )}

                        {!isEditMode && step < 3 ? (
                            <Button type="button" onClick={nextStep} className="ml-auto bg-blue-600 hover:bg-blue-700">
                                Continue <ChevronRight className="h-4 w-4 ml-1" />
                            </Button>
                        ) : (
                            <Button type="submit" disabled={isLoading} className={`ml-auto bg-green-600 hover:bg-green-700 w-full md:w-auto ${isEditMode ? 'w-full' : ''}`}>
                                {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                {isEditMode ? 'Save Changes' : (
                                    <>Launch Catalogue <ArrowRight className="h-4 w-4 ml-2" /></>
                                )}
                            </Button>
                        )}
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
