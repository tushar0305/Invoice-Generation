'use client';

import { motion } from 'framer-motion';
import { Sun, Users, Receipt, Moon, Sparkles, Zap } from 'lucide-react';

const timeline = [
    {
        time: "09:00 AM",
        icon: Sun,
        title: "Smart Morning Setup",
        desc: "Start your day with auto-synced live gold rates. Your digital signboard updates instantly while you sip chai.",
        color: "from-orange-500 to-amber-500",
        iconColor: "text-orange-600",
        bg: "bg-gradient-to-br from-orange-50 to-amber-50"
    },
    {
        time: "11:30 AM",
        icon: Users,
        title: "Effortless Customer Service",
        desc: "Handle peak hours like a pro. Check stock on tablet, create quotations instantly, and wow every customer.",
        color: "from-blue-500 to-cyan-500",
        iconColor: "text-blue-600",
        bg: "bg-gradient-to-br from-blue-50 to-cyan-50"
    },
    {
        time: "04:00 PM",
        icon: Receipt,
        title: "Lightning-Fast Billing",
        desc: "Generate GST-compliant invoices in seconds with voice commands. Send payment reminders via WhatsApp automatically.",
        color: "from-green-500 to-emerald-500",
        iconColor: "text-green-600",
        bg: "bg-gradient-to-br from-green-50 to-emerald-50"
    },
    {
        time: "08:30 PM",
        icon: Moon,
        title: "One-Click Day End",
        desc: "Relax knowing everything's tallied automatically. Cash, stock, sales—all in one beautiful report.",
        color: "from-indigo-500 to-purple-500",
        iconColor: "text-indigo-600",
        bg: "bg-gradient-to-br from-indigo-50 to-purple-50"
    }
];

export function StorySection() {
    return (
        <section className="py-32 bg-gradient-to-b from-white via-slate-50 to-white relative overflow-hidden">
            {/* Background Decorations */}
            <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-[0.02]" />
            <motion.div
                animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.1, 0.15, 0.1]
                }}
                transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-20 right-10 w-96 h-96 bg-gradient-to-br from-gold-200/30 to-transparent rounded-full blur-3xl"
            />
            <motion.div
                animate={{
                    scale: [1, 1.1, 1],
                    opacity: [0.1, 0.2, 0.1]
                }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute bottom-20 left-10 w-96 h-96 bg-gradient-to-br from-blue-200/30 to-transparent rounded-full blur-3xl"
            />

            <div className="container px-4 md:px-6 mx-auto relative z-10">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-20 max-w-3xl mx-auto"
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-gold-100/50 to-amber-100/50 border border-gold-200/50 text-gold-700 text-sm font-semibold mb-6"
                    >
                        <Sparkles className="h-4 w-4" />
                        <span>Imagine Your Perfect Day</span>
                    </motion.div>

                    <h2 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 text-slate-900 font-heading">
                        A Day in Your Life{' '}
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-gold-600 via-amber-500 to-gold-600 animate-shimmer bg-[length:200%_100%]">
                            with SwarnaVyapar
                        </span>
                    </h2>
                    <p className="text-lg md:text-xl text-slate-600 leading-relaxed">
                        Soon, every moment of your business will flow effortlessly. From sunrise to sunset, experience jewellery management reimagined.
                    </p>
                </motion.div>

                {/* Timeline */}
                <div className="relative max-w-5xl mx-auto">
                    {/* Vertical Gradient Line */}
                    <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-gold-200 via-blue-200 to-indigo-200 -translate-x-1/2 hidden md:block rounded-full" />

                    <div className="space-y-16 md:space-y-24">
                        {timeline.map((item, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 40 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: "-80px" }}
                                transition={{ duration: 0.6, delay: index * 0.1 }}
                                className={`flex flex-col md:flex-row items-center gap-8 ${index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'
                                    }`}
                            >
                                {/* Time & Icon (Center) */}
                                <motion.div
                                    whileHover={{ scale: 1.1, rotate: 360 }}
                                    transition={{ duration: 0.6 }}
                                    className="absolute left-1/2 -translate-x-1/2 hidden md:flex flex-col items-center gap-3 z-10"
                                >
                                    <div className={`w-16 h-16 rounded-2xl ${item.bg} ${item.iconColor} flex items-center justify-center border-4 border-white shadow-xl backdrop-blur-sm`}>
                                        <item.icon className="h-7 w-7" />
                                    </div>
                                    <span className="text-sm font-bold text-white bg-gradient-to-r ${item.color} px-4 py-1.5 rounded-full shadow-lg">
                                        {item.time}
                                    </span>
                                </motion.div>

                                {/* Content Card */}
                                <motion.div
                                    whileHover={{ scale: 1.02, y: -4 }}
                                    transition={{ duration: 0.3 }}
                                    className={`flex-1 w-full md:w-auto ${index % 2 === 0 ? 'md:text-right md:pr-16' : 'md:text-left md:pl-16'
                                        } text-center`}
                                >
                                    <div className={`group p-8 rounded-3xl border-2 border-slate-100 bg-white shadow-lg hover:shadow-2xl transition-all duration-300 relative overflow-hidden`}>
                                        {/* Hover gradient effect */}
                                        <div className={`absolute inset-0 bg-gradient-to-br ${item.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />

                                        {/* Mobile time badge */}
                                        <div className="md:hidden flex items-center justify-center gap-2 mb-4">
                                            <div className={`p-2 rounded-xl ${item.bg}`}>
                                                <item.icon className={`h-5 w-5 ${item.iconColor}`} />
                                            </div>
                                            <span className={`text-sm font-bold bg-gradient-to-r ${item.color} bg-clip-text text-transparent`}>
                                                {item.time}
                                            </span>
                                        </div>

                                        <h3 className="text-2xl font-bold text-slate-900 mb-3 group-hover:text-gold-600 transition-colors">
                                            {item.title}
                                        </h3>
                                        <p className="text-slate-600 leading-relaxed text-base">
                                            {item.desc}
                                        </p>
                                    </div>
                                </motion.div>

                                {/* Spacer for opposite side */}
                                <div className="flex-1 hidden md:block" />
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Coming Soon Badge */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.4 }}
                    className="text-center mt-20"
                >
                    <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-gradient-to-r from-gold-50 to-amber-50 border-2 border-gold-200 shadow-lg">
                        <Zap className="h-5 w-5 text-gold-600" />
                        <span className="font-bold text-slate-900">Launching Soon</span>
                        <span className="px-3 py-1 rounded-full bg-gold-600 text-white text-sm font-semibold">
                            Be Among the First
                        </span>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
