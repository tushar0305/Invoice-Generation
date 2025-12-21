'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
    MessageSquare,
    Send,
    Users,
    FileText,
    Settings,
    Plus,
    TrendingUp,
    CheckCircle2,
    AlertCircle,
    ChevronRight,
    RefreshCw,
    Loader2,
    Sparkles,
    Zap,
    Smartphone,
    LayoutGrid,
    Check,
    X,
    Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { WhatsAppSetupWizard } from '@/components/whatsapp/setup-wizard';
import { WhatsAppTemplate } from '@/types/whatsapp';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface Props {
    shopId: string;
    config: {
        id: string;
        phone_number: string;
        display_name: string;
        status: string;
    } | null;
    templates: WhatsAppTemplate[];
    totalMessages: number;
    customerCount: number;
    isOwner: boolean;
}

export function MarketingDashboardClient({
    shopId,
    config,
    templates,
    totalMessages,
    customerCount,
    isOwner,
}: Props) {
    const isConnected = config && config.status === 'connected';
    const [showSetup, setShowSetup] = useState(!isConnected);
    const [isSyncing, setIsSyncing] = useState(false);
    const [isSeeding, setIsSeeding] = useState(false);

    const handleSeedTemplates = async () => {
        setIsSeeding(true);
        try {
            const res = await fetch('/api/whatsapp/templates/seed', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ shopId }),
            });
            const data = await res.json();
            if (data.success) {
                window.location.reload();
            }
        } catch (error) {
            console.error('Seed error:', error);
        } finally {
            setIsSeeding(false);
        }
    };

    const handleSyncTemplates = async () => {
        setIsSyncing(true);
        try {
            const res = await fetch('/api/whatsapp/templates', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ shopId, action: 'sync' }),
            });
            const data = await res.json();
            if (data.success) {
                window.location.reload();
            }
        } catch (error) {
            console.error('Sync error:', error);
        } finally {
            setIsSyncing(false);
        }
    };

    // Setup Wizard View
    if (!isConnected || showSetup) {
        return (
            <div className="min-h-screen bg-background relative overflow-hidden">
                {/* Liquid Background */}
                <div className="fixed inset-0 -z-10">
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-green-500/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 animate-pulse" />
                    <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-primary/10 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/4" />
                </div>

                <div className="relative p-4 md:p-8 flex items-center justify-center min-h-screen">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="max-w-4xl w-full"
                    >
                        <div className="text-center mb-10 space-y-4">
                            <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-green-400 to-green-600 shadow-xl shadow-green-500/20 mb-4">
                                <MessageSquare className="h-10 w-10 text-white" />
                            </div>
                            <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">
                                Connect WhatsApp Business
                            </h1>
                            <p className="text-lg text-muted-foreground max-w-lg mx-auto leading-relaxed">
                                Supercharge your shop with automated updates, marketing campaigns, and direct customer engagement.
                            </p>
                        </div>

                        <Card className="border-0 shadow-2xl bg-card/70 backdrop-blur-xl overflow-hidden ring-1 ring-border/50">
                            <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-primary/5 pointer-events-none" />
                            <CardContent className="p-0 relative">
                                <WhatsAppSetupWizard
                                    shopId={shopId}
                                    onComplete={() => {
                                        window.location.href = window.location.href;
                                    }}
                                />
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>
            </div>
        );
    }

    const approvedTemplates = templates.filter(t => t.status === 'APPROVED');

    // Animation variants
    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    return (
        <div className="min-h-screen bg-background relative overflow-hidden">
            {/* Liquid Gradient Background */}
            <div className="fixed inset-0 -z-10">
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3 animate-pulse" />
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-green-500/10 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/4" />
                <div className="absolute top-1/2 left-1/2 w-[300px] h-[300px] bg-purple-500/5 rounded-full blur-[80px] -translate-x-1/2 -translate-y-1/2" />
            </div>

            <div className="relative p-4 md:p-8">
                <motion.div
                    variants={container}
                    initial="hidden"
                    animate="show"
                    className="max-w-7xl mx-auto space-y-6 md:space-y-8"
                >
                    {/* Glassy Modern Header */}
                    <div className="backdrop-blur-xl bg-card/70 dark:bg-card/50 rounded-3xl border border-border/50 shadow-xl p-5 md:p-8">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                            <div className="space-y-2">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="relative">
                                        <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse" />
                                        <div className="absolute inset-0 h-3 w-3 rounded-full bg-green-500 animate-ping opacity-50" />
                                    </div>
                                    <span className="text-xs font-bold tracking-wider text-green-600 dark:text-green-400 uppercase">WhatsApp Connected</span>
                                </div>
                                <h1 className="text-2xl md:text-4xl font-bold tracking-tight text-foreground">
                                    Marketing Hub
                                </h1>
                                <p className="text-muted-foreground text-sm md:text-lg">
                                    Manage campaigns for <span className="font-semibold text-foreground">{config?.display_name}</span>
                                </p>
                            </div>

                            {/* Connection Status - Hidden on mobile, shown as inline on desktop */}
                            <div className="hidden lg:flex items-center gap-4 bg-background/80 backdrop-blur-sm p-4 rounded-2xl border border-border/50 shadow-sm">
                                <div className="h-12 w-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                    <MessageSquare className="h-6 w-6 text-green-600 dark:text-green-400" />
                                </div>
                                <div className="pr-4 border-r border-border">
                                    <p className="text-base font-semibold text-foreground">{config?.phone_number}</p>
                                    <p className="text-xs text-muted-foreground">Connected Account</p>
                                </div>
                                {isOwner && (
                                    <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-muted" onClick={() => setShowSetup(true)}>
                                        <Settings className="h-5 w-5 text-muted-foreground" />
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Stats Grid - 2 cols on mobile, 4 on desktop */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                        <StatCard icon={Send} label="Messages Sent" value={totalMessages.toLocaleString()} trend="+12%" color="blue" />
                        <StatCard icon={Users} label="Audience" value={customerCount.toLocaleString()} subtext="Customers" color="purple" />
                        <StatCard icon={CheckCircle2} label="Delivery Rate" value="98%" subtext="High Quality" color="green" />
                        <StatCard icon={FileText} label="Templates" value={approvedTemplates.length.toString()} subtext="Ready" color="amber" />
                    </div>

                    {/* Main Content Area */}
                    <div className="grid lg:grid-cols-[2fr,1fr] gap-6 md:gap-8">
                        {/* Templates Gallery */}
                        <div className="space-y-5">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg md:text-xl font-bold text-foreground flex items-center gap-2">
                                    <LayoutGrid className="h-5 w-5 text-muted-foreground" />
                                    Message Templates
                                </h2>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={templates.length === 0 ? handleSeedTemplates : handleSyncTemplates}
                                    disabled={isSyncing || isSeeding}
                                    className="gap-2 rounded-full"
                                >
                                    {(isSyncing || isSeeding) ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                                    <span className="hidden sm:inline">{templates.length === 0 ? 'Load Templates' : 'Sync'}</span>
                                </Button>
                            </div>

                            {templates.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <AnimatePresence>
                                        {templates.map((template, idx) => (
                                            <TemplateCard key={template.id} template={template} idx={idx} />
                                        ))}
                                    </AnimatePresence>
                                </div>
                            ) : (
                                <EmptyStateCard onAction={handleSeedTemplates} />
                            )}
                        </div>

                        {/* Quick Actions - Stack on mobile */}
                        <div className="space-y-5">
                            <h2 className="text-lg md:text-xl font-bold text-foreground flex items-center gap-2">
                                <Zap className="h-5 w-5 text-amber-500" />
                                Quick Actions
                            </h2>

                            <Link href={`/shop/${shopId}/marketing/send`}>
                                <motion.div
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-primary/80 p-6 md:p-8 shadow-2xl cursor-pointer"
                                >
                                    <div className="absolute top-0 right-0 -mt-10 -mr-10 h-32 w-32 rounded-full bg-white/10 blur-3xl group-hover:bg-white/20 transition-all" />
                                    <div className="relative z-10 flex flex-col h-full justify-between space-y-4 md:space-y-6">
                                        <div className="h-12 w-12 md:h-14 md:w-14 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                                            <Send className="h-6 w-6 md:h-7 md:w-7 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl md:text-2xl font-bold text-white mb-1">Create Campaign</h3>
                                            <p className="text-white/70 text-sm md:text-base">Blast offers to customers instantly.</p>
                                        </div>
                                        <div className="flex items-center text-white/50 text-sm group-hover:text-white transition-colors">
                                            Start Now <ChevronRight className="h-4 w-4 ml-1" />
                                        </div>
                                    </div>
                                </motion.div>
                            </Link>

                            <div className="rounded-2xl md:rounded-3xl border border-border bg-card/80 backdrop-blur-sm p-5 md:p-6 shadow-sm">
                                <h3 className="font-semibold text-foreground mb-4">Why use WhatsApp?</h3>
                                <ul className="space-y-3">
                                    <li className="flex gap-3 items-start">
                                        <div className="h-6 w-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0 mt-0.5">
                                            <Check className="h-3 w-3 text-green-600" />
                                        </div>
                                        <span className="text-sm text-muted-foreground">98% Open rates compared to email</span>
                                    </li>
                                    <li className="flex gap-3 items-start">
                                        <div className="h-6 w-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0 mt-0.5">
                                            <Check className="h-3 w-3 text-blue-600" />
                                        </div>
                                        <span className="text-sm text-muted-foreground">Instant delivery to mobile phones</span>
                                    </li>
                                    <li className="flex gap-3 items-start">
                                        <div className="h-6 w-6 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center shrink-0 mt-0.5">
                                            <Check className="h-3 w-3 text-purple-600" />
                                        </div>
                                        <span className="text-sm text-muted-foreground">Rich media support (Images & PDFs)</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}

// --- Sub Components ---

const STAT_COLOR_STYLES: Record<string, string> = {
    blue: "from-blue-500/10 to-blue-500/5 text-blue-600 dark:text-blue-400 border-blue-200/50 dark:border-blue-800/30",
    purple: "from-purple-500/10 to-purple-500/5 text-purple-600 dark:text-purple-400 border-purple-200/50 dark:border-purple-800/30",
    green: "from-green-500/10 to-green-500/5 text-green-600 dark:text-green-400 border-green-200/50 dark:border-green-800/30",
    amber: "from-amber-500/10 to-amber-500/5 text-amber-600 dark:text-amber-400 border-amber-200/50 dark:border-amber-800/30",
};

const STAT_ICON_BG: Record<string, string> = {
    blue: "bg-blue-100 dark:bg-blue-900/30",
    purple: "bg-purple-100 dark:bg-purple-900/30",
    green: "bg-green-100 dark:bg-green-900/30",
    amber: "bg-amber-100 dark:bg-amber-900/30",
};

function StatCard({ icon: Icon, label, value, trend, subtext, color }: { icon: any, label: string, value: string, trend?: string, subtext?: string, color: string }) {
    const colorStyle = STAT_COLOR_STYLES[color] || STAT_COLOR_STYLES.blue;
    const iconBg = STAT_ICON_BG[color] || "bg-muted";

    return (
        <motion.div variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}>
            <Card className={cn("bg-gradient-to-br backdrop-blur-xl border shadow-lg hover:shadow-xl transition-all duration-300 bg-card/80 dark:bg-card/60 h-full", colorStyle)}>
                <CardContent className="p-4 md:p-5">
                    <div className="flex justify-between items-start mb-3">
                        <div className={cn("h-9 w-9 md:h-10 md:w-10 rounded-xl flex items-center justify-center", iconBg)}>
                            <Icon className="h-4 w-4 md:h-5 md:w-5" />
                        </div>
                        {trend && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-background/80 backdrop-blur-sm text-[10px] font-bold border border-border/50">
                                <TrendingUp className="h-2.5 w-2.5 mr-0.5" /> {trend}
                            </span>
                        )}
                    </div>
                    <div>
                        <p className="text-xs md:text-sm font-medium text-muted-foreground mb-0.5">{label}</p>
                        <h3 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">{value}</h3>
                        {subtext && <p className="text-[10px] md:text-xs mt-1 text-muted-foreground/70 font-medium uppercase tracking-wider">{subtext}</p>}
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}

function TemplateCard({ template, idx }: { template: WhatsAppTemplate, idx: number }) {
    const statusColor =
        template.status === 'APPROVED' ? 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800' :
            template.status === 'REJECTED' ? 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800' :
                'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800';

    const statusIcon =
        template.status === 'APPROVED' ? <CheckCircle2 className="h-3 w-3 mr-1" /> :
            template.status === 'REJECTED' ? <AlertCircle className="h-3 w-3 mr-1" /> :
                <Clock className="h-3 w-3 mr-1" />;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.05 }}
            className="group relative bg-card/80 backdrop-blur-sm rounded-2xl border border-border/50 overflow-hidden hover:shadow-xl hover:border-border transition-all duration-300 flex flex-col h-full"
        >
            {/* WhatsApp Chat Preview Header */}
            <div className="bg-[#075E54] p-3 flex items-center gap-2">
                <div className="h-6 w-6 rounded-full bg-white/20" />
                <div className="h-2 w-20 bg-white/20 rounded-full" />
            </div>

            {/* Chat Body Mock */}
            <div className="flex-1 bg-[#E5DDD5] dark:bg-muted/30 p-4 relative overflow-hidden">
                <div className="bg-white dark:bg-card p-3 rounded-tr-xl rounded-bl-xl rounded-br-xl shadow-sm max-w-[90%] relative">
                    <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed line-clamp-4">{template.body}</p>
                    <div className="mt-2 flex justify-end">
                        <span className="text-[10px] text-muted-foreground">12:00 PM</span>
                    </div>
                </div>
            </div>

            {/* Footer Info */}
            <div className="p-4 bg-card border-t border-border/50">
                <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold text-foreground line-clamp-1 text-sm">{template.name}</h4>
                    <span className={cn("text-[10px] font-bold px-2 py-1 rounded-full border flex items-center shrink-0", statusColor)}>
                        {statusIcon} {template.status}
                    </span>
                </div>
                <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-muted-foreground uppercase tracking-wider">{template.category || 'MARKETING'}</span>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button size="sm" variant="ghost" className="h-7 text-xs">Edit</Button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

function EmptyStateCard({ onAction }: { onAction: () => void }) {
    return (
        <Card className="col-span-full border-dashed border-2 border-border bg-card/50 backdrop-blur-sm">
            <CardContent className="flex flex-col items-center justify-center p-8 md:p-12 text-center">
                <div className="h-14 w-14 md:h-16 md:w-16 bg-muted rounded-full flex items-center justify-center mb-4">
                    <Sparkles className="h-7 w-7 md:h-8 md:w-8 text-muted-foreground" />
                </div>
                <h3 className="text-base md:text-lg font-semibold text-foreground mb-2">
                    No Templates Found
                </h3>
                <p className="text-muted-foreground text-sm max-w-sm mb-6">
                    Get started by syncing your templates from Meta or load sample data.
                </p>
                <Button onClick={onAction} className="rounded-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Load Test Templates
                </Button>
            </CardContent>
        </Card>
    );
}
