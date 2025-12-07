'use client';

import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Sparkles, Crown, Zap, Shield, Infinity } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

type PaymentResultClientProps = {
    shopId: string;
};

export function PaymentResultClient({ shopId }: PaymentResultClientProps) {
    const searchParams = useSearchParams();
    const status = searchParams.get('status');
    const message = searchParams.get('message');
    const subscriptionId = searchParams.get('subscription_id');
    const [showConfetti, setShowConfetti] = useState(false);

    useEffect(() => {
        if (status === 'success') {
            setShowConfetti(true);
            // Dynamic import for confetti
            import('canvas-confetti').then((confetti) => {
                const duration = 3000;
                const end = Date.now() + duration;

                const frame = () => {
                    confetti.default({
                        particleCount: 3,
                        angle: 60,
                        spread: 55,
                        origin: { x: 0 },
                        colors: ['#D4AF37', '#FFD700', '#FFA500']
                    });
                    confetti.default({
                        particleCount: 3,
                        angle: 120,
                        spread: 55,
                        origin: { x: 1 },
                        colors: ['#D4AF37', '#FFD700', '#FFA500']
                    });

                    if (Date.now() < end) {
                        requestAnimationFrame(frame);
                    }
                };
                frame();
            });
        }
    }, [status]);

    if (status === 'success') {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-amber-500/5 to-background">
                <Card className="max-w-lg w-full shadow-2xl border-amber-500/30 overflow-hidden">
                    {/* Gradient Top Banner */}
                    <div className="h-2 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600" />

                    <CardHeader className="text-center pt-8 pb-4">
                        <div className="mx-auto mb-6 relative">
                            <div className="absolute inset-0 bg-amber-500/20 rounded-full blur-xl animate-pulse" />
                            <div className="relative p-5 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 shadow-lg shadow-amber-500/30">
                                <Crown className="h-10 w-10 text-white" />
                            </div>
                        </div>

                        <div className="flex items-center justify-center gap-2 mb-2">
                            <Sparkles className="h-5 w-5 text-amber-500 animate-pulse" />
                            <CardTitle className="text-2xl bg-gradient-to-r from-amber-500 to-amber-700 bg-clip-text text-transparent">
                                Welcome to Pro!
                            </CardTitle>
                            <Sparkles className="h-5 w-5 text-amber-500 animate-pulse" />
                        </div>

                        <CardDescription className="text-base">
                            Your subscription is now active
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-6 pb-8">
                        {/* Features Grid */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                                <Infinity className="h-5 w-5 text-green-500" />
                                <span className="text-sm font-medium">Unlimited Invoices</span>
                            </div>
                            <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                                <Zap className="h-5 w-5 text-blue-500" />
                                <span className="text-sm font-medium">Loans Module</span>
                            </div>
                            <div className="flex items-center gap-2 p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                                <Shield className="h-5 w-5 text-purple-500" />
                                <span className="text-sm font-medium">Priority Support</span>
                            </div>
                            <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                                <Crown className="h-5 w-5 text-amber-500" />
                                <span className="text-sm font-medium">Pro Badge</span>
                            </div>
                        </div>

                        {/* Success Check */}
                        <div className="flex items-center justify-center gap-2 py-3 px-4 rounded-full bg-green-500/10 border border-green-500/20">
                            <CheckCircle className="h-5 w-5 text-green-500" />
                            <span className="text-sm text-green-600 font-medium">Payment Verified Successfully</span>
                        </div>

                        {/* CTA Buttons */}
                        <div className="flex flex-col gap-3 pt-2">
                            <Button asChild size="lg" className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 shadow-lg shadow-amber-500/25">
                                <Link href={`/shop/${shopId}/dashboard`}>
                                    Go to Dashboard
                                </Link>
                            </Button>
                            <Button variant="outline" asChild className="w-full">
                                <Link href={`/shop/${shopId}/settings/billing`}>
                                    View Subscription Details
                                </Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Error State
    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background to-red-500/5">
            <Card className="max-w-md w-full shadow-xl border-red-500/20">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 p-4 rounded-full bg-red-500/10">
                        <XCircle className="h-12 w-12 text-red-500" />
                    </div>
                    <CardTitle className="text-xl text-red-600">Payment Issue</CardTitle>
                    <CardDescription className="text-base">
                        {message || 'Something went wrong with your payment'}
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                    <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground">
                        <p>Don't worry! If you were charged, please contact support with your transaction details and we'll help resolve this immediately.</p>
                    </div>

                    <div className="flex flex-col gap-2">
                        <Button asChild>
                            <Link href={`/shop/${shopId}/settings/billing`}>
                                Try Again
                            </Link>
                        </Button>
                        <Button variant="ghost" asChild>
                            <Link href={`/shop/${shopId}/dashboard`}>
                                Go to Dashboard
                            </Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
