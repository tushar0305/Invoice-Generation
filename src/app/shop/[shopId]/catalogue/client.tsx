'use client';

import { useState } from 'react';
import { CatalogueSetupWizard } from '@/components/catalogue/setup-wizard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    ExternalLink,
    Copy,
    Globe,
    BarChart3,
    Package,
    Share2,
    Sparkles,
    Smartphone,
    Settings,
    Eye,
    TrendingUp,
    Users,
    MousePointer
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { QRCodeSVG } from 'qrcode.react';
import { ProductManager } from '@/components/catalogue/product-manager';
import { CatalogueSettingsForm } from '@/components/catalogue/catalogue-settings-form';
import { BasicHeader, ModernHeader, PremiumHeader } from '@/components/catalogue/catalogue-headers';

interface Props {
    shopId: string;
    initialSettings: any;
    isOwner: boolean;
    stats?: {
        page_views: number;
        leads: number;
        product_views: number;
    };
}

export function CatalogueClient({ shopId, initialSettings, isOwner, stats }: Props) {
    const [settings, setSettings] = useState(initialSettings);
    const [activeTab, setActiveTab] = useState('overview');
    const { toast } = useToast();

    // Framer Motion imports will be dynamic to avoid SSR issues if strictly needed, 
    // but standard import usually works with "use client".
    // We'll rely on the top-level import (assuming user adds it if missing, but I should add it).
    // Wait, I can't add imports with replace_file_content easily if I don't see the top.
    // I will use a larger replacement to include imports.

    if (!settings) {
        // ... (Wizard Code - kept same) ...
        return (
            <div className="min-h-screen bg-gradient-to-br from-amber-50/50 via-white to-purple-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900 p-4 md:p-8 flex items-center justify-center">
                <div className="max-w-4xl w-full space-y-8">
                    <div className="text-center space-y-4">
                        <div className="inline-flex items-center justify-center p-4 rounded-2xl bg-gradient-to-br from-amber-100 to-amber-50 dark:from-amber-900/40 dark:to-amber-900/10 mb-4 shadow-lg shadow-amber-500/10">
                            <Sparkles className="h-10 w-10 text-primary" />
                        </div>
                        <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 via-gray-700 to-gray-900 dark:from-white dark:via-gray-200 dark:to-white">
                            Digital Showcase
                        </h1>
                        <p className="text-base md:text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto px-4">
                            Create a stunning mini-website to showcase your jewellery collection on WhatsApp & Instagram.
                        </p>
                    </div>
                    <CatalogueSetupWizard
                        shopId={shopId}
                        onComplete={() => window.location.reload()}
                    />
                </div>
            </div>
        );
    }

    const publicUrl = `${window.location.protocol}//${window.location.host}/store/${settings.public_slug}`;

    const copyLink = () => {
        navigator.clipboard.writeText(publicUrl);
        toast({ title: 'Link copied!', description: 'Ready to share.' });
    };

    return (
        <div className="min-h-screen bg-background pb-24 md:pb-8 transition-colors duration-300">

            {/* DYNAMIC HEADER */}
            {settings.template_id === 'modern' ? (
                <ModernHeader settings={settings} stats={stats} publicUrl={publicUrl} onCopyLink={copyLink} />
            ) : settings.template_id === 'premium' ? (
                <PremiumHeader settings={settings} stats={stats} publicUrl={publicUrl} onCopyLink={copyLink} />
            ) : (
                <BasicHeader settings={settings} stats={stats} publicUrl={publicUrl} onCopyLink={copyLink} />
            )}

            {/* MAIN CONTENT CONTAINER - Overlaps Header */}
            <div className="max-w-5xl mx-auto px-4 md:px-8 -mt-8 relative z-10 space-y-8">

                {/* SEGMENTED CONTROL TABS */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                    <div className="flex justify-center md:justify-start">
                        <TabsList className="h-14 p-1.5 bg-background/80 backdrop-blur-xl border border-border shadow-xl shadow-black/5 rounded-full inline-flex w-full md:w-auto">
                            {['overview', 'products', 'settings'].map((tab) => (
                                <TabsTrigger
                                    key={tab}
                                    value={tab}
                                    className="rounded-full px-6 md:px-8 h-full text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all capitalize"
                                >
                                    {tab}
                                </TabsTrigger>
                            ))}
                        </TabsList>
                    </div>

                    {/* Overview Tab */}
                    <TabsContent value="overview" className="space-y-6 focus-visible:outline-none animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* Stats Grid (Mobile Only since Desktop has them in header) */}
                        <div className="grid grid-cols-3 gap-3 md:hidden">
                            <Card className="border-none shadow-sm bg-card/60 backdrop-blur-sm">
                                <CardContent className="p-4 text-center">
                                    <p className="text-2xl font-bold text-foreground">{stats?.page_views || 0}</p>
                                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Views</p>
                                </CardContent>
                            </Card>
                            <Card className="border-none shadow-sm bg-card/60 backdrop-blur-sm">
                                <CardContent className="p-4 text-center">
                                    <p className="text-2xl font-bold text-foreground">{stats?.leads || 0}</p>
                                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Leads</p>
                                </CardContent>
                            </Card>
                            <Card className="border-none shadow-sm bg-card/60 backdrop-blur-sm">
                                <CardContent className="p-4 text-center">
                                    <p className="text-2xl font-bold text-foreground">{stats?.product_views || 0}</p>
                                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Products</p>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Quick Actions & QR (Existing cards but polished) */}
                        <div className="grid md:grid-cols-2 gap-4 md:gap-6">
                            {/* QR Code Card */}
                            <Card className="border-none shadow-xl shadow-gray-200/50 dark:shadow-black/20 bg-card overflow-hidden relative group">
                                <CardContent className="p-6 md:p-8 flex flex-col sm:flex-row items-center gap-8">
                                    <div className="bg-white p-3 rounded-xl border shadow-sm shrink-0">
                                        <QRCodeSVG value={publicUrl} size={120} />
                                    </div>
                                    <div className="text-center sm:text-left space-y-4 w-full">
                                        <div>
                                            <h3 className="text-lg font-bold text-foreground">Store QR Code</h3>
                                            <p className="text-sm text-muted-foreground">Customers can scan this to visit.</p>
                                        </div>
                                        <Button className="w-full sm:w-auto rounded-full" variant="outline" onClick={() => {
                                            const svg = document.querySelector('svg');
                                            if (svg) {
                                                const svgData = new XMLSerializer().serializeToString(svg);
                                                const canvas = document.createElement("canvas");
                                                const ctx = canvas.getContext("2d");
                                                const img = new window.Image();
                                                img.onload = () => {
                                                    canvas.width = img.width;
                                                    canvas.height = img.height;
                                                    ctx?.drawImage(img, 0, 0);
                                                    const pngFile = canvas.toDataURL("image/png");
                                                    const downloadLink = document.createElement("a");
                                                    downloadLink.download = "shop-qr-code";
                                                    downloadLink.href = `${pngFile}`;
                                                    downloadLink.click();
                                                };
                                                img.src = "data:image/svg+xml;base64," + btoa(svgData);
                                            }
                                        }}>
                                            Download QR
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Tips Card */}
                            <Card className="border-0 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-xl shadow-primary/20">
                                <CardContent className="p-6 md:p-8 flex flex-col justify-center h-full space-y-4">
                                    <Sparkles className="h-8 w-8 text-white/80" />
                                    <div className="space-y-2">
                                        <h3 className="text-xl font-bold">Boost Your Sales</h3>
                                        <p className="text-primary-foreground/90 text-sm leading-relaxed">
                                            Share your catalogue link in your Instagram Bio and WhatsApp Status every day. Stores sharing daily get 3x more leads.
                                        </p>
                                    </div>
                                    <Button variant="secondary" className="w-full bg-white/20 hover:bg-white/30 text-white border-0 rounded-full backdrop-blur-md" onClick={copyLink}>
                                        <Copy className="mr-2 h-4 w-4" /> Copy Link
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    <TabsContent value="products" className="focus-visible:outline-none animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <ProductManager shopId={shopId} viewMode={settings.template_id === 'basic' ? 'list' : 'grid'} />
                    </TabsContent>

                    <TabsContent value="settings" className="focus-visible:outline-none -mx-4 md:mx-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="bg-transparent md:bg-card md:rounded-2xl md:border md:shadow-sm md:p-6">
                            <CatalogueSettingsForm shopId={shopId} initialSettings={settings} />
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
