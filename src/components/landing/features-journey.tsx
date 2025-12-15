'use client';

import { motion } from 'framer-motion';
import {
    Gift,
    BookOpen,
    Users,
    ScanLine,
    Building2,
    TrendingUp,
    Zap,
    Bot,
    BarChart3,
    Sparkles,
    Rocket
} from 'lucide-react';
import { LucideIcon } from 'lucide-react';
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel';

interface Feature {
    icon: LucideIcon;
    title: string;
    tagline: string;
    description: string;
    gradient: string;
    iconColor: string;
    comingSoon?: boolean;
}

const features: Feature[] = [
    {
        icon: Gift,
        title: "Loyalty Points & Rewards",
        tagline: "Customer Retention, Simplified",
        description: "Build lasting relationships with automated loyalty programs. Reward repeat customers, track points, and boost retention effortlessly.",
        gradient: "from-pink-500 via-rose-500 to-red-500",
        iconColor: "text-pink-600"
    },
    {
        icon: BookOpen,
        title: "Khata Book",
        tagline: "Loan Tracker with Smart Reminders",
        description: "Manage customer loans, track payments, set automatic reminders, and maintain perfect financial records—digitally.",
        gradient: "from-blue-500 via-indigo-500 to-purple-500",
        iconColor: "text-blue-600"
    },
    {
        icon: Users,
        title: "Staff Management",
        tagline: "Salary, Attendance & Performance",
        description: "Track attendance, manage salaries, monitor performance, and empower your team with smart tools.",
        gradient: "from-green-500 via-emerald-500 to-teal-500",
        iconColor: "text-green-600"
    },
    {
        icon: ScanLine,
        title: "Invoice Scanner",
        tagline: "Paper → Digital → WhatsApp",
        description: "Scan paper invoices with your phone camera, convert to digital format instantly, and share via WhatsApp. Say goodbye to filing cabinets.",
        gradient: "from-orange-500 via-amber-500 to-yellow-500",
        iconColor: "text-orange-600"
    },
    {
        icon: Building2,
        title: "Multi-Shop Management",
        tagline: "One Dashboard, Multiple Locations",
        description: "Manage inventory, staff, and sales across all your locations from a single, unified dashboard.",
        gradient: "from-cyan-500 via-sky-500 to-blue-500",
        iconColor: "text-cyan-600"
    },
    {
        icon: TrendingUp,
        title: "Live Gold & Silver Rates",
        tagline: "Real-Time Precious Metal Pricing",
        description: "Always stay updated with live gold and silver rates. Auto-sync prices, set alerts, and make informed decisions.",
        gradient: "from-yellow-500 via-gold-500 to-amber-600",
        iconColor: "text-gold-600"
    },
    {
        icon: Zap,
        title: "Smart Billing",
        tagline: "GST-Compliant Invoicing",
        description: "Generate professional, GST-compliant invoices in seconds. Automatic calculations, beautiful designs, instant delivery.",
        gradient: "from-violet-500 via-purple-500 to-fuchsia-500",
        iconColor: "text-violet-600"
    },
    {
        icon: Bot,
        title: "AI Assistant",
        tagline: "Your Voice-Powered Partner",
        description: "Create invoices, check inventory, and manage tasks using simple voice commands. Your AI business partner is always ready.",
        gradient: "from-indigo-500 via-blue-500 to-cyan-500",
        iconColor: "text-indigo-600"
    },
    {
        icon: BarChart3,
        title: "Reports & Analytics",
        tagline: "Business Insights at a Glance",
        description: "Track sales trends, inventory turnover, customer behavior, and profitability with beautiful, actionable dashboards.",
        gradient: "from-emerald-500 via-green-500 to-lime-500",
        iconColor: "text-emerald-600"
    }
];

export function FeaturesJourney() {
    return (
        <section className="py-32 relative bg-gradient-to-b from-slate-50 via-white to-slate-50 overflow-hidden">
            {/* Animated Background Blobs */}
            <motion.div
                animate={{
                    scale: [1, 1.2, 1],
                    rotate: [0, 90, 180, 270, 360],
                    x: [0, 50, 0, -50, 0],
                    y: [0, -30, 0, 30, 0]
                }}
                transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-gold-200/30 to-amber-200/30 rounded-full blur-3xl"
            />
            <motion.div
                animate={{
                    scale: [1, 1.3, 1],
                    rotate: [360, 270, 180, 90, 0],
                    x: [0, -40, 0, 40, 0],
                    y: [0, 40, 0, -40, 0]
                }}
                transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-blue-200/30 to-purple-200/30 rounded-full blur-3xl"
            />

            <div className="container px-4 md:px-6 mx-auto relative z-10">
                {/* Section Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-20 max-w-4xl mx-auto"
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-gold-100/60 to-amber-100/60 border border-gold-200 text-gold-700 text-sm font-semibold mb-8"
                    >
                        <Sparkles className="h-4 w-4" />
                        <span>Complete Feature Suite</span>
                    </motion.div>

                    <h2 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 text-slate-900 font-heading leading-tight">
                        Everything Your Jewellery{' '}
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-gold-600 via-amber-500 to-gold-600 animate-shimmer bg-[length:200%_100%]">
                            Business Needs
                        </span>
                    </h2>
                    <p className="text-lg md:text-xl text-slate-600 leading-relaxed">
                        From customer loyalty to staff management, from paper invoices to AI assistance—
                        <br className="hidden md:block" />
                        we've built every feature you need to run a modern jewellery business.
                    </p>
                </motion.div>

                {/* Features Carousel - Mobile */}
                <div className="block md:hidden -mx-4 px-4">
                    <Carousel opts={{ align: "start", loop: false }} className="w-full">
                        <CarouselContent className="-ml-4">
                            {features.map((feature, index) => (
                                <CarouselItem key={index} className="pl-4 basis-[85%] h-full">
                                    <div className="h-full">
                                        <FeatureCard feature={feature} index={index} />
                                    </div>
                                </CarouselItem>
                            ))}
                        </CarouselContent>
                    </Carousel>
                </div>

                {/* Features Grid - Desktop */}
                <div className="hidden md:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
                    {features.map((feature, index) => (
                        <FeatureCard key={index} feature={feature} index={index} />
                    ))}
                </div>

                {/* Bottom CTA */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.5 }}
                    className="text-center mt-20"
                >
                    <p className="text-slate-600 mb-6 text-lg">
                        Ready to experience the future of jewellery business management?
                    </p>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="inline-flex items-center gap-3 px-8 py-4 rounded-full bg-gradient-to-r from-gold-500 to-amber-500 text-white font-bold text-lg shadow-xl hover:shadow-2xl transition-all"
                    >
                        <Sparkles className="h-5 w-5" />
                        <span>Join the Waitlist</span>
                    </motion.button>
                </motion.div>
            </div>
        </section>
    );
}

interface FeatureCardProps {
    feature: Feature;
    index: number;
}

function FeatureCard({ feature, index }: FeatureCardProps) {
    const Icon = feature.icon;

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            whileHover={{
                y: -12,
                scale: 1.02,
                rotateX: 5,
                rotateY: 5
            }}
            className="relative group perspective-1000 h-full"
        >
            <div className="relative p-8 rounded-3xl bg-white border-2 border-slate-100 shadow-lg hover:shadow-2xl transition-all duration-300 h-full overflow-hidden">
                {/* Gradient Background on Hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />


                {/* Icon Container */}
                <motion.div
                    whileHover={{ rotate: [0, -10, 10, -10, 0], scale: 1.1 }}
                    transition={{ duration: 0.5 }}
                    className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-6 shadow-lg group-hover:shadow-xl transition-shadow`}
                >
                    <Icon className="h-8 w-8 text-white" />
                </motion.div>

                {/* Content */}
                <h3 className="text-2xl font-bold text-slate-900 mb-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-slate-900 group-hover:to-slate-700 transition-all">
                    {feature.title}
                </h3>

                <p className={`text-sm font-semibold mb-3 ${feature.iconColor}`}>
                    {feature.tagline}
                </p>

                <p className="text-slate-600 leading-relaxed">
                    {feature.description}
                </p>

                {/* Hover Indicator */}
                <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: '40px' }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 + 0.3, duration: 0.4 }}
                    className={`h-1 bg-gradient-to-r ${feature.gradient} rounded-full mt-6 group-hover:w-full transition-all duration-500`}
                />

                {/* Sparkle Effect on Hover */}
                <motion.div
                    className="absolute top-8 right-8 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                >
                    <Sparkles className={`h-6 w-6 ${feature.iconColor}`} />
                </motion.div>
            </div>
        </motion.div>
    );
}
