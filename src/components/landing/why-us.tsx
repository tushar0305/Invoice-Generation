'use client';

import { motion } from 'framer-motion';
import { WifiOff, Shield, Users, Clock, Rocket, Star, Award, TrendingUp } from 'lucide-react';

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
                className="absolute -top-40 -left-40 w-96 h-96 bg-gradient-to-br from-gold-200/20 to-transparent rounded-full blur-3xl"
            />
            <motion.div
                animate={{
                    rotate: [360, 0],
                    scale: [1, 1.2, 1]
                }}
                transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                className="absolute -bottom-40 -right-40 w-96 h-96 bg-gradient-to-br from-blue-200/20 to-transparent rounded-full blur-3xl"
            />

            <div className="container px-4 md:px-6 mx-auto relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center max-w-7xl mx-auto">
                    {/* Left Column - Content */}
                    <motion.div
                        initial={{ opacity: 0, x: -40 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                    >
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
                        <p className="text-lg md:text-xl text-slate-600 mb-10 leading-relaxed">
                            We're not just another software. We're combining traditional jewellery business wisdom with cutting-edge AI technology to revolutionize how you work.
                        </p>

                        {/* Features Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            {reasons.map((reason, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: index * 0.1 }}
                                    whileHover={{ scale: 1.05 }}
                                    className="group flex gap-4 p-4 rounded-2xl border border-slate-100 bg-white hover:shadow-xl transition-all duration-300 cursor-pointer"
                                >
                                    <div className="shrink-0">
                                        <div className={`p-3 rounded-xl ${reason.iconBg} ${reason.iconColor} group-hover:scale-110 transition-transform duration-300`}>
                                            <reason.icon className="h-6 w-6" />
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="font-bold mb-1.5 text-slate-900 group-hover:text-gold-600 transition-colors">
                                            {reason.title}
                                        </h3>
                                        <p className="text-sm text-slate-600 leading-relaxed">
                                            {reason.description}
                                        </p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Right Column - Stats Card */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                        className="relative"
                    >
                        {/* Glow effect */}
                        <div className="absolute inset-0 bg-gradient-to-br from-gold-400/20 via-amber-400/20 to-transparent rounded-3xl blur-3xl -z-10" />

                        <div className="rounded-3xl border-2 border-slate-200 bg-white shadow-2xl p-10 md:p-12 text-center relative overflow-hidden">
                            {/* Background pattern */}
                            <div className="absolute inset-0 bg-gradient-to-br from-gold-50/50 to-transparent" />

                            <div className="relative z-10">
                                {/* Main Badge */}
                                <motion.div
                                    animate={{ rotate: [0, 5, -5, 0] }}
                                    transition={{ duration: 3, repeat: Infinity }}
                                    className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-gradient-to-r from-gold-500 to-amber-500 text-white font-bold text-lg shadow-xl mb-8"
                                >
                                    <Rocket className="h-6 w-6" />
                                    <span>Launching Soon</span>
                                </motion.div>

                                <div className="mb-8">
                                    <div className="text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-gold-600 to-slate-900 mb-2">
                                        ✨
                                    </div>
                                    <div className="text-xl text-slate-700 font-medium">
                                        Be Among the First
                                    </div>
                                </div>

                                {/* Promise Cards */}
                                <div className="grid grid-cols-2 gap-4">
                                    <motion.div
                                        whileHover={{ y: -4 }}
                                        className="p-5 rounded-2xl bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-100 shadow-lg"
                                    >
                                        <Award className="h-8 w-8 text-blue-600 mb-2 mx-auto" />
                                        <div className="text-3xl font-bold text-slate-900 mb-1">100%</div>
                                        <div className="text-xs text-slate-600 font-medium">Free Trial</div>
                                    </motion.div>
                                    <motion.div
                                        whileHover={{ y: -4 }}
                                        className="p-5 rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-100 shadow-lg"
                                    >
                                        <TrendingUp className="h-8 w-8 text-green-600 mb-2 mx-auto" />
                                        <div className="text-3xl font-bold text-slate-900 mb-1">99.9%</div>
                                        <div className="text-xs text-slate-600 font-medium">Uptime</div>
                                    </motion.div>
                                </div>

                                {/* Early Access CTA */}
                                <motion.div
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="mt-8 px-6 py-3 rounded-full bg-gradient-to-r from-slate-900 to-slate-700 text-white font-semibold shadow-xl cursor-pointer"
                                >
                                    Get Early Access
                                </motion.div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
