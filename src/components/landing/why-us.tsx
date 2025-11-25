'use client';

import { motion } from 'framer-motion';
import { WifiOff, Shield, Users, Clock } from 'lucide-react';

const reasons = [
    {
        icon: WifiOff,
        title: "Works Offline",
        description: "Internet down? No problem. Continue billing and sync automatically when online."
    },
    {
        icon: Shield,
        title: "Secure & Private",
        description: "Your business data is yours alone. Enterprise-grade encryption keeps it safe."
    },
    {
        icon: Users,
        title: "Multi-User Access",
        description: "Granular permissions for owners, managers, and staff members."
    },
    {
        icon: Clock,
        title: "24/7 Support",
        description: "Dedicated support team to help you whenever you need assistance."
    }
];

export function WhyUs() {
    return (
        <section className="py-24 relative bg-white">
            <div className="container px-4 md:px-6 mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center max-w-7xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                    >
                        <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-6 text-slate-900 font-heading">
                            Why Choose SwarnaVyapar?
                        </h2>
                        <p className="text-lg text-slate-600 mb-8">
                            We combine traditional business values with cutting-edge technology to give you the best of both worlds.
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            {reasons.map((reason, index) => (
                                <div key={index} className="flex gap-4">
                                    <div className="mt-1">
                                        <div className="p-2 rounded-lg bg-gold-50 text-gold-600">
                                            <reason.icon className="h-5 w-5" />
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="font-semibold mb-1 text-slate-900">{reason.title}</h3>
                                        <p className="text-sm text-slate-600">{reason.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="relative"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-gold-500/10 to-transparent rounded-2xl blur-3xl -z-10" />
                        <div className="rounded-2xl border border-slate-100 bg-white shadow-2xl p-8 md:p-12 text-center">
                            <div className="text-6xl font-bold text-slate-900 mb-2">500+</div>
                            <div className="text-xl text-gold-600 font-medium mb-8">Jewellers Trust Us</div>

                            <div className="grid grid-cols-2 gap-4 text-left">
                                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                                    <div className="text-2xl font-bold text-slate-900 mb-1">₹100Cr+</div>
                                    <div className="text-xs text-slate-500">Invoices Processed</div>
                                </div>
                                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                                    <div className="text-2xl font-bold text-slate-900 mb-1">99.9%</div>
                                    <div className="text-xs text-slate-500">Uptime Guarantee</div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
