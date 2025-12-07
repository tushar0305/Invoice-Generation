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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

    if (!isConnected || showSetup) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-8 flex items-center justify-center">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="max-w-4xl w-full"
                >
                    <div className="text-center mb-10 space-y-4">
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-green-400 to-green-600 shadow-xl shadow-green-500/20 mb-4">
                            <MessageSquare className="h-10 w-10 text-white" />
                        </div>
                        <h1 className="text-4xl font-bold text-slate-900 dark:text-white tracking-tight">
                            Connect WhatsApp Business
                        </h1>
                        <p className="text-lg text-slate-600 dark:text-slate-400 max-w-lg mx-auto leading-relaxed">
                            Supercharge your shop with automated updates, marketing campaigns, and direct customer engagement.
                        </p>
                    </div>

                    <Card className="border-0 shadow-2xl bg-white/70 dark:bg-slate-900/50 backdrop-blur-xl overflow-hidden ring-1 ring-slate-200 dark:ring-slate-800">
                        <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-blue-500/5 Pointer-events-none" />
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
        );
    }

    const approvedTemplates = templates.filter(t => t.status === 'APPROVED');

    // Animation variants
    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-8 font-sans">
            <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="max-w-7xl mx-auto space-y-10"
            >
                {/* Modern Header with Integrated Status */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-xs font-bold tracking-wider text-green-600 dark:text-green-400 uppercase">System Online</span>
                        </div>
                        <h1 className="text-4xl font-bold text-slate-900 dark:text-white tracking-tight">
                            Marketing Hub
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 mt-1 text-lg">
                            Manage campaigns and templates for <span className="font-semibold text-slate-900 dark:text-slate-200">{config?.display_name}</span>
                        </p>
                    </div>

                    <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-2 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
                        <div className="h-10 w-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                            <MessageSquare className="h-5 w-5 text-green-600 dark:text-green-400" />
                        </div>
                        <div className="pr-4 border-r border-slate-100 dark:border-slate-800">
                            <p className="text-sm font-semibold text-slate-900 dark:text-white">{config?.phone_number}</p>
                            <p className="text-xs text-slate-500">Connected</p>
                        </div>
                        {isOwner && (
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500" onClick={() => setShowSetup(true)}>
                                <Settings className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                </div>

                {/* Glassmorphic Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard
                        icon={Send}
                        label="Messages Sent"
                        value={totalMessages.toLocaleString()}
                        trend={"+12%"}
                        color="blue"
                        delay={0.1}
                    />
                    <StatCard
                        icon={Users}
                        label="Audience Reach"
                        value={customerCount.toLocaleString()}
                        subtext="Active Customers"
                        color="purple"
                        delay={0.2}
                    />
                    <StatCard
                        icon={CheckCircle2}
                        label="High Quality"
                        value="98%"
                        subtext="Delivery Rate"
                        color="green"
                        delay={0.3}
                    />
                    <StatCard
                        icon={FileText}
                        label="Templates"
                        value={approvedTemplates.length.toString()}
                        subtext="Approved & Ready"
                        color="amber"
                        delay={0.4}
                    />
                </div>

                {/* Main Content Area */}
                <div className="grid lg:grid-cols-[2fr,1fr] gap-8">

                    {/* Left Column: Templates Gallery */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <LayoutGrid className="h-5 w-5 text-slate-400" />
                                Message Templates
                            </h2>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={templates.length === 0 ? handleSeedTemplates : handleSyncTemplates}
                                disabled={isSyncing || isSeeding}
                                className="gap-2"
                            >
                                {(isSyncing || isSeeding) ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                                {templates.length === 0 ? 'Load Test Data' : 'Sync from Meta'}
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

                    {/* Right Column: Quick Actions & Help */}
                    <div className="space-y-6">
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <Zap className="h-5 w-5 text-amber-500" />
                            Quick Actions
                        </h2>

                        <Link href={`/shop/${shopId}/marketing/send`}>
                            <motion.div
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 to-slate-800 p-8 shadow-2xl cursor-pointer"
                            >
                                <div className="absolute top-0 right-0 -mt-10 -mr-10 h-32 w-32 rounded-full bg-white/10 blur-3xl group-hover:bg-white/20 transition-all" />
                                <div className="relative z-10 flex flex-col h-full justify-between space-y-6">
                                    <div className="h-14 w-14 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                                        <Send className="h-7 w-7 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-bold text-white mb-2">Create Campaign</h3>
                                        <p className="text-slate-300">Blast offers to your customers instantly.</p>
                                    </div>
                                    <div className="flex items-center text-white/50 text-sm group-hover:text-white transition-colors">
                                        Start Now <ChevronRight className="h-4 w-4 ml-1" />
                                    </div>
                                </div>
                            </motion.div>
                        </Link>

                        <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
                            <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Why use WhatsApp?</h3>
                            <ul className="space-y-4">
                                <li className="flex gap-3">
                                    <div className="h-6 w-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0">
                                        <Check className="h-3 w-3 text-green-600" />
                                    </div>
                                    <span className="text-sm text-slate-600 dark:text-slate-400">98% Open rates compared to email</span>
                                </li>
                                <li className="flex gap-3">
                                    <div className="h-6 w-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                                        <Check className="h-3 w-3 text-blue-600" />
                                    </div>
                                    <span className="text-sm text-slate-600 dark:text-slate-400">Instant delivery to mobile phones</span>
                                </li>
                                <li className="flex gap-3">
                                    <div className="h-6 w-6 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center shrink-0">
                                        <Check className="h-3 w-3 text-purple-600" />
                                    </div>
                                    <span className="text-sm text-slate-600 dark:text-slate-400">Rich media support (Images & PDFs)</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

// --- Sub Components ---

const STAT_COLOR_STYLES: Record<string, string> = {
    blue: "from-blue-500/10 to-blue-500/5 text-blue-600 border-blue-200/50",
    purple: "from-purple-500/10 to-purple-500/5 text-purple-600 border-purple-200/50",
    green: "from-green-500/10 to-green-500/5 text-green-600 border-green-200/50",
    amber: "from-amber-500/10 to-amber-500/5 text-amber-600 border-amber-200/50",
};

const STAT_ICON_BG: Record<string, string> = {
    blue: "bg-blue-100 dark:bg-blue-900/30",
    purple: "bg-purple-100 dark:bg-purple-900/30",
    green: "bg-green-100 dark:bg-green-900/30",
    amber: "bg-amber-100 dark:bg-amber-900/30",
};

function StatCard({ icon: Icon, label, value, trend, subtext, color, delay }: { icon: any, label: string, value: string, trend?: string, subtext?: string, color: string, delay?: number }) {
    const colorStyle = STAT_COLOR_STYLES[color] || STAT_COLOR_STYLES.blue;
    const iconBg = STAT_ICON_BG[color] || "bg-slate-100";

    return (
        <motion.div variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}>
            <Card className={cn("border bg-gradient-to-br backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-300", colorStyle)}>
                <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                        <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center", iconBg)}>
                            <Icon className="h-5 w-5" />
                        </div>
                        {trend && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full bg-white/50 text-xs font-bold text-slate-700">
                                <TrendingUp className="h-3 w-3 mr-1" /> {trend}
                            </span>
                        )}
                    </div>
                    <div>
                        <p className="text-sm font-medium opacity-70 mb-1">{label}</p>
                        <h3 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{value}</h3>
                        {subtext && <p className="text-xs mt-2 opacity-60 font-medium uppercase tracking-wider">{subtext}</p>}
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    )
}

function TemplateCard({ template, idx }: { template: WhatsAppTemplate, idx: number }) {
    const statusColor =
        template.status === 'APPROVED' ? 'bg-green-100 text-green-700 border-green-200' :
            template.status === 'REJECTED' ? 'bg-red-100 text-red-700 border-red-200' :
                'bg-amber-100 text-amber-700 border-amber-200';

    const statusIcon =
        template.status === 'APPROVED' ? <CheckCircle2 className="h-3 w-3 mr-1" /> :
            template.status === 'REJECTED' ? <AlertCircle className="h-3 w-3 mr-1" /> :
                <Clock className="h-3 w-3 mr-1" />;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.05 }}
            className="group relative bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden hover:shadow-xl hover:border-slate-300 transition-all duration-300 flex flex-col h-full"
        >
            {/* WhatsApp Chat Preview Header */}
            <div className="bg-[#075E54] p-3 flex items-center gap-2">
                <div className="h-6 w-6 rounded-full bg-white/20" />
                <div className="h-2 w-20 bg-white/20 rounded-full" />
            </div>

            {/* Chat Body Mock */}
            <div className="flex-1 bg-[#E5DDD5] dark:bg-slate-800 p-4 relative bg-opacity-50">
                <div className="bg-white dark:bg-slate-700 p-3 rounded-tr-xl rounded-bl-xl rounded-br-xl shadow-sm max-w-[90%] relative">
                    <p className="text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed font-sans">{template.body}</p>
                    <div className="mt-2 flex justify-end">
                        <span className="text-[10px] text-slate-400">12:00 PM</span>
                    </div>
                </div>
            </div>

            {/* Footer Info */}
            <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
                <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold text-slate-900 dark:text-white line-clamp-1">{template.name}</h4>
                    <span className={cn("text-[10px] font-bold px-2 py-1 rounded-full border flex items-center", statusColor)}>
                        {statusIcon} {template.status}
                    </span>
                </div>
                <div className="flex items-center justify-between mt-3">
                    <span className="text-xs text-slate-500 uppercase tracking-wider">{template.category || 'MARKETING'}</span>
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
        <Card className="col-span-full border-dashed border-2 border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50">
            <CardContent className="flex flex-col items-center justify-center p-12 text-center">
                <div className="h-16 w-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                    <Sparkles className="h-8 w-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                    No Templates Found
                </h3>
                <p className="text-slate-500 max-w-sm mb-6">
                    Get started by syncing your existing templates from Meta or load our sample set to test the waters.
                </p>
                <Button onClick={onAction}>
                    <Plus className="h-4 w-4 mr-2" />
                    Load Test Templates
                </Button>
            </CardContent>
        </Card>
    );
}
