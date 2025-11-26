'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { Zap, TrendingUp, Wallet, Shield, LucideIcon } from 'lucide-react';

interface Feature {
    icon: LucideIcon;
    title: string;
    description: string;
}

const features: Feature[] = [
    {
        icon: Zap,
        title: 'Smart Billing',
        description: 'Generate GST-compliant invoices for gold, silver, and diamonds in seconds.',
    },
    {
        icon: TrendingUp,
        title: 'Live Gold Rates',
        description: 'Auto-sync with market rates. Never sell at a loss with real-time updates.',
    },
    {
        icon: Wallet,
        title: 'Loan Tracker',
        description: 'Manage gold loans and customer credit seamlessly with automated tracking.',
    },
    {
        icon: Shield,
        title: 'Bank-Grade Security',
        description: 'Your data is encrypted and backed up daily on secure cloud servers.',
    },
];

export function ValueProp() {
    const shouldReduceMotion = useReducedMotion();

    return (
        <section 
            className="py-16 md:py-24 relative z-10 bg-white"
            aria-labelledby="value-prop-heading"
        >
            <div className="container px-4 md:px-6 mx-auto">
                {/* Screen reader only heading for section context */}
                <h2 id="value-prop-heading" className="sr-only">Key Features Overview</h2>
                
                <ul 
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 lg:gap-8 max-w-7xl mx-auto"
                    role="list"
                >
                    {features.map((feature, index) => (
                        <motion.li
                            key={feature.title}
                            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-50px" }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            className="group relative p-5 md:p-6 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 focus-within:ring-2 focus-within:ring-gold-500 focus-within:ring-offset-2"
                        >
                            <div 
                                className="absolute inset-0 bg-gradient-to-br from-gold-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" 
                                aria-hidden="true" 
                            />

                            <article className="relative z-10">
                                <div 
                                    className="mb-4 inline-flex p-3 rounded-xl bg-gold-50 text-gold-600 group-hover:scale-110 transition-transform duration-300"
                                    aria-hidden="true"
                                >
                                    <feature.icon className="h-5 w-5 md:h-6 md:w-6" />
                                </div>
                                <h3 className="text-lg md:text-xl font-semibold mb-2 text-slate-900 group-hover:text-gold-600 transition-colors">
                                    {feature.title}
                                </h3>
                                <p className="text-slate-600 text-sm md:text-base leading-relaxed">
                                    {feature.description}
                                </p>
                            </article>
                        </motion.li>
                    ))}
                </ul>
            </div>
        </section>
    );
}
