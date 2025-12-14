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
    name: z.string().min(3, 'Name must be at least 3 characters'),
    description: z.string().optional(),
    scheme_type: z.enum(['FIXED_DURATION', 'FLEXIBLE']),
    duration_months: z.coerce.number().min(1, 'Duration must be at least 1 month'),
    installment_amount: z.coerce.number().min(0).optional(),
    bonus_months: z.coerce.number().min(0).optional(),
    interest_rate: z.coerce.number().min(0).optional(),
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
            duration_months: 11,
            installment_amount: 1000,
            bonus_months: 1,
            interest_rate: 0,
        },
    });

    const schemeType = form.watch('scheme_type');

    async function onSubmit(data: SchemeFormValues) {
        setIsSubmitting(true);
        try {
            const payload: CreateSchemePayload = {
                shop_id: shopId,
                name: data.name,
                description: data.description,
                scheme_type: data.scheme_type,
                duration_months: data.duration_months,
                installment_amount: data.installment_amount || 0,
                bonus_months: data.bonus_months || 0,
                interest_rate: data.interest_rate || 0,
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
            console.error('Error creating scheme:', error);
            toast.error(error.message || 'Failed to create scheme');
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
                                                    <SelectItem value="FIXED_DURATION">Fixed Installment (e.g. 11+1)</SelectItem>
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
                            <CardContent className="grid gap-6 md:grid-cols-3">
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
                                    <>
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
                                        <FormField
                                            control={form.control}
                                            name="bonus_months"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Bonus (Installements)</FormLabel>
                                                    <FormControl>
                                                        <div className="relative">
                                                            <Gift className="absolute left-3 top-2.5 h-4 w-4 text-emerald-500" />
                                                            <Input type="number" step="0.5" className="pl-9 h-10" {...field} />
                                                        </div>
                                                    </FormControl>
                                                    <FormDescription className="text-xs truncate">
                                                        Shop pays this many months.
                                                    </FormDescription>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </>
                                ) : (
                                    <FormField
                                        control={form.control}
                                        name="interest_rate"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Interest Rate (%)</FormLabel>
                                                <FormControl>
                                                    <Input type="number" step="0.1" className="h-10" {...field} />
                                                </FormControl>
                                                <FormDescription>Annual interest rate.</FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                )}
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
