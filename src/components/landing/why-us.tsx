'use client';

import { motion } from 'framer-motion';
import { WifiOff, Shield, Users, Clock, Star } from 'lucide-react';

const reasons = [
    {
        icon: WifiOff,
        title: "Works Offline",
        description: "Internet down? No problem. Continue billing seamlessly and sync automatically when online.",
        color: "from-blue-500 to-cyan-500",
        iconBg: "bg-gradient-to-br from-blue-50 to-cyan-50",
        iconColor: "text-blue-600"
    },
    {
        icon: Shield,
        title: "Bank-Grade Security",
        description: "Your business data is yours alone. Military-grade encryption keeps everything completely secure.",
        color: "from-green-500 to-emerald-500",
        iconBg: "bg-gradient-to-br from-green-50 to-emerald-50",
        iconColor: "text-green-600"
    },
    {
        icon: Users,
        title: "Smart Multi-User",
        description: "Granular permissions for owners, managers, and staff—everyone gets exactly what they need.",
        color: "from-purple-500 to-pink-500",
        iconBg: "bg-gradient-to-br from-purple-50 to-pink-50",
        iconColor: "text-purple-600"
    },
    {
        icon: Clock,
        title: "Premium Support",
        description: "Dedicated support team ready to assist you at every step of your journey with us.",
        color: "from-amber-500 to-orange-500",
        iconBg: "bg-gradient-to-br from-amber-50 to-orange-50",
        iconColor: "text-amber-600"
    }
];

export function WhyUs() {
    return (
        <section className="py-32 relative bg-gradient-to-b from-slate-50 via-white to-slate-50 overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-[0.02]" />
            <motion.div
                animate={{
                    rotate: [0, 360],
                    scale: [1, 1.1, 1]
                }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute -top-40 -left-40 w-96 h-96 bg-gradient-to-br from-gold-200/20 to-transparent rounded-full blur-3xl opacity-50"
            />
            <motion.div
                animate={{
                    rotate: [360, 0],
                    scale: [1, 1.2, 1]
                }}
                transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                className="absolute -bottom-40 -right-40 w-96 h-96 bg-gradient-to-br from-blue-200/20 to-transparent rounded-full blur-3xl opacity-50"
            />

            <div className="container px-4 md:px-6 mx-auto relative z-10">
                <div className="max-w-4xl mx-auto text-center mb-16">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-gold-100/60 to-amber-100/60 border border-gold-200 text-gold-700 text-sm font-semibold mb-8"
                    >
                        <Star className="h-4 w-4 fill-gold-600" />
                        <span>Premium Features</span>
                    </motion.div>

                    <h2 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 text-slate-900 font-heading leading-tight">
                        Why Choose{' '}
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-gold-600 via-amber-500 to-gold-600 animate-shimmer bg-[length:200%_100%]">
                            SwarnaVyapar?
                        </span>
                    </h2>
                    <p className="text-lg md:text-xl text-slate-600 leading-relaxed max-w-2xl mx-auto">
                        We're not just another software. We're combining traditional jewellery business wisdom with cutting-edge AI technology to revolutionize how you work.
                    </p>
                </div>

                {/* Features Grid - Centered */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
                    {reasons.map((reason, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            whileHover={{ scale: 1.05 }}
                            className="group flex flex-col items-center text-center p-6 rounded-3xl border border-slate-100 bg-white hover:shadow-xl transition-all duration-300 cursor-pointer h-full"
                        >
                            <div className={`p-4 rounded-2xl mb-6 ${reason.iconBg} ${reason.iconColor} group-hover:scale-110 transition-transform duration-300`}>
                                <reason.icon className="h-8 w-8" />
                            </div>
                            <h3 className="text-xl font-bold mb-3 text-slate-900 group-hover:text-gold-600 transition-colors">
                                {reason.title}
                            </h3>
                            <p className="text-slate-600 leading-relaxed text-sm">
                                {reason.description}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
