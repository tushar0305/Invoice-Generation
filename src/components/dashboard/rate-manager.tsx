'use client';

import { useState, useEffect, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, Save, History, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/supabase/client';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';

const rateSchema = z.object({
    gold_24k: z.coerce.number().min(1, 'Rate must be greater than 0'),
    gold_22k: z.coerce.number().min(1, 'Rate must be greater than 0'),
    silver: z.coerce.number().min(1, 'Rate must be greater than 0'),
});

type RateFormValues = z.infer<typeof rateSchema>;

interface RateManagerProps {
    shopId: string;
}

export function RateManager({ shopId }: RateManagerProps) {
    const { toast } = useToast();
    const [isPending, startTransition] = useTransition();
    const [lastUpdated, setLastUpdated] = useState<string | null>(null);


    const form = useForm<RateFormValues>({
        resolver: zodResolver(rateSchema),
        defaultValues: {
            gold_24k: 0,
            gold_22k: 0,
            silver: 0,
        },
    });

    useEffect(() => {
        const fetchRates = async () => {
            const { data, error } = await supabase
                .from('market_rates')
                .select('*')
                .order('updated_at', { ascending: false })
                .limit(1)
                .single();

            if (error && error.code !== 'PGRST116') {
                console.error('Error fetching rates:', error);
                return;
            }

            if (data) {
                form.reset({
                    gold_24k: data.gold_24k,
                    gold_22k: data.gold_22k,
                    silver: data.silver,
                });
                setLastUpdated(data.updated_at);
            }
        };

        fetchRates();
    }, [shopId, supabase, form]);

    const onSubmit = (data: RateFormValues) => {
        startTransition(async () => {
            const { error } = await supabase
                .from('market_rates')
                .upsert({
                    id: 1, // Global rates table has single row
                    gold_24k: data.gold_24k,
                    gold_22k: data.gold_22k,
                    silver: data.silver,
                    updated_at: new Date().toISOString(),
                });

            if (error) {
                toast({
                    variant: 'destructive',
                    title: 'Error',
                    description: 'Failed to update rates. Please try again.',
                });
                console.error(error);
            } else {
                toast({
                    title: 'Rates Updated',
                    description: 'Market rates have been successfully updated.',
                });
                setLastUpdated(new Date().toISOString());
            }
        });
    };

    return (
        <div className="grid gap-6 md:grid-cols-2">
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Daily Market Rates</CardTitle>
                            <CardDescription>
                                Set your shop's daily gold and silver rates. These will be displayed on the dashboard.
                            </CardDescription>
                        </div>
                        <TrendingUp className="h-5 w-5 text-muted-foreground" />
                    </div>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <div className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="gold_24k"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Gold 24K Rate (₹/10g)</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <span className="absolute left-3 top-2.5 text-muted-foreground">₹</span>
                                                    <Input {...field} className="pl-7" type="number" step="0.01" />
                                                </div>
                                            </FormControl>
                                            <FormDescription className="text-xs">
                                                Standard 24K gold rate per 10 grams.
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="gold_22k"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Gold 22K Rate (₹/10g)</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <span className="absolute left-3 top-2.5 text-muted-foreground">₹</span>
                                                    <Input {...field} className="pl-7" type="number" step="0.01" />
                                                </div>
                                            </FormControl>
                                            <FormDescription className="text-xs">
                                                Standard 22K gold rate per 10 grams.
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="silver"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Silver Rate (₹/kg)</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <span className="absolute left-3 top-2.5 text-muted-foreground">₹</span>
                                                    <Input {...field} className="pl-7" type="number" step="0.01" />
                                                </div>
                                            </FormControl>
                                            <FormDescription className="text-xs">
                                                Standard Silver rate per 1 kilogram.
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="flex items-center justify-between pt-4 border-t">
                                <div className="text-xs text-muted-foreground">
                                    {lastUpdated && (
                                        <div className="flex items-center gap-1">
                                            <History className="h-3 w-3" />
                                            Active since: {format(new Date(lastUpdated), 'MMM d, h:mm a')}
                                        </div>
                                    )}
                                </div>
                                <Button type="submit" disabled={isPending} className="ml-auto">
                                    {isPending ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Updating...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="mr-2 h-4 w-4" />
                                            Update Rates
                                        </>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>

            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Rate Preview</CardTitle>
                        <CardDescription>How the rates appear on the dashboard</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-3">
                            <div className="flex items-center justify-between p-3 rounded-lg border bg-amber-500/5 border-amber-500/10">
                                <div className="text-sm font-medium text-amber-700 dark:text-amber-400">Gold 24K</div>
                                <div className="font-bold text-amber-700 dark:text-amber-400">
                                    ₹{formatCurrency(form.watch('gold_24k'))}<span className="text-xs font-normal opacity-70">/10g</span>
                                </div>
                            </div>
                            <div className="flex items-center justify-between p-3 rounded-lg border bg-amber-500/5 border-amber-500/10">
                                <div className="text-sm font-medium text-amber-700 dark:text-amber-400">Gold 22K</div>
                                <div className="font-bold text-amber-700 dark:text-amber-400">
                                    ₹{formatCurrency(form.watch('gold_22k'))}<span className="text-xs font-normal opacity-70">/10g</span>
                                </div>
                            </div>
                            <div className="flex items-center justify-between p-3 rounded-lg border bg-slate-500/5 border-slate-500/10">
                                <div className="text-sm font-medium text-slate-700 dark:text-slate-400">Silver</div>
                                <div className="font-bold text-slate-700 dark:text-slate-400">
                                    ₹{formatCurrency(form.watch('silver'))}<span className="text-xs font-normal opacity-70">/kg</span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-muted/50">
                    <CardContent className="p-4 text-sm text-muted-foreground">
                        <p>
                            <strong>Tip:</strong> These rates are used as the default reference when creating new invoices,
                            helping you to pre-fill pricing (future feature).
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
