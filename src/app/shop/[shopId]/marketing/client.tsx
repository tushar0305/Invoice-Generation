'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
    LayoutGrid,
    Check,
    Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { WhatsAppSetupWizard } from '@/components/whatsapp/setup-wizard';
import { WhatsAppTemplate } from '@/types/whatsapp';
import { cn } from '@/lib/utils';
import { MarketingHeader } from '@/components/marketing/marketing-header';

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
    const router = useRouter();
    const isConnected = config && config.status === 'connected';
    const [showSetup, setShowSetup] = useState(!isConnected);
    const [isSyncing, setIsSyncing] = useState(false);
    const [isSeeding, setIsSeeding] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');

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
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 animate-pulse" />
                    <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-primary/10 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/4" />
                </div>

                <div className="relative p-4 md:p-8 flex items-center justify-center min-h-screen">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="max-w-4xl w-full"
                    >
                        <div className="text-center mb-10 space-y-4">
                            <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-primary to-primary/80 shadow-xl shadow-primary/20 mb-4">
                                <MessageSquare className="h-10 w-10 text-primary-foreground" />
                            </div>
                            <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">
                                Connect WhatsApp Business
                            </h1>
                            <p className="text-lg text-muted-foreground max-w-lg mx-auto leading-relaxed">
                                Supercharge your shop with automated updates, marketing campaigns, and direct customer engagement.
                            </p>
                        </div>

                        <Card className="border-0 shadow-2xl bg-card/70 backdrop-blur-xl overflow-hidden ring-1 ring-border/50">
                            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary/5 pointer-events-none" />
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

    return (
        <div className="min-h-screen bg-background pb-24 md:pb-8 transition-colors duration-300">
            
            {/* HEADER */}
            <MarketingHeader 
                shopName={config?.display_name || 'My Shop'} 
                stats={{ totalMessages, customerCount }} 
                onNewCampaign={() => router.push(`/shop/${shopId}/marketing/send`)} 
            />

            {/* MAIN CONTENT - Overlaps Header */}
            <div className="max-w-5xl mx-auto px-4 md:px-8 -mt-8 relative z-10 space-y-8">

                {/* TABS */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                    <div className="flex justify-center md:justify-start">
                        <TabsList className="h-auto p-1.5 bg-background/80 backdrop-blur-xl border border-border shadow-xl shadow-black/5 rounded-full grid grid-cols-2 w-full md:w-auto md:inline-flex md:h-14">
                            <TabsTrigger
                                value="overview"
                                className="rounded-full px-6 md:px-8 py-3 md:py-0 h-full text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all capitalize"
                            >
                                Overview
                            </TabsTrigger>
                            <TabsTrigger
                                value="templates"
                                className="rounded-full px-6 md:px-8 py-3 md:py-0 h-full text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all capitalize"
                            >
                                Templates
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    {/* OVERVIEW TAB */}
                    <TabsContent value="overview" className="space-y-6 focus-visible:outline-none animate-in fade-in slide-in-from-bottom-4 duration-500">
                        
                        {/* Mobile Stats Grid */}
                        <div className="grid grid-cols-2 gap-3 md:hidden">
                            <Card className="border-none shadow-sm bg-card/60 backdrop-blur-sm col-span-2">
                                <CardContent className="p-4 text-center">
                                    <p className="text-2xl font-bold text-foreground">{totalMessages.toLocaleString()}</p>
                                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Messages Sent</p>
                                </CardContent>
                            </Card>
                            <Card className="border-none shadow-sm bg-card/60 backdrop-blur-sm col-span-1">
                                <CardContent className="p-4 text-center">
                                    <p className="text-2xl font-bold text-foreground">{customerCount.toLocaleString()}</p>
                                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Audience</p>
                                </CardContent>
                            </Card>
                            <Card className="border-none shadow-sm bg-card/60 backdrop-blur-sm col-span-1">
                                <CardContent className="p-4 text-center">
                                    <p className="text-2xl font-bold text-foreground">{approvedTemplates.length}</p>
                                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Templates</p>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Desktop Additional Stats */}
                        <div className="hidden md:grid md:grid-cols-4 gap-4">
                            <StatCard icon={Send} label="Messages Sent" value={totalMessages.toLocaleString()} trend="+12%" color="blue" />
                            <StatCard icon={Users} label="Audience" value={customerCount.toLocaleString()} subtext="Customers" color="purple" />
                            <StatCard icon={CheckCircle2} label="Delivery Rate" value="98%" subtext="High Quality" color="green" />
                            <StatCard icon={FileText} label="Templates" value={approvedTemplates.length.toString()} subtext="Ready" color="amber" />
                        </div>

                        {/* Quick Actions */}
                        <div className="grid md:grid-cols-2 gap-4">
                            <Link href={`/shop/${shopId}/marketing/send`} className="block h-full">
                                <Card className="h-full border-0 bg-gradient-to-br from-primary/10 to-primary/5 text-foreground shadow-xl shadow-primary/5 hover:shadow-primary/10 transition-all">
                                    <CardContent className="p-6 md:p-8 flex flex-col justify-center h-full space-y-4">
                                        <div className="p-3 bg-primary/10 rounded-xl w-fit">
                                            <Send className="h-6 w-6 text-primary" />
                                        </div>
                                        <div className="space-y-2">
                                            <h3 className="text-xl font-bold">Create Campaign</h3>
                                            <p className="text-muted-foreground text-sm leading-relaxed">
                                                Blast offers to customers instantly. High open rates guaranteed.
                                            </p>
                                        </div>
                                        <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground border-0 rounded-full shadow-lg shadow-primary/20">
                                            Start Now <ChevronRight className="h-4 w-4 ml-2" />
                                        </Button>
                                    </CardContent>
                                </Card>
                            </Link>

                            <Card className="border-none shadow-xl shadow-gray-200/50 dark:shadow-black/20 bg-card overflow-hidden relative group">
                                <CardContent className="p-6 md:p-8 flex flex-col justify-center h-full space-y-4">
                                    <div className="space-y-2">
                                        <h3 className="text-xl font-bold">Why WhatsApp?</h3>
                                        <ul className="space-y-3 mt-2">
                                            <li className="flex gap-3 items-start">
                                                <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                                                    <Check className="h-3 w-3 text-primary" />
                                                </div>
                                                <span className="text-sm text-muted-foreground">98% Open rates</span>
                                            </li>
                                            <li className="flex gap-3 items-start">
                                                <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                                                    <Check className="h-3 w-3 text-primary" />
                                                </div>
                                                <span className="text-sm text-muted-foreground">Instant delivery</span>
                                            </li>
                                        </ul>
                                    </div>
                                    <Button variant="outline" className="w-full rounded-full" onClick={() => setActiveTab('templates')}>
                                        Manage Templates
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    {/* TEMPLATES TAB */}
                    <TabsContent value="templates" className="space-y-6 focus-visible:outline-none animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold">Message Templates</h2>
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
                    </TabsContent>
                </Tabs>
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
