'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { WhatsAppSetupWizard } from '@/components/whatsapp/setup-wizard';
import { WhatsAppTemplate } from '@/types/whatsapp';

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
    console.log('Marketing Dashboard Config:', config);

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
            <div className="min-h-screen bg-muted/10 p-4 md:p-8">
                <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                            WhatsApp Marketing
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400">
                            Connect your WhatsApp Business to start sending campaigns
                        </p>
                    </div>
                    <WhatsAppSetupWizard
                        shopId={shopId}
                        onComplete={() => {
                            window.location.href = window.location.href;
                        }}
                    />
                </div>
            </div>
        );
    }

    const approvedTemplates = templates.filter(t => t.status === 'APPROVED');

    return (
        <div className="min-h-screen bg-muted/10 p-4 md:p-8">
            <div className="max-w-6xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                            WhatsApp Marketing
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                            Send campaigns and manage templates
                        </p>
                    </div>
                    <Link href={`/shop/${shopId}/marketing/send`}>
                        <Button className="bg-green-600 hover:bg-green-700">
                            <Send className="h-4 w-4 mr-2" />
                            New Campaign
                        </Button>
                    </Link>
                </div>

                {/* Connection Status */}
                <Card className="border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-green-500 flex items-center justify-center">
                                <MessageSquare className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <p className="font-semibold text-green-800 dark:text-green-200">
                                    {config?.display_name || 'WhatsApp Business'}
                                </p>
                                <p className="text-sm text-green-600 dark:text-green-400">
                                    {config?.phone_number} • Connected
                                </p>
                            </div>
                        </div>
                        {isOwner && (
                            <Button variant="ghost" size="sm" onClick={() => setShowSetup(true)}>
                                <Settings className="h-4 w-4" />
                            </Button>
                        )}
                    </CardContent>
                </Card>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                        <Card className="border-border bg-card">
                            <CardContent className="p-4">
                                <div className="flex items-center gap-2 text-gray-500 mb-2">
                                    <Send className="h-4 w-4" />
                                    <span className="text-xs font-medium">Messages Sent</span>
                                </div>
                                <p className="text-2xl font-bold">{totalMessages.toLocaleString()}</p>
                            </CardContent>
                        </Card>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                        <Card className="border-border bg-card">
                            <CardContent className="p-4">
                                <div className="flex items-center gap-2 text-gray-500 mb-2">
                                    <Users className="h-4 w-4" />
                                    <span className="text-xs font-medium">Reachable</span>
                                </div>
                                <p className="text-2xl font-bold">{customerCount.toLocaleString()}</p>
                            </CardContent>
                        </Card>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                        <Card className="border-border bg-card">
                            <CardContent className="p-4">
                                <div className="flex items-center gap-2 text-gray-500 mb-2">
                                    <FileText className="h-4 w-4" />
                                    <span className="text-xs font-medium">Templates</span>
                                </div>
                                <p className="text-2xl font-bold">{approvedTemplates.length}</p>
                            </CardContent>
                        </Card>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
                        <Card className="border-border bg-card">
                            <CardContent className="p-4">
                                <div className="flex items-center gap-2 text-gray-500 mb-2">
                                    <TrendingUp className="h-4 w-4" />
                                    <span className="text-xs font-medium">This Month</span>
                                </div>
                                <p className="text-2xl font-bold">0</p>
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>

                {/* Quick Actions */}
                <div className="grid md:grid-cols-2 gap-4">
                    <Link href={`/shop/${shopId}/marketing/send`}>
                        <Card className="border-border bg-card hover:border-green-300 hover:shadow-md transition-all cursor-pointer group">
                            <CardContent className="p-6 flex items-center gap-4">
                                <div className="h-12 w-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center group-hover:bg-green-200 transition-colors">
                                    <Send className="h-6 w-6 text-green-600" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-semibold text-gray-900 dark:text-white">Send Campaign</h3>
                                    <p className="text-sm text-gray-500">Send messages to customer segment</p>
                                </div>
                                <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-green-600 transition-colors" />
                            </CardContent>
                        </Card>
                    </Link>

                    <Card
                        className="border-border bg-card hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group"
                        onClick={templates.length === 0 ? handleSeedTemplates : handleSyncTemplates}
                    >
                        <CardContent className="p-6 flex items-center gap-4">
                            <div className="h-12 w-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                                {templates.length === 0 ? (
                                    <Sparkles className="h-6 w-6 text-blue-600" />
                                ) : (
                                    <RefreshCw className={`h-6 w-6 text-blue-600 ${isSyncing ? 'animate-spin' : ''}`} />
                                )}
                            </div>
                            <div className="flex-1">
                                <h3 className="font-semibold text-gray-900 dark:text-white">
                                    {templates.length === 0 ? 'Add Test Templates' : 'Sync Templates'}
                                </h3>
                                <p className="text-sm text-gray-500">
                                    {templates.length === 0 ? 'Add mock templates for testing' : 'Refresh templates from Meta'}
                                </p>
                            </div>
                            {(isSyncing || isSeeding) ? (
                                <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
                            ) : (
                                <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Templates List */}
                {templates.length > 0 && (
                    <Card className="border-border bg-card">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <FileText className="h-5 w-5" />
                                Your Templates
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y divide-gray-100 dark:divide-gray-800">
                                {templates.slice(0, 5).map((template) => (
                                    <div key={template.id} className="p-4 flex items-center justify-between">
                                        <div>
                                            <p className="font-medium text-gray-900 dark:text-white">{template.name}</p>
                                            <p className="text-sm text-gray-500 line-clamp-1">{template.body}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {template.status === 'APPROVED' ? (
                                                <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-full">
                                                    <CheckCircle2 className="h-3 w-3" />
                                                    Approved
                                                </span>
                                            ) : template.status === 'REJECTED' ? (
                                                <span className="flex items-center gap-1 text-xs text-red-600 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded-full">
                                                    <AlertCircle className="h-3 w-3" />
                                                    Rejected
                                                </span>
                                            ) : (
                                                <span className="text-xs text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded-full">
                                                    Pending
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Empty state */}
                {templates.length === 0 && (
                    <Card className="border-dashed border-gray-300 dark:border-gray-700">
                        <CardContent className="p-8 text-center">
                            <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                                No templates yet
                            </h3>
                            <p className="text-sm text-gray-500 mb-4">
                                Click "Add Test Templates" above to seed mock templates for testing
                            </p>
                            <a
                                href="https://business.facebook.com/latest/whatsapp_manager/message_templates"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <Button variant="outline">
                                    <Plus className="h-4 w-4 mr-2" />
                                    Or Create on Meta
                                </Button>
                            </a>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
