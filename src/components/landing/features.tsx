'use client';

import { motion } from 'framer-motion';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';

const features = [
    {
        title: "Modern Invoicing Suite",
        description: "Create beautiful, professional invoices that build trust. Support for Gold, Silver, Diamond, and Stone calculations with automatic tax handling.",
        points: ["GST Compliant Formats", "WhatsApp Integration", "Custom Branding"],
        image: "/dashboard-preview.png", // Placeholder
        align: "left"
    },
    {
        title: "Smart Inventory & Stock",
        description: "Track every gram of gold. Manage multiple purities, categories, and warehouses with barcode scanning support.",
        points: ["RFID & Barcode Ready", "Low Stock Alerts", "Dead Stock Analysis"],
        image: "/inventory-preview.png", // Placeholder
        align: "right"
    },
    {
        title: "Customer Loyalty & CRM",
        description: "Turn walk-ins into customers for life. Track purchase history, birthdays, and anniversaries to send personalized offers.",
        points: ["Loyalty Points System", "Udhaar/Khata Management", "Automated SMS Wishes"],
        image: "/crm-preview.png", // Placeholder
        align: "left"
    }
];

export function Features() {
    return (
        <section id="features" className="py-24 relative overflow-hidden bg-slate-50">
            {/* Decorative Mandala Effect (CSS only for performance) */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gold-500/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />

            <div className="container px-4 md:px-6 space-y-32 mx-auto">
                {features.map((feature, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{ duration: 0.7 }}
                        className={`flex flex-col ${feature.align === 'right' ? 'lg:flex-row-reverse' : 'lg:flex-row'} items-center gap-12 lg:gap-24 max-w-7xl mx-auto`}
                    >
                        {/* Text Content */}
                        <div className="flex-1 space-y-6">
                            <div className="w-12 h-1 bg-gradient-to-r from-gold-500 to-transparent" />
                            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900">
                                {feature.title}
                            </h2>
                            <p className="text-lg text-slate-600 leading-relaxed">
                                {feature.description}
                            </p>
                            <ul className="space-y-3 pt-4">
                                {feature.points.map((point, i) => (
                                    <li key={i} className="flex items-center gap-3 text-slate-700">
                                        <CheckCircle2 className="h-5 w-5 text-gold-600 flex-shrink-0" />
                                        <span>{point}</span>
                                    </li>
                                ))}
                            </ul>
                            <Button variant="link" className="text-gold-600 hover:text-gold-700 p-0 h-auto font-semibold group">
                                Learn more <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                            </Button>
                        </div>

                        {/* Visual Content */}
                        <div className="flex-1 w-full">
                            <div className="relative aspect-video rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-2xl group">
                                <div className="absolute inset-0 bg-gradient-to-br from-gold-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                                {/* Abstract UI Representation since we don't have real screenshots yet */}
                                <div className="absolute inset-0 flex items-center justify-center bg-slate-50">
                                    <div className="text-center p-6">
                                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white flex items-center justify-center shadow-lg border border-slate-100">
                                            <div className="w-8 h-8 rounded bg-gold-100" />
                                        </div>
                                        <p className="text-sm text-slate-400 font-medium">High Fidelity UI Preview</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </section>
    );
}
