'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Check, Loader2, CreditCard, Shield, Crown, Zap,
    Infinity, Users, BarChart3, Headphones, Sparkles,
    X, Clock, Calendar, AlertTriangle
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

            <div className="space-y-8">
                {/* [NEW] Usage Dashboard */}
                <div className="max-w-4xl mx-auto mb-6">
                    <UsageDashboard shopId={shopId} />
                </div>

                {/* Header Section */}
                <div className="text-center max-w-2xl mx-auto">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 mb-4">
                        <Crown className="h-4 w-4 text-amber-500" />
                        <span className="text-sm font-medium text-amber-600 dark:text-amber-400">Pricing Plans</span>
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
                        Choose Your Plan
                    </h1>
                    <p className="text-muted-foreground text-lg">
                        Unlock the full potential of your jewellery business
                    </p>
                </div>

                {/* Current Pro Plan Banner */}
                {isPro && (
                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 p-[1px]">
                        <div className="relative rounded-2xl bg-background/95 backdrop-blur-sm p-6">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl" />
                            <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 shadow-lg shadow-amber-500/25">
                                        <Crown className="h-6 w-6 text-white" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-bold text-xl">Pro Plan Active</h3>
                                            <Badge className="bg-amber-500 hover:bg-amber-600 text-white">
                                                {isProYearly ? 'Yearly' : 'Monthly'}
                                            </Badge>
                                        </div>
                                        <p className="text-muted-foreground">
                                            Enjoying unlimited invoices and all Pro features
                                        </p>
                                    </div>
                                </div>
                                {currentSubscription?.current_period_end && (
                                    <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-muted/50 border">
                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                        <div>
                                            <span className="text-xs text-muted-foreground block">Renews on</span>
                                            <span className="font-semibold">
                                                {new Date(currentSubscription.current_period_end).toLocaleDateString('en-IN', {
                                                    day: 'numeric',
                                                    month: 'short',
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

                {/* Pricing Cards */}
                <div className="grid gap-6 lg:grid-cols-3 lg:gap-8 pt-6">
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
                <div className="mt-16">
                    <h2 className="text-2xl font-bold text-center mb-8">Why Upgrade to Pro?</h2>
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

                {/* Subscription Details (if subscribed) */}
                {currentSubscription && (
                    <Card className="mt-12 border border-border shadow-sm">
                        <CardHeader>
                            <div className="flex items-center justify-between flex-wrap gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-primary/10">
                                        <CreditCard className="h-5 w-5 text-primary" />
                                    </div>
                                    <h3 className="font-semibold text-lg">Subscription Details</h3>
                                </div>
                                {currentSubscription.razorpay?.short_url && (
                                    <a
                                        href={currentSubscription.razorpay.short_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm text-primary hover:underline flex items-center gap-1"
                                    >
                                        Manage on Razorpay →
                                    </a>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
                            <div className="mt-4 grid gap-4 sm:grid-cols-2">
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
                                <div className="mt-6 p-4 rounded-xl bg-background border flex items-center justify-between flex-wrap gap-4">
                                    <div className="flex items-center gap-3">
                                        <Clock className="h-5 w-5 text-muted-foreground" />
                                        <div>
                                            <span className="text-sm text-muted-foreground">Next billing on</span>
                                            <p className="font-semibold">
                                                {new Date(currentSubscription.current_period_end).toLocaleDateString('en-IN', {
                                                    weekday: 'long',
                                                    day: 'numeric',
                                                    month: 'long',
                                                    year: 'numeric'
                                                })}
                                            </p>
                                        </div>
                                    </div>
                                    <Badge variant="outline" className="text-xs">
                                        ₹499/month
                                    </Badge>
                                </div>
                            )}

                            {/* Cancellation Notice */}
                            {currentSubscription.cancel_at_period_end && currentSubscription.current_period_end && (
                                <div className="mt-6 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30 flex items-center gap-3">
                                    <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0" />
                                    <div>
                                        <p className="font-medium text-yellow-700 dark:text-yellow-400">Subscription Ending</p>
                                        <p className="text-sm text-muted-foreground">
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

                {/* FAQ/Help */}
                <div className="text-center py-8 text-muted-foreground">
                    <p className="text-sm">
                        Have questions? Contact us at{' '}
                        <a href="mailto:support@swarnavyapar.com" className="text-primary hover:underline">
                            support@swarnavyapar.com
                        </a>
                    </p>
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
        <Card className={cn(
            "relative flex flex-col h-full rounded-xl border border-border bg-card shadow-sm transition-all duration-300 hover:shadow-md",
            highlight && "border-amber-500 shadow-amber-500/10 lg:scale-105 z-10",
            current && "ring-2 ring-green-500 ring-offset-2 ring-offset-background",
            badge && "mt-3"
        )}>
            {badge && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-20 whitespace-nowrap">
                    <Badge className={cn("px-4 py-1.5 text-white shadow-lg text-xs font-semibold", badgeColor)}>
                        {badge}
                    </Badge>
                </div>
            )}

            <CardHeader className="pb-4">
                <div className="flex items-center gap-3 mb-2">
                    <div className={cn("p-2 rounded-xl", iconBg)}>
                        {icon}
                    </div>
                    <div>
                        <CardTitle className="text-xl">{title}</CardTitle>
                        <CardDescription className="text-xs">{subtitle}</CardDescription>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="flex-1 space-y-6">
                <div>
                    <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-bold">₹{price.toLocaleString('en-IN')}</span>
                        {period && <span className="text-muted-foreground">{period}</span>}
                    </div>
                    {originalPrice && (
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-sm text-muted-foreground line-through">
                                ₹{originalPrice.toLocaleString('en-IN')}
                            </span>
                            <Badge variant="secondary" className="text-xs text-green-600 bg-green-500/10">
                                {savings}
                            </Badge>
                        </div>
                    )}
                </div>

                <ul className="space-y-3">
                    {features.map((feature: any, i: number) => (
                        <li key={i} className="flex items-start gap-3">
                            {feature.included ? (
                                <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                            ) : (
                                <X className="h-4 w-4 text-muted-foreground/50 mt-0.5 flex-shrink-0" />
                            )}
                            <span className={cn(
                                "text-sm",
                                !feature.included && "text-muted-foreground/50"
                            )}>
                                {feature.text}
                            </span>
                        </li>
                    ))}
                </ul>
            </CardContent>

            <CardFooter className="pt-4">
                <Button
                    className={cn(
                        "w-full",
                        highlight && "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 shadow-lg shadow-amber-500/25"
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
        </Card>
    );
}

// Feature Highlight Component
function FeatureHighlight({ icon, title, description, color }: any) {
    return (
        <div className="p-4 md:p-6 rounded-xl bg-card border border-border text-center hover:shadow-md transition-shadow">
            <div className={cn("inline-flex p-3 rounded-xl mb-3", color)}>
                {icon}
            </div>
            <h4 className="font-semibold text-sm md:text-base">{title}</h4>
            <p className="text-xs md:text-sm text-muted-foreground mt-1">{description}</p>
        </div>
    );
}

// Detail Card Component
function DetailCard({ label, value, status, mono }: any) {
    return (
        <div className="p-4 rounded-xl bg-card border border-border">
            <span className="text-xs text-muted-foreground uppercase tracking-wider">{label}</span>
            <div className={cn(
                "font-medium mt-1 flex items-center gap-2",
                mono && "font-mono text-xs"
            )}>
                {status && (
                    <span className={cn(
                        "w-2 h-2 rounded-full",
                        status === 'success' && "bg-green-500",
                        status === 'warning' && "bg-yellow-500"
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

