'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { CheckCircle2, ArrowRight, FileText, Package, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LucideIcon } from 'lucide-react';

interface Feature {
    title: string;
    description: string;
    points: string[];
    icon: LucideIcon;
    align: 'left' | 'right';
}

const features: Feature[] = [
    {
        title: "Modern Invoicing Suite",
        description: "Create beautiful, professional invoices that build trust. Support for Gold, Silver, Diamond, and Stone calculations with automatic tax handling.",
        points: ["GST Compliant Formats", "WhatsApp Integration", "Custom Branding"],
        icon: FileText,
        align: "left"
    },
    {
        title: "Smart Inventory & Stock",
        description: "Track every gram of gold. Manage multiple purities, categories, and warehouses with barcode scanning support.",
        points: ["RFID & Barcode Ready", "Low Stock Alerts", "Dead Stock Analysis"],
        icon: Package,
        align: "right"
    },
    {
        title: "Customer Loyalty & CRM",
        description: "Turn walk-ins into customers for life. Track purchase history, birthdays, and anniversaries to send personalized offers.",
        points: ["Loyalty Points System", "Udhaar/Khata Management", "Automated SMS Wishes"],
        icon: Users,
        align: "left"
    }
];

export function Features() {
    const shouldReduceMotion = useReducedMotion();

    return (
        <section 
            id="features" 
            className="py-16 md:py-24 relative overflow-hidden bg-slate-50 scroll-mt-20"
            aria-labelledby="features-heading"
        >
            {/* Decorative Background */}
            <div 
                className="absolute top-0 right-0 w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-gold-500/5 rounded-full blur-[80px] md:blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none" 
                aria-hidden="true"
            />

            <div className="container px-4 md:px-6 mx-auto">
                {/* Section Header */}
                <header className="text-center max-w-3xl mx-auto mb-12 md:mb-16">
                    <h2 
                        id="features-heading"
                        className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-slate-900 font-heading mb-4"
                    >
                        Everything You Need to Run Your Business
                    </h2>
                    <p className="text-base md:text-lg text-slate-600">
                        Comprehensive tools designed specifically for modern jewellers
                    </p>
                </header>

                <div className="space-y-16 md:space-y-24 lg:space-y-32">
                    {features.map((feature, index) => (
                        <motion.article
                            key={feature.title}
                            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 40 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-100px" }}
                            transition={{ duration: 0.7 }}
                            className={`flex flex-col ${feature.align === 'right' ? 'lg:flex-row-reverse' : 'lg:flex-row'} items-center gap-8 md:gap-12 lg:gap-24 max-w-7xl mx-auto`}
                            aria-labelledby={`feature-${index}-title`}
                        >
                            {/* Text Content */}
                            <div className="flex-1 space-y-4 md:space-y-6 text-center lg:text-left">
                                <div 
                                    className="w-12 h-1 bg-gradient-to-r from-gold-500 to-transparent mx-auto lg:mx-0" 
                                    aria-hidden="true"
                                />
                                <h3 
                                    id={`feature-${index}-title`}
                                    className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-slate-900"
                                >
                                    {feature.title}
                                </h3>
                                <p className="text-base md:text-lg text-slate-600 leading-relaxed">
                                    {feature.description}
                                </p>
                                <ul 
                                    className="space-y-2 md:space-y-3 pt-2 md:pt-4"
                                    aria-label={`${feature.title} key features`}
                                >
                                    {feature.points.map((point) => (
                                        <li key={point} className="flex items-center gap-3 text-slate-700 justify-center lg:justify-start">
                                            <CheckCircle2 className="h-5 w-5 text-gold-600 flex-shrink-0" aria-hidden="true" />
                                            <span className="text-sm md:text-base">{point}</span>
                                        </li>
                                    ))}
                                </ul>
                                <Button 
                                    variant="link" 
                                    className="text-gold-600 hover:text-gold-700 p-0 h-auto font-semibold group min-h-[44px] focus-visible:ring-2 focus-visible:ring-gold-500 focus-visible:ring-offset-2"
                                    aria-label={`Learn more about ${feature.title}`}
                                >
                                    Learn more 
                                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                                </Button>
                            </div>

                            {/* Visual Content - Placeholder */}
                            <div className="flex-1 w-full max-w-lg lg:max-w-none">
                                <div 
                                    className="relative aspect-video rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-xl md:shadow-2xl group"
                                    role="img"
                                    aria-label={`${feature.title} interface preview`}
                                >
                                    <div 
                                        className="absolute inset-0 bg-gradient-to-br from-gold-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" 
                                        aria-hidden="true"
                                    />

                                    {/* Placeholder UI */}
                                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
                                        <div className="text-center p-6">
                                            <div className="w-14 h-14 md:w-16 md:h-16 mx-auto mb-4 rounded-full bg-white flex items-center justify-center shadow-lg border border-slate-100">
                                                <feature.icon className="w-6 h-6 md:w-8 md:h-8 text-gold-500" />
                                            </div>
                                            <p className="text-xs md:text-sm text-slate-400 font-medium">{feature.title}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.article>
                    ))}
                </div>
            </div>
        </section>
    );
}
