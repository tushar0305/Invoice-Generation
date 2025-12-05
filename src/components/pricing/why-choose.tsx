'use client';

import { ShieldCheck, Zap, Users, IndianRupee, WifiOff, Award } from 'lucide-react';

const benefits = [
    {
        icon: IndianRupee,
        title: "Designed for India",
        description: "Built specifically for Indian jewellery standards (Hallmarking, HUID) and GST compliance."
    },
    {
        icon: WifiOff,
        title: "Works Offline",
        description: "Internet cuts won't stop your business. Continue billing and sync when online."
    },
    {
        icon: Zap,
        title: "Fast & Reliable",
        description: "Lightning fast performance optimized for Tier 2 & Tier 3 business needs."
    },
    {
        icon: ShieldCheck,
        title: "Reduce Errors",
        description: "Automated calculations prevent manual mistakes and potential fraud."
    },
    {
        icon: Users,
        title: "Staff Efficiency",
        description: "Saves 2–3 hours of staff time daily with automated reporting and stock tracking."
    },
    {
        icon: Award,
        title: "Trusted Brand",
        description: "Join hundreds of jewellers across India who trust SwarnaVyapar for their growth."
    }
];

export function WhyChoose() {
    return (
        <section className="py-24 bg-white">
            <div className="container px-4 md:px-6 mx-auto">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900 mb-4 font-heading">
                        Why Choose SwarnaVyapar?
                    </h2>
                    <p className="text-lg text-slate-600">
                        More than just software, we're your partner in success.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12">
                    {benefits.map((benefit, index) => (
                        <div key={index} className="flex gap-4 items-start">
                            <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gold-50 flex items-center justify-center text-gold-600">
                                <benefit.icon className="h-6 w-6" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-slate-900 mb-2">{benefit.title}</h3>
                                <p className="text-slate-600 leading-relaxed">
                                    {benefit.description}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Guarantee Section */}
                <div className="mt-20 max-w-4xl mx-auto bg-slate-900 rounded-3xl p-8 md:p-12 text-center text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-gold-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>

                    <div className="relative z-10">
                        <ShieldCheck className="h-12 w-12 text-gold-400 mx-auto mb-6" />
                        <h3 className="text-2xl md:text-3xl font-bold mb-4">100% Satisfaction Guarantee</h3>
                        <p className="text-lg text-slate-300 mb-8 max-w-2xl mx-auto">
                            If you don't find value within 14 days, you don't pay. We are confident SwarnaVyapar will transform your business.
                        </p>
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800 border border-slate-700 text-sm font-medium text-slate-300">
                            <ShieldCheck className="h-4 w-4 text-emerald-400" />
                            Zero Risk. Full Confidence.
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
