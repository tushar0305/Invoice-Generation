'use client';

import { MotionWrapper } from '@/components/ui/motion-wrapper';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Crown, Gift, TrendingUp, Star, Zap, Award, ArrowRight, Sparkles, Users, Heart } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

export default function LoyaltyProgramPage() {
    const router = useRouter();

    const tiers = [
        {
            name: "Silver",
            icon: Award,
            color: "slate",
            gradient: "from-slate-400 to-gray-500",
            benefits: ["2% Cashback", "Birthday Surprise", "Priority Support"],
            minSpend: "₹50,000",
        },
        {
            name: "Gold",
            icon: Star,
            color: "amber",
            gradient: "from-amber-400 to-yellow-500",
            benefits: ["5% Cashback", "Free Making Charges", "Exclusive Previews"],
            minSpend: "₹1,50,000",
            featured: true,
        },
        {
            name: "Platinum",
            icon: Crown,
            color: "purple",
            gradient: "from-purple-400 to-pink-500",
            benefits: ["10% Cashback", "Personal Shopper", "VIP Events"],
            minSpend: "₹5,00,000",
        },
    ];

    const features = [
        {
            icon: TrendingUp,
            title: "Earn Points",
            description: "Get 1 point per ₹100 spent on every purchase",
            color: "blue",
            gradient: "from-blue-500 to-cyan-500",
        },
        {
            icon: Crown,
            title: "Unlock Tiers",
            description: "Progress through Silver, Gold, and Platinum based on spending",
            color: "purple",
            gradient: "from-purple-500 to-pink-500",
        },
        {
            icon: Gift,
            title: "Redeem Rewards",
            description: "Exchange points for discounts, gifts, or exclusive offers",
            color: "emerald",
            gradient: "from-emerald-500 to-teal-500",
        },
    ];

    return (
        <div className="min-h-screen pb-24">
            {/* Hero Section */}
            <div className="relative overflow-hidden">
                {/* Gradient Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-background to-pink-500/10"></div>

                {/* Animated Orbs */}
                <div className="absolute top-20 right-10 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-20 left-10 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>

                <MotionWrapper className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-16 md:py-24">
                    <div className="text-center space-y-6 mb-16">
                        {/* Badge */}
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 backdrop-blur-sm">
                            <Crown className="h-4 w-4 text-purple-500" />
                            <span className="text-purple-500 font-semibold text-sm">Coming Soon</span>
                        </div>

                        {/* Title */}
                        <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-500 via-pink-400 to-rose-500">
                            Loyalty Program
                        </h1>

                        {/* Subtitle */}
                        <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                            Reward your best customers. Build <span className="text-purple-500 font-bold">lasting relationships</span> with automated loyalty tracking.
                        </p>

                        {/* Stats */}
                        <div className="flex flex-wrap items-center justify-center gap-8 pt-4">
                            <div className="text-center">
                                <div className="text-4xl font-bold text-purple-500">85%</div>
                                <div className="text-sm text-muted-foreground">Repeat Purchase</div>
                            </div>
                            <div className="h-12 w-px bg-white/10"></div>
                            <div className="text-center">
                                <div className="text-4xl font-bold text-purple-500">3x</div>
                                <div className="text-sm text-muted-foreground">Customer Value</div>
                            </div>
                            <div className="h-12 w-px bg-white/10"></div>
                            <div className="text-center">
                                <div className="text-4xl font-bold text-purple-500">60%</div>
                                <div className="text-sm text-muted-foreground">More Spending</div>
                            </div>
                        </div>
                    </div>
                </MotionWrapper>
            </div>

            {/* How It Works */}
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
                <div className="text-center mb-12">
                    <h2 className="text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-pink-500">
                        How It Works
                    </h2>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                    {features.map((feature) => (
                        <MotionWrapper key={feature.title}>
                            <Card className={cn(
                                "group relative overflow-hidden border-white/10 bg-background/50 backdrop-blur-xl",
                                "hover:border-white/20 transition-all duration-500 hover:scale-105 hover:shadow-2xl",
                                "hover:shadow-purple-500/20"
                            )}>
                                {/* Gradient Overlay */}
                                <div className={cn(
                                    "absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-500",
                                    `bg-gradient-to-br ${feature.gradient}`
                                )}></div>

                                <div className="relative z-10 p-8 text-center space-y-4">
                                    <div className={cn(
                                        "h-16 w-16 mx-auto rounded-2xl bg-gradient-to-br flex items-center justify-center",
                                        feature.gradient,
                                        "group-hover:scale-110 group-hover:rotate-6 transition-all duration-500"
                                    )}>
                                        <feature.icon className="h-8 w-8 text-white" />
                                    </div>
                                    <h3 className="text-xl font-bold">{feature.title}</h3>
                                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                                </div>
                            </Card>
                        </MotionWrapper>
                    ))}
                </div>
            </div>

            {/* Tier System */}
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
                <div className="text-center mb-12">
                    <h2 className="text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-pink-500">
                        Membership Tiers
                    </h2>
                    <p className="text-muted-foreground text-lg">Unlock exclusive benefits as you spend</p>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                    {tiers.map((tier) => (
                        <MotionWrapper key={tier.name}>
                            <Card className={cn(
                                "relative overflow-hidden border-white/10 bg-background/50 backdrop-blur-xl",
                                "hover:border-white/20 transition-all duration-500",
                                tier.featured && "md:scale-110 border-purple-500/30 shadow-2xl shadow-purple-500/20"
                            )}>
                                {tier.featured && (
                                    <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-purple-500 to-pink-500"></div>
                                )}

                                <div className="p-8 space-y-6">
                                    {/* Icon & Name */}
                                    <div className="text-center space-y-4">
                                        <div className={cn(
                                            "h-20 w-20 mx-auto rounded-2xl bg-gradient-to-br flex items-center justify-center",
                                            tier.gradient
                                        )}>
                                            <tier.icon className="h-10 w-10 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-bold">{tier.name}</h3>
                                            <p className="text-sm text-muted-foreground mt-1">Min. spend: {tier.minSpend}</p>
                                        </div>
                                    </div>

                                    {/* Benefits */}
                                    <div className="space-y-3">
                                        {tier.benefits.map((benefit) => (
                                            <div key={benefit} className="flex items-center gap-2">
                                                <div className={cn(
                                                    "h-1.5 w-1.5 rounded-full",
                                                    `bg-gradient-to-r ${tier.gradient}`
                                                )}></div>
                                                <span className="text-sm text-muted-foreground">{benefit}</span>
                                            </div>
                                        ))}
                                    </div>

                                    {tier.featured && (
                                        <div className="pt-4">
                                            <div className="px-3 py-1.5 rounded-full bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 text-center text-xs font-medium text-purple-400">
                                                Most Popular
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </Card>
                        </MotionWrapper>
                    ))}
                </div>
            </div>

            {/* Benefits Overview */}
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                        { icon: Users, label: "Customer Retention", value: "+85%" },
                        { icon: Heart, label: "Brand Loyalty", value: "+70%" },
                        { icon: Zap, label: "Avg. Order Value", value: "+60%" },
                        { icon: TrendingUp, label: "Repeat Purchases", value: "3x" },
                    ].map((stat) => (
                        <Card key={stat.label} className="p-6 text-center border-white/10 bg-background/50 backdrop-blur-xl hover:border-purple-500/30 transition-all duration-300">
                            <stat.icon className="h-8 w-8 text-purple-500 mx-auto mb-3" />
                            <div className="text-3xl font-bold text-purple-500 mb-1">{stat.value}</div>
                            <div className="text-sm text-muted-foreground">{stat.label}</div>
                        </Card>
                    ))}
                </div>
            </div>

            {/* CTA Section */}
            <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16">
                <Card className="relative overflow-hidden border-purple-500/20 bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-xl">
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjA1IiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-40"></div>
                    <div className="relative z-10 p-8 md:p-12 text-center space-y-6">
                        <Crown className="h-12 w-12 text-purple-500 mx-auto" />
                        <h2 className="text-3xl md:text-4xl font-bold">Ready to Reward Your Customers?</h2>
                        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                            Build lasting relationships and increase customer lifetime value
                        </p>
                        <Button size="lg" className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-8">
                            Join Waitlist
                            <ArrowRight className="ml-2 h-5 w-5" />
                        </Button>
                    </div>
                </Card>
            </div>
        </div>
    );
}
