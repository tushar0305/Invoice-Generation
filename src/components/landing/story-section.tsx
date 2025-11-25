'use client';

import { motion } from 'framer-motion';
import { Sun, Users, Receipt, Moon } from 'lucide-react';

const timeline = [
    {
        time: "09:00 AM",
        icon: Sun,
        title: "Morning Setup",
        desc: "Auto-sync live gold rates. Your digital signboard updates instantly.",
        color: "text-orange-500",
        bg: "bg-orange-50"
    },
    {
        time: "11:30 AM",
        icon: Users,
        title: "Customer Rush",
        desc: "Handle walk-ins smoothly. Check stock on your tablet while showing designs.",
        color: "text-blue-500",
        bg: "bg-blue-50"
    },
    {
        time: "04:00 PM",
        icon: Receipt,
        title: "Billing & Udhaar",
        desc: "Create GST invoices in seconds. Send payment reminders to customers via WhatsApp.",
        color: "text-green-500",
        bg: "bg-green-50"
    },
    {
        time: "08:30 PM",
        icon: Moon,
        title: "Closing Shop",
        desc: "One-click day end report. Tally cash, stock, and sales automatically.",
        color: "text-indigo-500",
        bg: "bg-indigo-50"
    }
];

export function StorySection() {
    return (
        <section className="py-24 bg-white relative">
            <div className="container px-4 md:px-6 mx-auto">
                <div className="text-center mb-16 max-w-3xl mx-auto">
                    <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4 text-slate-900 font-heading">
                        A Day in Your Life with SwarnaVyapar
                    </h2>
                    <p className="text-lg text-slate-600">
                        From opening shutter to closing accounts, we're with you every step.
                    </p>
                </div>

                <div className="relative max-w-4xl mx-auto">
                    {/* Vertical Line */}
                    <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-slate-100 -translate-x-1/2 hidden md:block" />

                    <div className="space-y-12 md:space-y-24">
                        {timeline.map((item, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: "-100px" }}
                                transition={{ duration: 0.5 }}
                                className={`flex flex-col md:flex-row items-center gap-8 ${index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'
                                    }`}
                            >
                                {/* Time & Icon (Center) */}
                                <div className="absolute left-1/2 -translate-x-1/2 hidden md:flex flex-col items-center gap-2 z-10">
                                    <div className={`w-12 h-12 rounded-full ${item.bg} ${item.color} flex items-center justify-center border-4 border-white shadow-sm`}>
                                        <item.icon className="h-5 w-5" />
                                    </div>
                                    <span className="text-xs font-bold text-slate-400 bg-white px-2 py-0.5 rounded-full border border-slate-100">
                                        {item.time}
                                    </span>
                                </div>

                                {/* Content Card */}
                                <div className={`flex-1 w-full md:w-auto ${index % 2 === 0 ? 'md:text-right' : 'md:text-left'} text-center`}>
                                    <div className={`p-6 rounded-2xl border border-slate-100 bg-white shadow-sm hover:shadow-md transition-shadow ${index % 2 === 0 ? 'md:mr-12' : 'md:ml-12'
                                        }`}>
                                        <div className="md:hidden flex items-center justify-center gap-2 mb-3 text-slate-500">
                                            <item.icon className={`h-4 w-4 ${item.color}`} />
                                            <span className="text-sm font-medium">{item.time}</span>
                                        </div>
                                        <h3 className="text-xl font-bold text-slate-900 mb-2">{item.title}</h3>
                                        <p className="text-slate-600">{item.desc}</p>
                                    </div>
                                </div>

                                {/* Spacer for opposite side */}
                                <div className="flex-1 hidden md:block" />
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
