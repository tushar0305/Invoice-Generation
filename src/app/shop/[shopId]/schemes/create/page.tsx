'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useActiveShop } from '@/hooks/use-active-shop';
import { useSchemes } from '@/hooks/use-schemes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ArrowLeft, Check, ChevronRight, Loader2, Coins, Wallet, Gift, Sparkles, Scale, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import type { CreateSchemePayload, SchemeRules } from '@/lib/scheme-types';

export default function CreateSchemePage() {
    const router = useRouter();
    const { activeShop } = useActiveShop();
    const shopId = activeShop?.id;
    const { createScheme } = useSchemes(shopId);
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [step, setStep] = useState(1);

    const [formData, setFormData] = useState<Partial<CreateSchemePayload>>({
        name: '',
        type: 'FIXED_AMOUNT',
        duration_months: 11,
        scheme_amount: 5000,
        rules: {
            grace_period_days: 7,
            max_missed_payments: 2,
            benefit_type: 'LAST_FREE',
            benefit_value: 0,
            gold_conversion: 'MATURITY',
            gold_purity: '22K',
            making_charge_discount: 0
        } as SchemeRules
    });

    const updateFormData = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const updateRules = (field: keyof SchemeRules, value: any) => {
        setFormData(prev => ({
            ...prev,
            rules: { ...prev.rules!, [field]: value }
        }));
    };

    const handleSubmit = async () => {
        if (!shopId || !formData.name || !formData.rules) return;

        setIsSubmitting(true);
        try {
            const payload: CreateSchemePayload = {
                shop_id: shopId,
                name: formData.name,
                type: formData.type!,
                duration_months: Number(formData.duration_months),
                scheme_amount: formData.type === 'FIXED_AMOUNT' ? Number(formData.scheme_amount) : undefined,
                rules: formData.rules
            };

            const { error } = await createScheme(payload);
            if (error) throw error;

            toast({
                title: "Success",
                description: "Scheme created successfully",
            });
            router.push(`/shop/${shopId}/schemes`);
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive"
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const steps = [
        { id: 1, name: 'Details', icon: Coins },
        { id: 2, name: 'Rules', icon: Scale },
        { id: 3, name: 'Launch', icon: Sparkles },
    ];

    return (
        <div className="max-w-2xl mx-auto space-y-6 pb-24 md:pb-8">
            {/* Header */}
            <div className="flex items-center gap-3">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => router.back()}
                    className="shrink-0 h-10 w-10 rounded-full hover:bg-muted"
                >
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold">Create New Scheme</h1>
                    <p className="text-sm text-muted-foreground hidden sm:block">Configure your gold saving plan</p>
                </div>
            </div>

            {/* Steps Indicator */}
            <div className="relative">
                {/* Desktop Steps */}
                <div className="hidden md:flex items-center justify-between">
                    {steps.map((s, idx) => (
                        <div key={s.id} className="flex items-center flex-1">
                            <div className={cn(
                                "flex items-center gap-3 px-4 py-2 rounded-xl transition-all",
                                step >= s.id ? "text-primary" : "text-muted-foreground"
                            )}>
                                <div className={cn(
                                    "h-10 w-10 rounded-full flex items-center justify-center transition-all",
                                    step > s.id ? "bg-primary text-primary-foreground" :
                                        step === s.id ? "bg-primary/10 border-2 border-primary" :
                                            "bg-muted"
                                )}>
                                    {step > s.id ? <Check className="w-5 h-5" /> : <s.icon className="w-5 h-5" />}
                                </div>
                                <span className="font-medium">{s.name}</span>
                            </div>
                            {idx < steps.length - 1 && (
                                <div className={cn(
                                    "flex-1 h-0.5 mx-2 rounded-full transition-colors",
                                    step > s.id ? "bg-primary" : "bg-muted"
                                )} />
                            )}
                        </div>
                    ))}
                </div>

                {/* Mobile Steps */}
                <div className="md:hidden">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-primary">Step {step} of 3</span>
                        <span className="text-sm text-muted-foreground">{steps[step - 1].name}</span>
                    </div>
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-primary to-amber-500 transition-all duration-500 ease-out rounded-full"
                            style={{ width: `${(step / 3) * 100}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Form Card */}
            <Card className="glass-card border-border/50 shadow-xl overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-primary/5 to-amber-500/5 border-b border-border/50">
                    <CardTitle className="text-lg">
                        {step === 1 && "Basic Details"}
                        {step === 2 && "Payment & Benefits"}
                        {step === 3 && "Review & Launch"}
                    </CardTitle>
                    <CardDescription>
                        {step === 1 && "Set the structure of your scheme"}
                        {step === 2 && "Define rules and benefits"}
                        {step === 3 && "Confirm everything before activation"}
                    </CardDescription>
                </CardHeader>

                <CardContent className="p-5 sm:p-6 space-y-6">
                    {/* Step 1: Basic Details */}
                    {step === 1 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="space-y-2">
                                <Label className="text-sm font-medium">Scheme Name</Label>
                                <Input
                                    placeholder="e.g. Swarna Varsha 2024"
                                    value={formData.name}
                                    onChange={(e) => updateFormData('name', e.target.value)}
                                    className="h-12 text-base border-2 focus:border-primary"
                                />
                            </div>

                            <div className="space-y-3">
                                <Label className="text-sm font-medium">Scheme Type</Label>
                                <RadioGroup
                                    value={formData.type}
                                    onValueChange={(v) => updateFormData('type', v)}
                                    className="grid grid-cols-1 sm:grid-cols-2 gap-3"
                                >
                                    <label className={cn(
                                        "relative flex flex-col items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all",
                                        formData.type === 'FIXED_AMOUNT'
                                            ? "border-primary bg-primary/5 shadow-sm"
                                            : "border-muted hover:border-primary/50"
                                    )}>
                                        <RadioGroupItem value="FIXED_AMOUNT" id="fixed" className="sr-only" />
                                        <div className="flex items-center gap-3">
                                            <div className={cn(
                                                "h-10 w-10 rounded-full flex items-center justify-center",
                                                formData.type === 'FIXED_AMOUNT' ? "bg-primary text-primary-foreground" : "bg-muted"
                                            )}>
                                                <Wallet className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <div className="font-semibold">Fixed Amount</div>
                                                <div className="text-xs text-muted-foreground">Same amount every month</div>
                                            </div>
                                        </div>
                                        {formData.type === 'FIXED_AMOUNT' && (
                                            <Check className="absolute top-3 right-3 w-5 h-5 text-primary" />
                                        )}
                                    </label>

                                    <label className={cn(
                                        "relative flex flex-col items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all",
                                        formData.type === 'VARIABLE_AMOUNT'
                                            ? "border-primary bg-primary/5 shadow-sm"
                                            : "border-muted hover:border-primary/50"
                                    )}>
                                        <RadioGroupItem value="VARIABLE_AMOUNT" id="variable" className="sr-only" />
                                        <div className="flex items-center gap-3">
                                            <div className={cn(
                                                "h-10 w-10 rounded-full flex items-center justify-center",
                                                formData.type === 'VARIABLE_AMOUNT' ? "bg-primary text-primary-foreground" : "bg-muted"
                                            )}>
                                                <Coins className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <div className="font-semibold">Flexible Amount</div>
                                                <div className="text-xs text-muted-foreground">Customer chooses amount</div>
                                            </div>
                                        </div>
                                        {formData.type === 'VARIABLE_AMOUNT' && (
                                            <Check className="absolute top-3 right-3 w-5 h-5 text-primary" />
                                        )}
                                    </label>
                                </RadioGroup>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium">Duration</Label>
                                    <Select
                                        value={String(formData.duration_months)}
                                        onValueChange={(v) => updateFormData('duration_months', v)}
                                    >
                                        <SelectTrigger className="h-12 border-2">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="11">11 Months</SelectItem>
                                            <SelectItem value="12">12 Months</SelectItem>
                                            <SelectItem value="24">24 Months</SelectItem>
                                            <SelectItem value="36">36 Months</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                {formData.type === 'FIXED_AMOUNT' && (
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium">Monthly Amount (₹)</Label>
                                        <Input
                                            type="number"
                                            value={formData.scheme_amount}
                                            onChange={(e) => updateFormData('scheme_amount', e.target.value)}
                                            className="h-12 text-base border-2 focus:border-primary"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Step 2: Rules */}
                    {step === 2 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="space-y-3">
                                <Label className="text-sm font-medium">Customer Benefit</Label>
                                <Select
                                    value={formData.rules?.benefit_type}
                                    onValueChange={(v) => updateRules('benefit_type', v)}
                                >
                                    <SelectTrigger className="h-12 border-2">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="LAST_FREE">
                                            <div className="flex items-center gap-2">
                                                <Gift className="w-4 h-4 text-primary" />
                                                Last Installment Free
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="BONUS_PERCENT">Bonus Percentage on Maturity</SelectItem>
                                        <SelectItem value="FIXED_BONUS">Fixed Cash Bonus</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {formData.rules?.benefit_type === 'BONUS_PERCENT' && (
                                <div className="space-y-2 animate-in fade-in duration-200">
                                    <Label className="text-sm font-medium">Bonus Percentage (%)</Label>
                                    <Input
                                        type="number"
                                        value={formData.rules?.benefit_value}
                                        onChange={(e) => updateRules('benefit_value', Number(e.target.value))}
                                        className="h-12 text-base border-2"
                                    />
                                </div>
                            )}

                            {formData.rules?.benefit_type === 'FIXED_BONUS' && (
                                <div className="space-y-2 animate-in fade-in duration-200">
                                    <Label className="text-sm font-medium">Bonus Amount (₹)</Label>
                                    <Input
                                        type="number"
                                        value={formData.rules?.benefit_value}
                                        onChange={(e) => updateRules('benefit_value', Number(e.target.value))}
                                        className="h-12 text-base border-2"
                                    />
                                </div>
                            )}

                            <div className="space-y-3 pt-4 border-t border-border/50">
                                <Label className="text-sm font-medium">Gold Conversion Logic</Label>
                                <RadioGroup
                                    value={formData.rules?.gold_conversion}
                                    onValueChange={(v) => updateRules('gold_conversion', v)}
                                    className="space-y-3"
                                >
                                    <label className={cn(
                                        "flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all",
                                        formData.rules?.gold_conversion === 'MATURITY'
                                            ? "border-primary bg-primary/5"
                                            : "border-muted hover:border-primary/50"
                                    )}>
                                        <RadioGroupItem value="MATURITY" id="maturity" className="mt-1" />
                                        <div>
                                            <div className="font-semibold">At Maturity</div>
                                            <div className="text-sm text-muted-foreground">Gold rate applied when customer redeems.</div>
                                        </div>
                                    </label>
                                    <label className={cn(
                                        "flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all",
                                        formData.rules?.gold_conversion === 'MONTHLY'
                                            ? "border-primary bg-primary/5"
                                            : "border-muted hover:border-primary/50"
                                    )}>
                                        <RadioGroupItem value="MONTHLY" id="monthly" className="mt-1" />
                                        <div>
                                            <div className="font-semibold">Monthly Conversion</div>
                                            <div className="text-sm text-muted-foreground">Each payment buys gold at that day's rate.</div>
                                        </div>
                                    </label>
                                </RadioGroup>
                            </div>

                            <div className="space-y-3 pt-4 border-t border-border/50">
                                <Label className="text-sm font-medium">Gold Purity</Label>
                                <div className="flex gap-3">
                                    {['22K', '24K'].map((purity) => (
                                        <button
                                            key={purity}
                                            type="button"
                                            onClick={() => updateRules('gold_purity', purity)}
                                            className={cn(
                                                "flex-1 py-3 px-4 rounded-xl border-2 font-semibold text-center transition-all",
                                                formData.rules?.gold_purity === purity
                                                    ? "border-primary bg-primary text-primary-foreground"
                                                    : "border-muted hover:border-primary/50"
                                            )}
                                        >
                                            {purity}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Review */}
                    {step === 3 && (
                        <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="bg-gradient-to-br from-muted/50 to-muted/30 rounded-xl p-5 space-y-4 border border-border/50">
                                <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground">Scheme Name</span>
                                    <span className="font-semibold text-foreground">{formData.name || '-'}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground">Type</span>
                                    <span className="font-medium">{formData.type?.replace('_', ' ')}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground">Duration</span>
                                    <span className="font-medium">{formData.duration_months} Months</span>
                                </div>
                                {formData.type === 'FIXED_AMOUNT' && (
                                    <div className="flex justify-between items-center">
                                        <span className="text-muted-foreground">Monthly EMI</span>
                                        <span className="font-bold text-primary text-lg">₹{formData.scheme_amount}</span>
                                    </div>
                                )}

                                <div className="h-px bg-border" />

                                <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground">Benefit</span>
                                    <span className="font-medium">
                                        {formData.rules?.benefit_type === 'LAST_FREE' && 'Last Month Free'}
                                        {formData.rules?.benefit_type === 'BONUS_PERCENT' && `${formData.rules?.benefit_value}% Bonus`}
                                        {formData.rules?.benefit_type === 'FIXED_BONUS' && `₹${formData.rules?.benefit_value} Bonus`}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground">Gold Details</span>
                                    <span className="font-medium">{formData.rules?.gold_purity} • {formData.rules?.gold_conversion}</span>
                                </div>
                            </div>

                            <div className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-sm">
                                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                                <p className="text-amber-800 dark:text-amber-200">
                                    Core rules (Duration, Type, Conversion) cannot be changed after customers enroll to maintain trust.
                                </p>
                            </div>
                        </div>
                    )}
                </CardContent>

                {/* Footer Navigation */}
                <CardFooter className="flex justify-between gap-4 p-5 sm:p-6 bg-muted/30 border-t border-border/50">
                    {step > 1 ? (
                        <Button
                            variant="outline"
                            onClick={() => setStep(step - 1)}
                            className="h-11 px-6"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back
                        </Button>
                    ) : (
                        <div />
                    )}

                    {step < 3 ? (
                        <Button
                            onClick={() => setStep(step + 1)}
                            className="h-11 px-6 gap-2 bg-gradient-to-r from-primary to-amber-600"
                        >
                            Next Step
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                    ) : (
                        <Button
                            onClick={handleSubmit}
                            disabled={isSubmitting || !formData.name}
                            className="h-11 px-8 gap-2 bg-gradient-to-r from-primary to-amber-600 shadow-lg"
                        >
                            {isSubmitting ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Sparkles className="w-4 h-4" />
                            )}
                            Launch Scheme
                        </Button>
                    )}
                </CardFooter>
            </Card>
        </div>
    );
}
