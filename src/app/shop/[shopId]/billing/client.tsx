'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Check, Loader2, CreditCard, Shield, Crown, Zap,
    Infinity, Users, BarChart3, Headphones, Sparkles,
    X, Clock, Calendar, AlertTriangle, ExternalLink
} from 'lucide-react';
import { createSubscriptionAction, cancelSubscriptionAction } from '@/actions/subscription-actions';
import { useToast } from '@/hooks/use-toast';
import Script from 'next/script';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { UsageDashboard } from '@/components/subscription/usage-dashboard'; // [NEW] Import
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

type BillingClientProps = {
    shopId: string;
    currentSubscription: any;
    userEmail: string;
};

export function BillingClient({ shopId, currentSubscription, userEmail }: BillingClientProps) {
    const { toast } = useToast();
    const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
    const router = useRouter();

    // Determine current plan status
    const isPro = currentSubscription?.status === 'active' && currentSubscription?.plan_id === 'pro';
    const isProMonthly = isPro && currentSubscription?.razorpay_subscription_id?.includes('monthly');
    const isProYearly = isPro && !isProMonthly;

    const handleSubscribe = async (planType: 'PRO_MONTHLY' | 'PRO_YEARLY') => {
        try {
            setLoadingPlan(planType);

            const { subscriptionId, keyId } = await createSubscriptionAction(shopId, planType);

            if (!keyId) {
                throw new Error('Payment configuration error. Please contact support.');
            }

            const callbackUrl = `${window.location.origin}/api/razorpay/callback/${shopId}`;

            const options = {
                key: keyId,
                subscription_id: subscriptionId,
                name: "SwarnaVyapar Pro",
                description: planType === 'PRO_MONTHLY' ? "Pro Monthly Subscription" : "Pro Yearly Subscription",
                callback_url: callbackUrl,
                prefill: { email: userEmail },
                theme: { color: "#D4AF37" },
                modal: {
                    ondismiss: function () {
                        setLoadingPlan(null);
                    }
                }
            };

            const rzp = new (window as any).Razorpay(options);
            rzp.open();

        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || 'Failed to initiate payment',
                variant: "destructive"
            });
            setLoadingPlan(null);
        }
    };

    return (
        <>
            <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />

            <div className="min-h-screen bg-background pb-24 transition-colors duration-300">
                {/* --- HEADER SECTION --- */}
                <div className="relative overflow-hidden pb-12">
                    {/* Gradient Background */}
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/10 to-background" />
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/30 via-transparent to-transparent" />

                    {/* Floating Orbs */}
                    <div className="absolute top-0 right-0 w-72 h-72 bg-primary/20 rounded-full blur-3xl -translate-y-1/3 translate-x-1/4 animate-pulse" />
                    <div className="absolute bottom-0 left-0 w-56 h-56 bg-primary/15 rounded-full blur-2xl translate-y-1/3 -translate-x-1/4" />
                    
                    {/* Glass Container */}
                    <div className="relative max-w-5xl mx-auto px-4 md:px-8 py-10 md:py-16">
                        <div className="backdrop-blur-xl bg-white/60 dark:bg-gray-900/60 rounded-3xl border border-white/40 dark:border-white/10 shadow-2xl shadow-primary/10 p-6 md:p-10">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                                {/* Text Content */}
                                <div className="space-y-3">
                                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/10 backdrop-blur-md text-xs font-medium text-primary">
                                        <Crown className="h-3 w-3" />
                                        <span>Subscription & Billing</span>
                                    </div>
                                    <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-foreground via-foreground to-primary bg-clip-text text-transparent break-words line-clamp-2">
                                        Choose Your Plan
                                    </h1>
                                    <p className="text-muted-foreground max-w-md text-base md:text-lg leading-relaxed">
                                        Unlock the full potential of your jewellery business with our Pro features.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- MAIN CONTENT CONTAINER --- */}
                <div className="max-w-5xl mx-auto px-4 md:px-8 -mt-8 relative z-20 space-y-8">
                    
                    <Tabs defaultValue="overview" className="space-y-8">
                        <div className="flex justify-center">
                            <TabsList className="h-14 p-1.5 bg-background/60 backdrop-blur-2xl border border-border/50 shadow-2xl shadow-black/5 rounded-full grid grid-cols-2 w-full max-w-md mx-auto">
                                <TabsTrigger 
                                    value="overview" 
                                    className="rounded-full h-full text-sm font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all capitalize"
                                >
                                    Overview
                                </TabsTrigger>
                                <TabsTrigger 
                                    value="plans" 
                                    className="rounded-full h-full text-sm font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all capitalize"
                                >
                                    Plans & Pricing
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        <TabsContent value="overview" className="space-y-8 focus-visible:outline-none animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {/* Usage Dashboard */}
                            <Card className="border-none shadow-xl shadow-gray-200/50 dark:shadow-black/20 bg-card/80 backdrop-blur-xl overflow-hidden">
                                <UsageDashboard shopId={shopId} />
                            </Card>

                            {/* Current Pro Plan Banner */}
                            {isPro && (
                                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 p-[1px] shadow-2xl shadow-amber-500/20">
                                    <div className="relative rounded-[23px] bg-card/95 backdrop-blur-xl p-6 md:p-10">
                                        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
                                        <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
                                            <div className="flex items-center gap-6">
                                                <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 shadow-lg shadow-amber-500/30 text-white transform transition-transform hover:scale-110 duration-300">
                                                    <Crown className="h-10 w-10" />
                                                </div>
                                                <div className="space-y-2">
                                                    <div className="flex items-center gap-3">
                                                        <h3 className="font-bold text-3xl tracking-tight">Pro Plan Active</h3>
                                                        <Badge className="bg-amber-500 hover:bg-amber-600 text-white border-0 shadow-md px-4 py-1 text-sm">
                                                            {isProYearly ? 'Yearly' : 'Monthly'}
                                                        </Badge>
                                                    </div>
                                                    <p className="text-muted-foreground text-lg">
                                                        You have full access to all premium features.
                                                    </p>
                                                </div>
                                            </div>
                                            {currentSubscription?.current_period_end && (
                                                <div className="flex items-center gap-5 px-6 py-4 rounded-2xl bg-muted/50 border border-border/50 backdrop-blur-sm hover:bg-muted/80 transition-colors">
                                                    <div className="p-3 rounded-full bg-background shadow-sm">
                                                        <Calendar className="h-6 w-6 text-muted-foreground" />
                                                    </div>
                                                    <div>
                                                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Renews on</span>
                                                        <span className="font-bold text-xl text-foreground block mt-0.5">
                                                            {new Date(currentSubscription.current_period_end).toLocaleDateString('en-IN', {
                                                                day: 'numeric',
                                                                month: 'long',
                                                                year: 'numeric'
                                                            })}
                                                        </span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Subscription Details (if subscribed) */}
                            {currentSubscription && (
                                <Card className="border-none shadow-xl shadow-gray-200/50 dark:shadow-black/20 bg-card/80 backdrop-blur-xl">
                                    <CardHeader className="pb-6 border-b border-border/50">
                                        <div className="flex items-center justify-between flex-wrap gap-4">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                                                    <CreditCard className="h-6 w-6" />
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-xl">Subscription Details</h3>
                                                    <p className="text-sm text-muted-foreground">Manage your billing and payment methods</p>
                                                </div>
                                            </div>
                                            {currentSubscription.razorpay?.short_url && (
                                                <Button variant="outline" className="rounded-full" asChild>
                                                    <a
                                                        href={currentSubscription.razorpay.short_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                    >
                                                        Manage on Razorpay <ExternalLink className="ml-2 h-4 w-4" />
                                                    </a>
                                                </Button>
                                            )}
                                        </div>
                                    </CardHeader>
                                    <CardContent className="pt-8">
                                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                                            <DetailCard
                                                label="Status"
                                                value={currentSubscription.cancel_at_period_end
                                                    ? 'Cancelling'
                                                    : (currentSubscription.razorpay?.status || currentSubscription.status)}
                                                status={currentSubscription.cancel_at_period_end
                                                    ? 'warning'
                                                    : (currentSubscription.razorpay?.status || currentSubscription.status) === 'active' ? 'success' : 'warning'}
                                            />
                                            <DetailCard
                                                label="Plan"
                                                value={currentSubscription.plan_id === 'pro' ? 'Pro' : 'Free'}
                                            />
                                            <DetailCard
                                                label="Billing Period"
                                                value={currentSubscription.current_period_end
                                                    ? `${new Date(currentSubscription.current_period_start || currentSubscription.created_at).toLocaleDateString('en-IN', {
                                                        day: 'numeric', month: 'short'
                                                    })} - ${new Date(currentSubscription.current_period_end).toLocaleDateString('en-IN', {
                                                        day: 'numeric', month: 'short'
                                                    })}`
                                                    : 'N/A'
                                                }
                                            />
                                            <DetailCard
                                                label="Payments Made"
                                                value={currentSubscription.razorpay?.paid_count
                                                    ? `${currentSubscription.razorpay.paid_count} payment${currentSubscription.razorpay.paid_count > 1 ? 's' : ''}`
                                                    : '1 payment'
                                                }
                                            />
                                        </div>

                                        {/* Subscription ID & Plan ID */}
                                        <div className="mt-8 pt-8 border-t border-border/50 grid gap-6 sm:grid-cols-2">
                                            <DetailCard
                                                label="Subscription ID"
                                                value={currentSubscription.razorpay_subscription_id || 'N/A'}
                                                mono
                                            />
                                            <DetailCard
                                                label="Razorpay Plan ID"
                                                value={currentSubscription.razorpay_plan_id || currentSubscription.razorpay?.plan_id || 'N/A'}
                                                mono
                                            />
                                        </div>

                                        {/* Next Billing Info */}
                                        {currentSubscription.current_period_end && !currentSubscription.cancel_at_period_end && (
                                            <div className="mt-8 p-6 rounded-2xl bg-muted/30 border border-border/50 flex items-center justify-between flex-wrap gap-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="p-2 rounded-full bg-background shadow-sm">
                                                        <Clock className="h-5 w-5 text-muted-foreground" />
                                                    </div>
                                                    <div>
                                                        <span className="text-sm font-medium text-muted-foreground">Next billing date</span>
                                                        <p className="font-bold text-lg">
                                                            {new Date(currentSubscription.current_period_end).toLocaleDateString('en-IN', {
                                                                weekday: 'long',
                                                                day: 'numeric',
                                                                month: 'long',
                                                                year: 'numeric'
                                                            })}
                                                        </p>
                                                    </div>
                                                </div>
                                                <Badge variant="secondary" className="text-sm px-4 py-1.5 bg-background shadow-sm">
                                                    ₹499/month
                                                </Badge>
                                            </div>
                                        )}

                                        {/* Cancellation Notice */}
                                        {currentSubscription.cancel_at_period_end && currentSubscription.current_period_end && (
                                            <div className="mt-8 p-6 rounded-2xl bg-yellow-500/5 border border-yellow-500/20 flex items-center gap-4">
                                                <div className="p-2 rounded-full bg-yellow-500/10">
                                                    <AlertTriangle className="h-6 w-6 text-yellow-600" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-yellow-700 dark:text-yellow-400 text-lg">Subscription Ending</p>
                                                    <p className="text-muted-foreground">
                                                        Your Pro access will end on {new Date(currentSubscription.current_period_end).toLocaleDateString('en-IN', {
                                                            day: 'numeric', month: 'long', year: 'numeric'
                                                        })}
                                                    </p>
                                                </div>
                                            </div>
                                        )}

                                        {/* Cancel Subscription Button */}
                                        {isPro && !currentSubscription.cancel_at_period_end && (
                                            <CancelSubscriptionButton
                                                shopId={shopId}
                                                subscriptionId={currentSubscription.razorpay_subscription_id}
                                            />
                                        )}
                                    </CardContent>
                                </Card>
                            )}
                        </TabsContent>

                        <TabsContent value="plans" className="space-y-12 focus-visible:outline-none animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {/* Pricing Cards */}
                            <div className="grid gap-6 lg:grid-cols-3 lg:gap-8">
                                {/* Free Plan */}
                                <PricingCard
                                    title="Free"
                                    subtitle="Getting Started"
                                    price={0}
                                    period=""
                                    features={[
                                        { text: "50 Invoices / month", included: true },
                                        { text: "Basic Dashboard", included: true },
                                        { text: "Single User", included: true },
                                        { text: "Email Support", included: true },
                                        { text: "Loans Module", included: false },
                                        { text: "Advanced Analytics", included: false },
                                    ]}
                                    icon={<Zap className="h-5 w-5" />}
                                    iconBg="bg-gray-500/10 text-gray-500"
                                    current={!isPro}
                                    disabled={true}
                                    onAction={() => { }}
                                />

                                {/* Pro Monthly - Highlighted */}
                                <PricingCard
                                    title="Pro"
                                    subtitle="Most Popular"
                                    price={499}
                                    period="/month"
                                    highlight
                                    features={[
                                        { text: "Unlimited Invoices", included: true },
                                        { text: "Loans & Girvi Module", included: true },
                                        { text: "Advanced Analytics", included: true },
                                        { text: "Up to 5 Staff Members", included: true },
                                        { text: "Priority Support", included: true },
                                        { text: "Remove Watermark", included: true },
                                    ]}
                                    icon={<Crown className="h-5 w-5" />}
                                    iconBg="bg-amber-500/10 text-amber-500"
                                    current={isProMonthly}
                                    loading={loadingPlan === 'PRO_MONTHLY'}
                                    disabled={isPro}
                                    onAction={() => handleSubscribe('PRO_MONTHLY')}
                                    badge="Popular"
                                />

                                {/* Pro Yearly - Best Value */}
                                <PricingCard
                                    title="Pro Yearly"
                                    subtitle="Best Value"
                                    price={4999}
                                    period="/year"
                                    originalPrice={5988}
                                    savings="Save ₹989"
                                    features={[
                                        { text: "Everything in Pro Monthly", included: true },
                                        { text: "2 Months Free", included: true },
                                        { text: "Priority Onboarding", included: true },
                                        { text: "Dedicated Support", included: true },
                                        { text: "Early Access Features", included: true },
                                        { text: "Custom Templates", included: true },
                                    ]}
                                    icon={<Sparkles className="h-5 w-5" />}
                                    iconBg="bg-purple-500/10 text-purple-500"
                                    current={isProYearly}
                                    loading={loadingPlan === 'PRO_YEARLY'}
                                    disabled={isPro}
                                    onAction={() => handleSubscribe('PRO_YEARLY')}
                                    badge="Best Value"
                                    badgeColor="bg-purple-500"
                                />
                            </div>

                            {/* Features Comparison */}
                            <div>
                                <h2 className="text-3xl font-bold text-center mb-10 tracking-tight">Why Upgrade to Pro?</h2>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                                    <FeatureHighlight
                                        icon={<Infinity className="h-6 w-6" />}
                                        title="Unlimited Invoices"
                                        description="No monthly limits"
                                        color="text-green-500 bg-green-500/10"
                                    />
                                    <FeatureHighlight
                                        icon={<CreditCard className="h-6 w-6" />}
                                        title="Loans Module"
                                        description="Track girvi & loans"
                                        color="text-blue-500 bg-blue-500/10"
                                    />
                                    <FeatureHighlight
                                        icon={<BarChart3 className="h-6 w-6" />}
                                        title="Analytics"
                                        description="Deep insights"
                                        color="text-purple-500 bg-purple-500/10"
                                    />
                                    <FeatureHighlight
                                        icon={<Headphones className="h-6 w-6" />}
                                        title="Priority Support"
                                        description="24/7 assistance"
                                        color="text-amber-500 bg-amber-500/10"
                                    />
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>

                    {/* FAQ/Help */}
                    <div className="text-center py-12 text-muted-foreground border-t border-border/50">
                        <p className="text-sm">
                            Have questions? Contact us at{' '}
                            <a href="mailto:support@swarnavyapar.com" className="text-primary hover:underline font-medium">
                                support@swarnavyapar.com
                            </a>
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}

// Improved Pricing Card Component
function PricingCard({
    title,
    subtitle,
    price,
    period,
    originalPrice,
    savings,
    features,
    icon,
    iconBg,
    highlight = false,
    current = false,
    loading = false,
    disabled = false,
    onAction,
    badge,
    badgeColor = "bg-amber-500"
}: any) {
    return (
        <div className={cn(
            "relative flex flex-col h-full rounded-3xl border transition-all duration-300 group",
            highlight 
                ? "border-amber-500/30 shadow-2xl shadow-amber-500/10 bg-card/80 backdrop-blur-xl z-10" 
                : "border-border/50 shadow-lg hover:shadow-xl bg-card/40 backdrop-blur-md hover:bg-card/60",
            current && "ring-2 ring-green-500 ring-offset-2 ring-offset-background"
        )}>
            {/* Gradient Glow for Highlighted Card */}
            {highlight && (
                <div className="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none">
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-transparent opacity-50" />
                </div>
            )}

            {badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20 whitespace-nowrap">
                    <Badge className={cn("px-3 py-1 text-white shadow-lg text-[10px] font-bold tracking-wide rounded-full uppercase", badgeColor)}>
                        {badge}
                    </Badge>
                </div>
            )}

            <CardHeader className="pb-2 pt-6 relative z-10">
                <div className="flex items-center gap-3 mb-1">
                    <div className={cn("p-2.5 rounded-xl shadow-inner", iconBg)}>
                        {icon}
                    </div>
                    <div>
                        <CardTitle className="text-lg font-bold tracking-tight">{title}</CardTitle>
                        <CardDescription className="text-[10px] font-medium uppercase tracking-wider opacity-80">{subtitle}</CardDescription>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="flex-1 space-y-5 relative z-10">
                <div className="space-y-1">
                    <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-extrabold tracking-tight">₹{price.toLocaleString('en-IN')}</span>
                        {period && <span className="text-muted-foreground font-medium text-sm">{period}</span>}
                    </div>
                    {originalPrice && (
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground line-through decoration-red-500/50 decoration-2">
                                ₹{originalPrice.toLocaleString('en-IN')}
                            </span>
                            <Badge variant="secondary" className="text-[10px] font-bold text-green-600 bg-green-500/10 border-0 px-1.5 py-0">
                                {savings}
                            </Badge>
                        </div>
                    )}
                </div>

                <div className="space-y-4">
                    <div className="h-px w-full bg-gradient-to-r from-transparent via-border to-transparent" />
                    <ul className="space-y-3">
                        {features.map((feature: any, i: number) => (
                            <li key={i} className="flex items-start gap-2.5 group/item">
                                {feature.included ? (
                                    <div className="p-0.5 rounded-full bg-green-500/10 mt-0.5 group-hover/item:bg-green-500/20 transition-colors">
                                        <Check className="h-3 w-3 text-green-600" />
                                    </div>
                                ) : (
                                    <div className="p-0.5 rounded-full bg-muted mt-0.5">
                                        <X className="h-3 w-3 text-muted-foreground/50" />
                                    </div>
                                )}
                                <span className={cn(
                                    "text-sm font-medium transition-colors",
                                    feature.included ? "text-foreground/90" : "text-muted-foreground/60"
                                )}>
                                    {feature.text}
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>
            </CardContent>

            <CardFooter className="pt-2 pb-6 relative z-10">
                <Button
                    className={cn(
                        "w-full rounded-xl h-10 font-bold text-sm shadow-sm transition-all duration-300",
                        highlight 
                            ? "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 shadow-amber-500/25 hover:shadow-amber-500/40 hover:-translate-y-0.5" 
                            : "hover:bg-primary/5 hover:text-primary hover:border-primary/30"
                    )}
                    variant={highlight ? "default" : "outline"}
                    size="lg"
                    disabled={current || loading || disabled}
                    onClick={onAction}
                >
                    {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : current ? (
                        <span className="flex items-center gap-2">
                            <Check className="h-4 w-4" /> Current Plan
                        </span>
                    ) : disabled ? (
                        "Already Subscribed"
                    ) : (
                        "Subscribe Now"
                    )}
                </Button>
            </CardFooter>
        </div>
    );
}

// Feature Highlight Component
function FeatureHighlight({ icon, title, description, color }: any) {
    return (
        <div className="p-4 md:p-6 rounded-3xl bg-card/40 backdrop-blur-xl border border-border/50 text-center hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group">
            <div className={cn("inline-flex p-4 rounded-2xl mb-4 shadow-sm transition-transform group-hover:scale-110 duration-300", color)}>
                {icon}
            </div>
            <h4 className="font-bold text-sm md:text-base">{title}</h4>
            <p className="text-xs md:text-sm text-muted-foreground mt-1 font-medium">{description}</p>
        </div>
    );
}

// Detail Card Component
function DetailCard({ label, value, status, mono }: any) {
    return (
        <div className="p-5 rounded-2xl bg-muted/30 border border-border/50 backdrop-blur-sm">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{label}</span>
            <div className={cn(
                "font-semibold mt-1.5 flex items-center gap-2 text-base",
                mono && "font-mono text-sm"
            )}>
                {status && (
                    <span className={cn(
                        "w-2.5 h-2.5 rounded-full shadow-sm",
                        status === 'success' && "bg-green-500 shadow-green-500/50",
                        status === 'warning' && "bg-yellow-500 shadow-yellow-500/50"
                    )} />
                )}
                <span className="capitalize truncate">{value}</span>
            </div>
        </div>
    );
}

// Cancel Subscription Button Component
function CancelSubscriptionButton({ shopId, subscriptionId }: { shopId: string; subscriptionId: string }) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();
    const router = useRouter();

    const handleCancel = async () => {
        try {
            setLoading(true);
            const result = await cancelSubscriptionAction(shopId, subscriptionId, true);

            toast({
                title: "Subscription Cancelled",
                description: result.message,
            });

            setOpen(false);
            router.refresh();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to cancel subscription",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="mt-6 pt-6 border-t">
            <AlertDialog open={open} onOpenChange={setOpen}>
                <AlertDialogTrigger asChild>
                    <Button variant="ghost" className="text-red-500 hover:text-red-600 hover:bg-red-500/10">
                        <X className="h-4 w-4 mr-2" />
                        Cancel Subscription
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Cancel Your Pro Subscription?</AlertDialogTitle>
                        <AlertDialogDescription className="space-y-3">
                            <p>Are you sure you want to cancel your subscription?</p>
                            <div className="rounded-lg bg-muted p-3 text-sm">
                                <p className="font-medium text-foreground mb-1">What happens next:</p>
                                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                                    <li>Your Pro access continues until the end of the billing period</li>
                                    <li>You won't be charged again</li>
                                    <li>After the period ends, you'll be on the Free plan</li>
                                    <li>You can resubscribe anytime</li>
                                </ul>
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={loading}>Keep Subscription</AlertDialogCancel>
                        <Button
                            variant="destructive"
                            onClick={handleCancel}
                            disabled={loading}
                        >
                            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Yes, Cancel Subscription
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

