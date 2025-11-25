'use client';

import { motion } from 'framer-motion';
import { Calculator, BarChart3, TrendingUp, ShieldCheck } from 'lucide-react';

const features = [
    {
        icon: Calculator,
        title: 'Smart Billing',
        description: 'Generate GST-compliant invoices for gold, silver, and diamonds in seconds.',
    },
    {
        icon: TrendingUp,
        title: 'Live Gold Rates',
        description: 'Auto-sync with market rates. Never sell at a loss with real-time updates.',
    },
    {
        icon: BarChart3,
        title: 'AI Analytics',
        description: 'Predict sales trends and optimize inventory with smart insights.',
    },
    {
        icon: ShieldCheck,
        title: 'Bank-Grade Security',
        description: 'Your data is encrypted and backed up daily on secure cloud servers.',
    },
];

export function ValueProp() {
    return (
        <section className="py-24 relative z-10 bg-white">
            <div className="container px-4 md:px-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {features.map((feature, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            className="group relative p-6 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-gold-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />

                            <div className="relative z-10">
                                <div className="mb-4 inline-flex p-3 rounded-xl bg-gold-50 text-gold-600 group-hover:scale-110 transition-transform duration-300">
                                    <feature.icon className="h-6 w-6" />
                                </div>
                                <h3 className="text-xl font-semibold mb-2 text-slate-900 group-hover:text-gold-600 transition-colors">
                                    {feature.title}
                                </h3>
                                <p className="text-slate-600 text-sm leading-relaxed">
                                    {feature.description}
                                </p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
