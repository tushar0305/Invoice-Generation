'use client';

import { MotionWrapper } from '@/components/ui/motion-wrapper';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Megaphone, Mail, MessageSquare, Smartphone, Target, BarChart3, Zap, Users, Calendar } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

export default function MarketingPage() {
    const router = useRouter();

    const channels = [
        {
            name: "WhatsApp Marketing",
            icon: MessageSquare,
            color: "emerald",
            gradient: "from-emerald-400 to-green-500",
            features: ["Automated Reminders", "Product Catalogs", "Order Updates"],
            status: "Coming Soon"
        },
        {
            name: "SMS Campaigns",
            icon: Smartphone,
            color: "blue",
            gradient: "from-blue-400 to-indigo-500",
            features: ["Bulk Offers", "Transactional Alerts", "Festival Greetings"],
            status: "Coming Soon"
        },
        {
            name: "Email Newsletters",
            icon: Mail,
            color: "rose",
            gradient: "from-rose-400 to-pink-500",
            features: ["Monthly Digests", "Exclusive Previews", "Brand Stories"],
            status: "Coming Soon"
        },
    ];

    const features = [
        {
            icon: Target,
            title: "Smart Targeting",
            description: "Segment customers based on purchase history, preferences, and location.",
            color: "purple",
            gradient: "from-purple-500 to-violet-500",
        },
        {
            icon: Calendar,
            title: "Campaign Scheduler",
            description: "Plan your marketing calendar in advance for festivals and events.",
            color: "amber",
            gradient: "from-amber-500 to-orange-500",
        },
        {
            icon: BarChart3,
            title: "ROI Analytics",
            description: "Track open rates, conversions, and revenue generated from each campaign.",
            color: "cyan",
            gradient: "from-cyan-500 to-blue-500",
        },
    ];

    return (
        <div className="min-h-screen pb-24">
            {/* Hero Section */}
            <div className="relative overflow-hidden">
                {/* Gradient Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-background to-purple-500/10"></div>

                {/* Animated Orbs */}
                <div className="absolute top-20 right-10 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-20 left-10 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>

                <MotionWrapper className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-16 md:py-24">
                    <div className="text-center space-y-6 mb-16">
                        {/* Badge */}
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 backdrop-blur-sm">
                            <Megaphone className="h-4 w-4 text-blue-500" />
                            <span className="text-blue-500 font-semibold text-sm">Coming Soon</span>
                        </div>

                        {/* Title */}
                        <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 via-indigo-400 to-purple-500">
                            Smart Marketing
                        </h1>

                        {/* Subtitle */}
                        <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                            Reach the right customers at the right time. Boost sales with <span className="text-blue-500 font-bold">automated campaigns</span> and intelligent targeting.
                        </p>
                    </div>

                    {/* Channels Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
                        {channels.map((channel, index) => (
                            <Card key={index} className="relative overflow-hidden border-border/50 bg-background/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 group">
                                <div className={`absolute inset-0 bg-gradient-to-br ${channel.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
                                <div className="p-6 space-y-4">
                                    <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${channel.gradient} flex items-center justify-center text-white shadow-lg`}>
                                        <channel.icon className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold mb-1">{channel.name}</h3>
                                        <div className="flex flex-wrap gap-2 mt-3">
                                            {channel.features.map((feature, i) => (
                                                <span key={i} className="text-xs px-2 py-1 rounded-md bg-secondary/50 text-secondary-foreground">
                                                    {feature}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>

                    {/* Features Section */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {features.map((feature, index) => (
                            <div key={index} className="flex flex-col items-center text-center space-y-4 p-6 rounded-2xl bg-secondary/5 border border-border/50">
                                <div className={`h-12 w-12 rounded-full bg-gradient-to-br ${feature.gradient} flex items-center justify-center text-white`}>
                                    <feature.icon className="h-5 w-5" />
                                </div>
                                <h3 className="text-lg font-bold">{feature.title}</h3>
                                <p className="text-muted-foreground text-sm leading-relaxed">
                                    {feature.description}
                                </p>
                            </div>
                        ))}
                    </div>

                    {/* CTA */}
                    <div className="mt-20 text-center">
                        <div className="inline-flex flex-col items-center gap-4 p-8 rounded-3xl bg-gradient-to-br from-blue-500/5 via-indigo-500/5 to-purple-500/5 border border-blue-500/10">
                            <Zap className="h-8 w-8 text-blue-500 animate-bounce" />
                            <h3 className="text-2xl font-bold">Get Notified When We Launch</h3>
                            <p className="text-muted-foreground max-w-md">
                                Be the first to experience the future of jewellery retail marketing.
                            </p>
                            <Button size="lg" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/25 rounded-full px-8">
                                Join Waitlist
                            </Button>
                        </div>
                    </div>
                </MotionWrapper>
            </div>
        </div>
    );
}
