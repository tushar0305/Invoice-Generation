'use client';

import { motion } from 'framer-motion';
import { Check, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

const plans = [
    {
        name: "Starter",
        price: "₹999",
        period: "/month",
        description: "Perfect for small showrooms starting their digital journey.",
        features: ["Single User", "Basic Invoicing", "Stock Management", "Daily Reports"],
        popular: false
    },
    {
        name: "Gold Elite",
        price: "₹2,499",
        period: "/month",
        description: "Complete solution for growing jewellery businesses.",
        features: ["Multi-User Access", "Advanced Analytics", "WhatsApp Integration", "GST Filing Reports", "Priority Support"],
        popular: true
    },
    {
        name: "Enterprise",
        price: "Custom",
        period: "",
        description: "For large chains with multiple outlets and custom needs.",
        features: ["Unlimited Users", "Multi-Branch Sync", "Custom API Access", "Dedicated Account Manager", "On-premise Option"],
        popular: false
    }
];

export function Pricing() {
    return (
        <section id="pricing" className="py-24 relative bg-white">
            <div className="container px-4 md:px-6 mx-auto">
                <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
                    <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-slate-900 font-heading">
                        Simple, Transparent Pricing
                    </h2>
                    <p className="text-lg text-slate-600">
                        Choose the plan that fits your business scale. No hidden charges.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                    {plans.map((plan, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            className={`relative p-8 rounded-2xl border flex flex-col text-center ${plan.popular
                                ? 'bg-white border-gold-200 shadow-xl shadow-gold-500/10 ring-1 ring-gold-500/20'
                                : 'bg-slate-50 border-slate-200 hover:shadow-lg transition-shadow'
                                }`}
                        >
                            {plan.popular && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-gold-500 to-gold-600 text-white text-xs font-bold uppercase tracking-wider shadow-lg shadow-gold-500/20 flex items-center gap-1">
                                    <Sparkles className="h-3 w-3" /> Most Popular
                                </div>
                            )}

                            <div className="mb-8">
                                <h3 className="text-xl font-semibold mb-2 text-slate-900">{plan.name}</h3>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-4xl font-bold text-slate-900">{plan.price}</span>
                                    <span className="text-slate-500">{plan.period}</span>
                                </div>
                                <p className="text-sm text-slate-600 mt-4 leading-relaxed">
                                    {plan.description}
                                </p>
                            </div>

                            <ul className="space-y-4 mb-8 flex-1">
                                {plan.features.map((feature, i) => (
                                    <li key={i} className="flex items-center gap-3 text-sm text-slate-700">
                                        <div className={`p-1 rounded-full ${plan.popular ? 'bg-gold-100 text-gold-600' : 'bg-slate-200 text-slate-600'}`}>
                                            <Check className="h-3 w-3" />
                                        </div>
                                        <span>{feature}</span>
                                    </li>
                                ))}
                            </ul>

                            <Button
                                className={`w-full ${plan.popular
                                    ? 'bg-black text-white hover:bg-black/80'
                                    : 'bg-white border border-slate-200 text-slate-900 hover:bg-slate-50'
                                    }`}
                            >
                                Get Started
                            </Button>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
