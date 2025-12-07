'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Loader2, Sparkles } from 'lucide-react';
import { verifyRazorpayPayment } from '@/actions/verify-payment';
import Link from 'next/link';
import confetti from 'canvas-confetti';

type PaymentSuccessClientProps = {
    shopId: string;
};

export function PaymentSuccessClient({ shopId }: PaymentSuccessClientProps) {
    const searchParams = useSearchParams();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('');

    useEffect(() => {
        const verifyPayment = async () => {
            const payment_id = searchParams.get('razorpay_payment_id');
            const subscription_id = searchParams.get('razorpay_subscription_id');
            const signature = searchParams.get('razorpay_signature');

            if (!payment_id || !subscription_id || !signature) {
                setStatus('error');
                setMessage('Missing payment details. Please contact support.');
                return;
            }

            try {
                await verifyRazorpayPayment(payment_id, subscription_id, signature, shopId);
                setStatus('success');
                setMessage('Your Pro subscription is now active!');

                // Celebrate!
                confetti({
                    particleCount: 100,
                    spread: 70,
                    origin: { y: 0.6 }
                });
            } catch (error: any) {
                setStatus('error');
                setMessage(error.message || 'Payment verification failed.');
            }
        };

        verifyPayment();
    }, [searchParams, shopId]);

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-amber-500/5">
            <Card className="max-w-md w-full shadow-2xl border-amber-500/20">
                <CardHeader className="text-center pb-2">
                    {status === 'loading' && (
                        <>
                            <div className="mx-auto mb-4 p-4 rounded-full bg-primary/10">
                                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                            </div>
                            <CardTitle className="text-xl">Verifying Payment...</CardTitle>
                            <CardDescription>Please wait while we confirm your subscription.</CardDescription>
                        </>
                    )}

                    {status === 'success' && (
                        <>
                            <div className="mx-auto mb-4 p-4 rounded-full bg-green-500/10">
                                <CheckCircle className="h-12 w-12 text-green-500" />
                            </div>
                            <div className="flex items-center justify-center gap-2">
                                <Sparkles className="h-5 w-5 text-amber-500" />
                                <CardTitle className="text-xl text-green-600">Welcome to Pro!</CardTitle>
                                <Sparkles className="h-5 w-5 text-amber-500" />
                            </div>
                            <CardDescription className="text-base mt-2">{message}</CardDescription>
                        </>
                    )}

                    {status === 'error' && (
                        <>
                            <div className="mx-auto mb-4 p-4 rounded-full bg-red-500/10">
                                <XCircle className="h-12 w-12 text-red-500" />
                            </div>
                            <CardTitle className="text-xl text-red-600">Payment Issue</CardTitle>
                            <CardDescription>{message}</CardDescription>
                        </>
                    )}
                </CardHeader>

                <CardContent className="text-center space-y-6 pt-4">
                    {status === 'success' && (
                        <>
                            <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-amber-500/10 rounded-lg p-4 border border-amber-500/20">
                                <p className="text-sm text-muted-foreground">
                                    🎉 You now have access to <strong>unlimited invoices</strong>,
                                    <strong> Loans & Girvi module</strong>, <strong>Advanced Analytics</strong>,
                                    and <strong>Priority Support</strong>!
                                </p>
                            </div>
                            <div className="flex flex-col gap-3">
                                <Button asChild size="lg" className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700">
                                    <Link href={`/shop/${shopId}/dashboard`}>
                                        Go to Dashboard
                                    </Link>
                                </Button>
                                <Button variant="outline" asChild>
                                    <Link href={`/shop/${shopId}/settings/billing`}>
                                        View Subscription Details
                                    </Link>
                                </Button>
                            </div>
                        </>
                    )}

                    {status === 'error' && (
                        <div className="flex flex-col gap-3">
                            <Button asChild>
                                <Link href={`/shop/${shopId}/settings/billing`}>
                                    Try Again
                                </Link>
                            </Button>
                            <p className="text-xs text-muted-foreground">
                                If you were charged, please contact support with your transaction ID.
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
