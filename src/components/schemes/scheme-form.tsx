'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, Info, Coins, CalendarClock, ShieldCheck, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import type { CreateSchemePayload } from '@/lib/scheme-types';
import { supabase } from '@/supabase/client';
import { Separator } from '@/components/ui/separator';

const schemeSchema = z.object({
    name: z.string().min(3, 'Name must be at least 3 characters').max(100, 'Name is too long'),
    description: z.string().max(500, 'Description is too long').optional(),
    scheme_type: z.enum(['FIXED_DURATION', 'FLEXIBLE']),
    
    // Next-Gen Fields
    calculation_type: z.enum(['FLAT_AMOUNT', 'WEIGHT_ACCUMULATION']).default('FLAT_AMOUNT'),
    payment_frequency: z.enum(['MONTHLY', 'WEEKLY', 'DAILY', 'FLEXIBLE']).default('MONTHLY'),
    min_amount: z.coerce.number().min(0, 'Amount cannot be negative').default(0),
    benefit_type: z.enum(['BONUS_MONTH', 'INTEREST', 'MAKING_CHARGE_DISCOUNT', 'FIXED_AMOUNT']).default('BONUS_MONTH'),
    benefit_value: z.coerce.number().min(0, 'Benefit value cannot be negative').default(0),

    duration_months: z.coerce.number().int().min(1, 'Duration must be at least 1 month').max(120, 'Duration cannot exceed 10 years'),
    installment_amount: z.coerce.number().min(0).optional(),
    bonus_months: z.coerce.number().min(0).optional(),
    interest_rate: z.coerce.number().min(0).optional(),
}).superRefine((data, ctx) => {
    if (data.scheme_type === 'FIXED_DURATION') {
        if (!data.installment_amount || data.installment_amount <= 0) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Installment amount is required for fixed duration schemes",
                path: ["installment_amount"]
            });
        }
    }
    
    if (data.benefit_type === 'INTEREST' && data.benefit_value > 100) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Interest rate cannot exceed 100%",
            path: ["benefit_value"]
        });
    }
});

type SchemeFormValues = z.infer<typeof schemeSchema>;

interface SchemeFormProps {
    shopId: string;
    onSuccess?: () => void;
}

export function SchemeForm({ shopId, onSuccess }: SchemeFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const router = useRouter();

    const form = useForm<SchemeFormValues>({
        resolver: zodResolver(schemeSchema),
        defaultValues: {
            name: '',
            description: '',
            scheme_type: 'FIXED_DURATION',
            calculation_type: 'FLAT_AMOUNT',
            payment_frequency: 'MONTHLY',
            min_amount: 0,
            benefit_type: 'BONUS_MONTH',
            benefit_value: 0,
            duration_months: 12,
            installment_amount: 0,
            bonus_months: 0,
            interest_rate: 0,
        },
    });

    const schemeType = form.watch('scheme_type');
    const calculationType = form.watch('calculation_type');
    const benefitType = form.watch('benefit_type');

    async function onSubmit(data: SchemeFormValues) {
        setIsSubmitting(true);
        try {
            const payload: CreateSchemePayload = {
                shop_id: shopId,
                name: data.name,
                scheme_type: data.scheme_type,
                
                // Next-Gen
                calculation_type: data.calculation_type,
                payment_frequency: data.payment_frequency,
                min_amount: data.min_amount,
                benefit_type: data.benefit_type,
                benefit_value: data.benefit_value,

                duration_months: data.duration_months,
                scheme_amount: data.installment_amount || 0,
                
                rules: {
                    description: data.description
                }
            };

            const { error } = await supabase.from('schemes').insert(payload);

            if (error) throw error;

            toast.success('Scheme created successfully');
            if (onSuccess) {
                onSuccess();
            } else {
                router.push(`/shop/${shopId}/schemes`);
                router.refresh();
            }
        } catch (error: any) {
            console.error('Error creating scheme:', JSON.stringify(error, null, 2));
            toast.error(error?.message || 'Failed to create scheme. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col h-full min-h-[80vh]">

                {/* Desktop Header - Hidden on Mobile */}
                <div className="hidden md:flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-xl font-semibold">Scheme Details</h2>
                        <p className="text-sm text-muted-foreground">Define terms for the new savings plan</p>
                    </div>
                </div>

                <div className="flex-1 space-y-6 pb-24 md:pb-0">
                    <div className="grid gap-6">
                        {/* Section 1: Basic Details */}
                        <Card className="border-border/60 shadow-sm">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <ShieldCheck className="w-5 h-5 text-primary" />
                                    Scheme Basics
                                </CardTitle>
                                <CardDescription>Identity and core type of the scheme.</CardDescription>
                            </CardHeader>
                            <CardContent className="grid gap-6 md:grid-cols-2">
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem className="col-span-2 md:col-span-1">
                                            <FormLabel>Scheme Name</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g. Swarna Labh 11+1" className="h-10" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="scheme_type"
                                    render={({ field }) => (
                                        <FormItem className="col-span-2 md:col-span-1">
                                            <FormLabel>Scheme Type</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger className="h-10">
                                                        <SelectValue placeholder="Select type" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="FIXED_DURATION">Fixed Installment</SelectItem>
                                                    <SelectItem value="FLEXIBLE">Flexible Amount</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormDescription className="text-xs">
                                                {field.value === 'FIXED_DURATION'
                                                    ? 'Fixed monthly payments with maturity bonus.'
                                                    : 'Variable payments with interest calculation.'}
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* Next-Gen Configuration */}
                                <FormField
                                    control={form.control}
                                    name="calculation_type"
                                    render={({ field }) => (
                                        <FormItem className="col-span-2 md:col-span-1">
                                            <FormLabel>Saving Mode</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger className="h-10">
                                                        <SelectValue placeholder="Select mode" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="FLAT_AMOUNT">Cash Value (₹)</SelectItem>
                                                    <SelectItem value="WEIGHT_ACCUMULATION">Gold Weight (Grams)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormDescription className="text-xs">
                                                {field.value === 'FLAT_AMOUNT'
                                                    ? 'Customer saves money. Bonus is given on total amount.'
                                                    : 'Customer buys gold grams at daily rate. Hedges against price rise.'}
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="payment_frequency"
                                    render={({ field }) => (
                                        <FormItem className="col-span-2 md:col-span-1">
                                            <FormLabel>Payment Frequency</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger className="h-10">
                                                        <SelectValue placeholder="Select frequency" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="MONTHLY">Monthly</SelectItem>
                                                    <SelectItem value="WEEKLY">Weekly</SelectItem>
                                                    <SelectItem value="DAILY">Daily</SelectItem>
                                                    <SelectItem value="FLEXIBLE">Anytime (Flexible)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="description"
                                    render={({ field }) => (
                                        <FormItem className="col-span-2">
                                            <FormLabel>Description / Terms</FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    placeholder="Enter detailed terms and conditions..."
                                                    className="resize-none min-h-[80px]"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </CardContent>
                        </Card>

                        {/* Section 2: Financial Terms */}
                        <Card className="border-border/60 shadow-sm">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <Coins className="w-5 h-5 text-amber-500" />
                                    Financial Terms
                                </CardTitle>
                                <CardDescription>Define duration, amounts, and benefits.</CardDescription>
                            </CardHeader>
                            <CardContent className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                                <FormField
                                    control={form.control}
                                    name="duration_months"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Duration (Months)</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <CalendarClock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                                    <Input type="number" className="pl-9 h-10" {...field} />
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {schemeType === 'FIXED_DURATION' ? (
                                    <FormField
                                        control={form.control}
                                        name="installment_amount"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Monthly Amount (₹)</FormLabel>
                                                <FormControl>
                                                    <div className="relative">
                                                        <span className="absolute left-3 top-2.5 text-muted-foreground font-semibold text-sm">₹</span>
                                                        <Input type="number" placeholder="0" className="pl-8 h-10" {...field} />
                                                    </div>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                ) : (
                                    <FormField
                                        control={form.control}
                                        name="min_amount"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Min. Payment (₹)</FormLabel>
                                                <FormControl>
                                                    <div className="relative">
                                                        <span className="absolute left-3 top-2.5 text-muted-foreground font-semibold text-sm">₹</span>
                                                        <Input type="number" placeholder="500" className="pl-8 h-10" {...field} />
                                                    </div>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                )}

                                {/* Benefit Configuration */}
                                <FormField
                                    control={form.control}
                                    name="benefit_type"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Benefit Type</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger className="h-10">
                                                        <SelectValue placeholder="Select benefit" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="BONUS_MONTH">Bonus Installment</SelectItem>
                                                    <SelectItem value="INTEREST">Interest (%)</SelectItem>
                                                    <SelectItem value="MAKING_CHARGE_DISCOUNT">Making Charge Discount (%)</SelectItem>
                                                    <SelectItem value="FIXED_AMOUNT">Fixed Cash Bonus (₹)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="benefit_value"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>
                                                {benefitType === 'BONUS_MONTH' ? 'Bonus (Months)' :
                                                 benefitType === 'INTEREST' ? 'Interest Rate (%)' :
                                                 benefitType === 'MAKING_CHARGE_DISCOUNT' ? 'Discount (%)' :
                                                 'Bonus Amount (₹)'}
                                            </FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <Gift className="absolute left-3 top-2.5 h-4 w-4 text-emerald-500" />
                                                    <Input type="number" step="0.1" className="pl-9 h-10" {...field} />
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Sticky Footer for Actions */}
                <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t z-50 md:static md:bg-transparent md:border-0 md:p-0 md:flex md:justify-end md:gap-4">
                    <div className="flex gap-3 max-w-5xl mx-auto w-full md:w-auto md:mx-0">
                        <Button type="button" variant="outline" size="lg" onClick={() => router.back()} className="flex-1 md:flex-none h-11 md:min-w-[100px]">
                            Cancel
                        </Button>
                        <Button type="submit" size="lg" disabled={isSubmitting} className="flex-1 md:flex-none h-11 md:min-w-[150px] shadow-lg shadow-primary/20">
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                'Create Scheme'
                            )}
                        </Button>
                    </div>
                </div>
            </form>
        </Form>
    );
}
