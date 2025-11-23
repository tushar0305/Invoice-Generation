'use client';

import { MotionWrapper } from '@/components/ui/motion-wrapper';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, TrendingUp, Bell, Calendar, Percent, MessageSquare, ArrowRight, Sparkles, Shield, Zap } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

export default function KhataBookPage() {
    const router = useRouter();

    const features = [
        {
            icon: BookOpen,
            title: "Smart Credit Tracking",
            description: "Real-time customer credit balance monitoring with automated updates",
            color: "emerald",
            gradient: "from-emerald-500 to-teal-500",
        },
        {
            icon: Calendar,
            title: "Flexible EMI Plans",
            description: "Create custom installment schemes with auto-payment tracking",
            color: "blue",
            gradient: "from-blue-500 to-cyan-500",
        },
        {
            icon: Bell,
            title: "Auto Reminders",
            description: "WhatsApp reminders sent at 3, 7, and 15 days automatically",
            color: "amber",
            gradient: "from-amber-500 to-orange-500",
        },
        {
            icon: Percent,
            title: "Interest Calculator",
            description: "Auto-compounding interest on overdue amounts with grace periods",
            color: "purple",
            gradient: "from-purple-500 to-pink-500",
        },
        {
            icon: TrendingUp,
            title: "Payment History",
            description: "Complete timeline view with receipt PDFs and method tracking",
            color: "indigo",
            gradient: "from-indigo-500 to-blue-500",
        },
        {
            icon: MessageSquare,
            title: "Gold Schemes",
            description: "Manage 10/12-month gold savings with maturity alerts",
            color: "rose",
            gradient: "from-rose-500 to-pink-500",
        },
    ];

    return (
        <div className="min-h-screen pb-24">
            {/* Hero Section */}
            <div className="relative overflow-hidden">
                {/* Gradient Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-background to-teal-500/10"></div>

                {/* Animated Orbs */}
                <div className="absolute top-20 left-10 w-72 h-72 bg-emerald-500/20 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-20 right-10 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>

                <MotionWrapper className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-16 md:py-24">
                    <div className="text-center space-y-6 mb-16">
                        {/* Badge */}
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 backdrop-blur-sm">
                            <Sparkles className="h-4 w-4 text-emerald-500" />
                            <span className="text-emerald-500 font-semibold text-sm">Coming Soon</span>
                        </div>

                        {/* Title */}
                        <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500">
                            Digital Khata Book
                        </h1>

                        {/* Subtitle */}
                        <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                            Never lose track of credit again. Recover <span className="text-emerald-500 font-bold">₹2-5L annually</span> with smart automation.
                        </p>

                        {/* Stats */}
                        <div className="flex flex-wrap items-center justify-center gap-8 pt-4">
                            <div className="text-center">
                                <div className="text-4xl font-bold text-emerald-500">70%</div>
                                <div className="text-sm text-muted-foreground">Credit Transactions</div>
                            </div>
                            <div className="h-12 w-px bg-white/10"></div>
                            <div className="text-center">
                                <div className="text-4xl font-bold text-emerald-500">90%</div>
                                <div className="text-sm text-muted-foreground">Time Saved</div>
                            </div>
                            <div className="h-12 w-px bg-white/10"></div>
                            <div className="text-center">
                                <div className="text-4xl font-bold text-emerald-500">₹5L+</div>
                                <div className="text-sm text-muted-foreground">Recovered</div>
                            </div>
                        </div>
                    </div>
                </MotionWrapper>
            </div>

            {/* Features Grid */}
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {features.map((feature, index) => (
                        <MotionWrapper key={feature.title}>
                            <Card className={cn(
                                "group relative overflow-hidden border-white/10 bg-background/50 backdrop-blur-xl",
                                "hover:border-white/20 transition-all duration-500 hover:scale-105 hover:shadow-2xl",
                                "hover:shadow-emerald-500/20"
                            )}>
                                {/* Gradient Overlay on Hover */}
                                <div className={cn(
                                    "absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-500",
                                    `bg-gradient-to-br ${feature.gradient}`
                                )}></div>

                                <div className="relative z-10 p-6 space-y-4">
                                    {/* Icon */}
                                    <div className={cn(
                                        "h-14 w-14 rounded-2xl bg-gradient-to-br flex items-center justify-center",
                                        feature.gradient,
                                        "group-hover:scale-110 transition-transform duration-500"
                                    )}>
                                        <feature.icon className="h-7 w-7 text-white" />
                                    </div>

                                    {/* Content */}
                                    <div className="space-y-2">
                                        <h3 className="text-lg font-bold text-foreground group-hover:text-emerald-400 transition-colors duration-300">
                                            {feature.title}
                                        </h3>
                                        <p className="text-sm text-muted-foreground leading-relaxed">
                                            {feature.description}
                                        </p>
                                    </div>

                                    {/* Arrow */}
                                    <div className="flex items-center text-emerald-500 opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:translate-x-1">
                                        <span className="text-sm font-medium">Learn more</span>
                                        <ArrowRight className="h-4 w-4 ml-1" />
                                    </div>
                                </div>
                            </Card>
                        </MotionWrapper>
                    ))}
                </div>
            </div>

            {/* How It Works Section */}
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
                <div className="text-center mb-12">
                    <h2 className="text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-emerald-500 to-teal-500">
                        How It Works
                    </h2>
                    <p className="text-muted-foreground text-lg">Three simple steps to transform your credit management</p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {[
                        { step: "01", title: "Track Credit", icon: Shield, desc: "Every transaction automatically updates customer balance" },
                        { step: "02", title: "Set Reminders", icon: Zap, desc: "Smart WhatsApp alerts sent at the right time" },
                        { step: "03", title: "Collect Payments", icon: TrendingUp, desc: "Improved recovery with automated follow-ups" },
                    ].map((item, index) => (
                        <div key={item.step} className="relative">
                            <Card className="p-8 text-center border-white/10 bg-background/50 backdrop-blur-xl hover:border-emerald-500/30 transition-all duration-300">
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 h-8 w-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white font-bold text-sm">
                                    {item.step}
                                </div>
                                <div className="mb-4 flex justify-center">
                                    <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 flex items-center justify-center">
                                        <item.icon className="h-8 w-8 text-emerald-500" />
                                    </div>
                                </div>
                                <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                                <p className="text-muted-foreground text-sm">{item.desc}</p>
                            </Card>
                            {index < 2 && (
                                <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-px bg-gradient-to-r from-emerald-500/50 to-transparent"></div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* CTA Section */}
            <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16">
                <Card className="relative overflow-hidden border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 backdrop-blur-xl">
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjA1IiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-40"></div>
                    <div className="relative z-10 p-8 md:p-12 text-center space-y-6">
                        <Sparkles className="h-12 w-12 text-emerald-500 mx-auto" />
                        <h2 className="text-3xl md:text-4xl font-bold">Ready to Transform Your Business?</h2>
                        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                            Join the waitlist to be the first to experience smart credit management
                        </p>
                        <Button size="lg" className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white px-8">
                            Join Waitlist
                            <ArrowRight className="ml-2 h-5 w-5" />
                        </Button>
                    </div>
                </Card>
            </div>
        </div>
    );
}
