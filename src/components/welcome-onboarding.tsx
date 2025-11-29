'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Sparkles,
    Building2,
    Package,
    FileText,
    Users,
    Settings,
    CheckCircle2,
    ArrowRight,
    XCircle,
} from 'lucide-react';
import { useActiveShop } from '@/hooks/use-active-shop';
import { supabase } from '@/supabase/client';
import { useUser } from '@/supabase/provider';
import { cn } from '@/lib/utils';
import Confetti from 'react-confetti';
import { useWindowSize } from '@/hooks/use-window-size';
import { useRouter } from 'next/navigation';

const ONBOARDING_STEPS = [
    {
        id: 'welcome',
        icon: Sparkles,
        title: 'Welcome to SwarnaVyapar!',
        description: 'Your all-in-one jewelry business management platform',
        tips: [
            'Manage inventory, create invoices, and track customers',
            'Multi-shop support for growing businesses',
            'Real-time gold/silver rate integration',
        ],
    },
    {
        id: 'profile',
        icon: Building2,
        title: 'Your Shop Profile',
        description: 'Complete your shop details for professional invoices',
        tips: [
            'Add your logo for branded invoices',
            'Set up GST/tax information',
            'Configure default tax rates',
        ],
        action: { label: 'Go to Settings', route: '/dashboard/settings' },
    },
    {
        id: 'stock',
        icon: Package,
        title: 'Add Your Inventory',
        description: 'Start tracking your jewelry stock',
        tips: [
            'Add items with photos and details',
            'Track gold/silver weight and making charges',
            'Set price calculations automatically',
        ],
        action: { label: 'Add Stock', route: '/dashboard/stock' },
    },
    {
        id: 'invoice',
        icon: FileText,
        title: 'Create Invoices',
        description: 'Generate professional invoices in seconds',
        tips: [
            'Select items from your inventory',
            'Auto-calculate taxes and totals',
            'Print or share via WhatsApp',
        ],
        action: { label: 'Create Invoice', route: '/dashboard/invoices' },
    },
    {
        id: 'customers',
        icon: Users,
        title: 'Manage Customers',
        description: 'Build lasting relationships with your clients',
        tips: [
            'Track customer purchase history',
            'Loyalty points and rewards',
            'Khata book for credit management',
        ],
        action: { label: 'Add Customer', route: '/dashboard/customers' },
    },
];

export function WelcomeOnboardingModal() {
    const [isOpen, setIsOpen] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [showConfetti, setShowConfetti] = useState(false);
    const [stats, setStats] = useState({ hasLogo: false, hasGST: false, stockCount: 0, invoiceCount: 0, customerCount: 0 });
    const { activeShop } = useActiveShop();
    const { user } = useUser();
    const { width, height } = useWindowSize();
    const router = useRouter();

    // Check if user should see welcome modal
    useEffect(() => {
        const checkWelcomeStatus = async () => {
            if (!activeShop?.id || !user) return;

            // Check if already seen for this shop
            const seenKey = `welcome-seen-${activeShop.id}`;
            if (localStorage.getItem(seenKey)) return;

            // Check if shop was just created (within last 5 minutes)
            const shopCreatedAt = new Date(activeShop.createdAt || new Date()).getTime();
            const now = Date.now();
            const fiveMinutes = 5 * 60 * 1000;

            if (now - shopCreatedAt > fiveMinutes) return;

            // Fetch shop stats for contextual content
            const [logoExists, gstExists] = await Promise.all([
                activeShop.logoUrl ? true : false,
                activeShop.gstNumber ? true : false,
            ]);

            const { data: stockData } = await supabase
                .from('stock_items')
                .select('id', { count: 'exact', head: true })
                .eq('shop_id', activeShop.id);

            const { data: invoiceData } = await supabase
                .from('invoices')
                .select('id', { count: 'exact', head: true })
                .eq('shop_id', activeShop.id);

            const { data: customerData } = await supabase
                .from('customers')
                .select('id', { count: 'exact', head: true })
                .eq('shop_id', activeShop.id);

            setStats({
                hasLogo: logoExists,
                hasGST: gstExists,
                stockCount: stockData?.length || 0,
                invoiceCount: invoiceData?.length || 0,
                customerCount: customerData?.length || 0,
            });

            setIsOpen(true);
            setShowConfetti(true);

            // Stop confetti after 5 seconds
            setTimeout(() => setShowConfetti(false), 5000);
        };

        checkWelcomeStatus();
    }, [activeShop, user]);

    const handleClose = () => {
        if (activeShop?.id) {
            localStorage.setItem(`welcome-seen-${activeShop.id}`, 'true');
        }
        setIsOpen(false);
    };

    const handleNext = () => {
        if (currentStep < ONBOARDING_STEPS.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            handleClose();
        }
    };

    const handleAction = (route: string) => {
        handleClose();
        router.push(route);
    };

    const currentStepData = ONBOARDING_STEPS[currentStep];

    // Determine completion status for checklist
    const getCompletionStatus = () => {
        const completed = [];
        const pending = [];

        if (stats.hasLogo && stats.hasGST) {
            completed.push('Complete shop profile');
        } else {
            pending.push('Complete shop profile');
        }

        if (stats.stockCount > 0) {
            completed.push('Add inventory items');
        } else {
            pending.push('Add inventory items');
        }

        if (stats.invoiceCount > 0) {
            completed.push('Create first invoice');
        } else {
            pending.push('Create first invoice');
        }

        if (stats.customerCount > 0) {
            completed.push('Add customers');
        } else {
            pending.push('Add customers');
        }

        return { completed, pending };
    };

    const { completed, pending } = getCompletionStatus();
    const progress = Math.round((completed.length / (completed.length + pending.length)) * 100);

    return (
        <>
            {showConfetti && <Confetti width={width} height={height} recycle={false} numberOfPieces={500} />}

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="sm:max-w-2xl border-none shadow-2xl bg-gradient-to-br from-white via-gold-50/30 to-white dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
                    <DialogHeader>
                        <DialogTitle className="sr-only">Welcome to SwarnaVyapar</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-6 py-4">
                        {/* Progress dots */}
                        <div className="flex justify-center gap-2">
                            {ONBOARDING_STEPS.map((_, index) => (
                                <div
                                    key={index}
                                    className={cn(
                                        'h-2 rounded-full transition-all duration-300',
                                        index === currentStep ? 'w-8 bg-gold-500' : 'w-2 bg-slate-200 dark:bg-slate-800'
                                    )}
                                />
                            ))}
                        </div>

                        {/* Content */}
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentStep}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.3 }}
                                className="space-y-6"
                            >
                                {/* Icon */}
                                <div className="flex justify-center">
                                    <div className="relative">
                                        <div className="absolute inset-0 bg-gold-500/20 rounded-full blur-2xl animate-pulse" />
                                        <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-gold-500 to-gold-600 flex items-center justify-center shadow-xl shadow-gold-500/30">
                                            {currentStepData && <currentStepData.icon className="h-10 w-10 text-white" />}
                                        </div>
                                    </div>
                                </div>

                                {/* Title & Description */}
                                <div className="text-center space-y-2">
                                    <h3 className="text-2xl font-bold font-heading">{currentStepData?.title}</h3>
                                    <p className="text-muted-foreground">{currentStepData?.description}</p>
                                </div>

                                {/* Tips */}
                                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-6 space-y-3">
                                    <p className="text-sm font-semibold text-gold-700 dark:text-gold-400 flex items-center gap-2">
                                        <Sparkles className="h-4 w-4" />
                                        Quick Tips
                                    </p>
                                    <ul className="space-y-2">
                                        {currentStepData?.tips.map((tip, index) => (
                                            <li key={index} className="flex items-start gap-2 text-sm">
                                                <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                                                <span>{tip}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {/* Onboarding Checklist (show on last step) */}
                                {currentStep === ONBOARDING_STEPS.length - 1 && (
                                    <div className="bg-gradient-to-br from-gold-50 to-amber-50 dark:from-gold-950/20 dark:to-amber-950/20 rounded-xl p-6 space-y-4 border border-gold-200 dark:border-gold-800">
                                        <div className="flex items-center justify-between">
                                            <p className="font-semibold">Your Progress</p>
                                            <Badge variant="secondary" className="bg-gold-500 text-white">
                                                {progress}% Complete
                                            </Badge>
                                        </div>

                                        <div className="space-y-2">
                                            {completed.map((item, index) => (
                                                <div key={`completed-${index}`} className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400">
                                                    <CheckCircle2 className="h-4 w-4" />
                                                    <span className="line-through opacity-75">{item}</span>
                                                </div>
                                            ))}
                                            {pending.map((item, index) => (
                                                <div key={`pending-${index}`} className="flex items-center gap-2 text-sm">
                                                    <XCircle className="h-4 w-4 text-slate-400" />
                                                    <span>{item}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Action button for specific steps */}
                                {currentStepData?.action && (
                                    <Button
                                        onClick={() => handleAction(currentStepData.action!.route)}
                                        variant="outline"
                                        className="w-full border-gold-300 hover:bg-gold-50 dark:border-gold-800 dark:hover:bg-gold-950/20"
                                    >
                                        {currentStepData.action.label}
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </Button>
                                )}
                            </motion.div>
                        </AnimatePresence>

                        {/* Navigation */}
                        <div className="flex justify-between items-center pt-4">
                            <Button
                                variant="ghost"
                                onClick={handleClose}
                                className="text-muted-foreground hover:text-foreground"
                            >
                                Skip Tour
                            </Button>
                            <Button
                                onClick={handleNext}
                                className="bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700 text-white shadow-lg shadow-gold-500/25"
                            >
                                {currentStep === ONBOARDING_STEPS.length - 1 ? "Let's Get Started!" : 'Next'}
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
