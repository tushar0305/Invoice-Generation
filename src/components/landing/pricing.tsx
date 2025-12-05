'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { Check, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCallback } from 'react';

interface Plan {
    name: string;
    price: string;
    period: string;
    description: string;
    features: string[];
    popular: boolean;
}

const plans: Plan[] = [
    {
        name: "Starter",
        price: "₹299",
        period: "/month",
        description: "Perfect for small jewellery shops going digital for the first time.",
        features: [
            "Smart Billing & GST Invoices",
            "Customer Directory",
            "Basic Stock Management",
            "Daily Sales Summary",
            "30 AI Insight Queries/mo"
        ],
        popular: false
    },
    {
        name: "Professional",
        price: "₹599",
        period: "/month",
        description: "Everything you need to run your jewellery shop end-to-end.",
        features: [
            "All Starter Features",
            "Advanced Inventory & Purity",
            "Customer CRM & Loyalty",
            "Gold Loan Management",
            "Staff Access (2 Users)",
            "200 AI Insight Queries/mo"
        ],
        popular: true
    },
    {
        name: "Business",
        price: "₹1,299",
        period: "/month",
        description: "For professional stores who want automation & AI growth.",
        features: [
            "All Professional Features",
            "Unlimited Staff Accounts",
            "Multi-Branch Management",
            "AI Forecasting & Predictions",
            "Automated Marketing",
            "Dedicated Onboarding Ops"
        ],
        popular: false
    }
];

export function Pricing() {
    const shouldReduceMotion = useReducedMotion();

    const handleGetStarted = useCallback((planName: string) => {
        // Track analytics and handle signup
        console.log(`Selected plan: ${planName}`);
    }, []);

    return (
        <section
            id="pricing"
            className="py-16 md:py-24 relative bg-white scroll-mt-20"
            aria-labelledby="pricing-heading"
        >
            <div className="container px-4 md:px-6 mx-auto">
                <header className="text-center max-w-3xl mx-auto mb-12 md:mb-16 space-y-4">
                    <h2
                        id="pricing-heading"
                        className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-slate-900 font-heading"
                    >
                        Simple, Transparent Pricing
                    </h2>
                    <p className="text-base md:text-lg text-slate-600 px-4">
                        Choose the plan that fits your business scale. No hidden charges.
                    </p>
                </header>

                <div
                    className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 max-w-6xl mx-auto"
                    role="list"
                    aria-label="Pricing plans"
                >
                    {plans.map((plan, index) => (
                        <motion.article
                            key={plan.name}
                            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-50px" }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            className={`relative p-6 md:p-8 rounded-2xl border flex flex-col text-center ${plan.popular
                                    ? 'bg-white border-gold-200 shadow-xl shadow-gold-500/10 ring-1 ring-gold-500/20'
                                    : 'bg-slate-50 border-slate-200 hover:shadow-lg transition-shadow'
                                }`}
                            role="listitem"
                            aria-labelledby={`plan-${plan.name}-title`}
                        >
                            {plan.popular && (
                                <div
                                    className="absolute -top-3 md:-top-4 left-1/2 -translate-x-1/2 px-3 md:px-4 py-1 rounded-full bg-gradient-to-r from-gold-500 to-gold-600 text-white text-xs font-bold uppercase tracking-wider shadow-lg shadow-gold-500/20 flex items-center gap-1"
                                    role="status"
                                >
                                    <Sparkles className="h-3 w-3" aria-hidden="true" />
                                    <span>Most Popular</span>
                                </div>
                            )}

                            <div className="mb-6 md:mb-8">
                                <h3
                                    id={`plan-${plan.name}-title`}
                                    className="text-lg md:text-xl font-semibold mb-2 text-slate-900"
                                >
                                    {plan.name}
                                </h3>
                                <div className="flex items-baseline justify-center gap-1">
                                    <span className="text-3xl md:text-4xl font-bold text-slate-900">
                                        {plan.price}
                                    </span>
                                    {plan.period && (
                                        <span className="text-slate-500 text-sm md:text-base">
                                            {plan.period}
                                        </span>
                                    )}
                                </div>
                                <p className="text-sm text-slate-600 mt-3 md:mt-4 leading-relaxed px-2">
                                    {plan.description}
                                </p>
                            </div>

                            <ul
                                className="space-y-3 md:space-y-4 mb-6 md:mb-8 flex-1"
                                aria-label={`Features included in ${plan.name} plan`}
                            >
                                {plan.features.map((feature) => (
                                    <li
                                        key={feature}
                                        className="flex items-center gap-3 text-sm text-slate-700 justify-center md:justify-start"
                                    >
                                        <div
                                            className={`p-1 rounded-full flex-shrink-0 ${plan.popular
                                                    ? 'bg-gold-100 text-gold-600'
                                                    : 'bg-slate-200 text-slate-600'
                                                }`}
                                            aria-hidden="true"
                                        >
                                            <Check className="h-3 w-3" />
                                        </div>
                                        <span>{feature}</span>
                                    </li>
                                ))}
                            </ul>

                            <Button
                                onClick={() => handleGetStarted(plan.name)}
                                className={`w-full min-h-[48px] text-base font-semibold transition-all focus-visible:ring-2 focus-visible:ring-gold-500 focus-visible:ring-offset-2 ${plan.popular
                                        ? 'bg-slate-900 text-white hover:bg-slate-800'
                                        : 'bg-white border border-slate-200 text-slate-900 hover:bg-slate-50'
                                    }`}
                                aria-describedby={`plan-${plan.name}-title`}
                            >
                                Get Started
                            </Button>
                        </motion.article>
                    ))}
                </div>
            </div>
        </section>
    );
}
