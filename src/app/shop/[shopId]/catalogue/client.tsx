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
    Sparkles,
    Settings,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { QRCodeSVG } from 'qrcode.react';
import { ProductManager } from '@/components/catalogue/product-manager';
import { CatalogueSettingsForm } from '@/components/catalogue/catalogue-settings-form';
import { cn } from '@/lib/utils';

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

    if (!settings) {
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

    const tabs = [
        { id: 'overview', label: 'Overview', icon: BarChart3 },
        { id: 'products', label: 'Products', icon: Package },
        { id: 'settings', label: 'Settings', icon: Settings },
    ];

    return (
        <div className="min-h-screen bg-background pb-24 transition-colors duration-300">

            {/* --- PREMIUM HERO HEADER (Design System) --- */}
            <div className="relative overflow-hidden pb-12">
                {/* 1. Background Layers */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/10 to-background" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/30 via-transparent to-transparent" />

                {/* 2. Floating Orbs (Animated) */}
                <div className="absolute top-0 right-0 w-72 h-72 bg-primary/20 rounded-full blur-3xl -translate-y-1/3 translate-x-1/4 animate-pulse" />
                <div className="absolute bottom-0 left-0 w-56 h-56 bg-primary/15 rounded-full blur-2xl translate-y-1/3 -translate-x-1/4" />

                {/* 3. Glass Container */}
                <div className="relative max-w-7xl mx-auto px-4 md:px-8 py-10 md:py-16">
                    <div className="backdrop-blur-xl bg-white/60 dark:bg-gray-900/60 rounded-3xl border border-white/40 dark:border-white/10 shadow-2xl shadow-primary/10 p-6 md:p-10">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                            {/* Brand Info */}
                            <div className="space-y-3">
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/10 backdrop-blur-md text-xs font-medium text-primary">
                                    <Globe className="h-3 w-3" />
                                    <span>Live Storefront</span>
                                </div>

                                <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-foreground via-foreground to-primary bg-clip-text text-transparent break-words">
                                    {settings.shop_display_name || 'Digital Catalogue'}
                                </h1>

                                <div className="flex flex-wrap items-center gap-3 pt-2">
                                    <button
                                        onClick={copyLink}
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 dark:bg-white/10 hover:bg-white dark:hover:bg-white/20 backdrop-blur-sm border border-white/50 dark:border-white/20 rounded-full text-sm font-medium text-foreground transition-all shadow-sm hover:shadow-md active:scale-[0.98]"
                                    >
                                        <Copy className="h-4 w-4" />
                                        <span className="truncate max-w-[200px]">{publicUrl.replace(/^https?:\/\//, '')}</span>
                                    </button>
                                    <button
                                        onClick={() => window.open(publicUrl, '_blank')}
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 rounded-full text-sm font-semibold text-primary-foreground transition-all shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 active:scale-[0.98]"
                                    >
                                        <ExternalLink className="h-4 w-4" />
                                        Visit Store
                                    </button>
                                </div>
                            </div>

                            {/* Desktop Stats (Bento Mini) */}
                            <div className="hidden md:flex gap-6">
                                <div className="bg-white/40 dark:bg-black/20 backdrop-blur-md border border-white/20 p-4 rounded-2xl min-w-[120px]">
                                    <p className="text-3xl font-bold text-foreground">{stats?.page_views || 0}</p>
                                    <p className="text-xs uppercase tracking-wider font-semibold text-muted-foreground mt-1">Total Views</p>
                                </div>
                                <div className="bg-white/40 dark:bg-black/20 backdrop-blur-md border border-white/20 p-4 rounded-2xl min-w-[120px]">
                                    <p className="text-3xl font-bold text-foreground">{stats?.leads || 0}</p>
                                    <p className="text-xs uppercase tracking-wider font-semibold text-muted-foreground mt-1">Leads</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- MAIN CONTENT & TABS --- */}
            <div className="max-w-7xl mx-auto px-4 md:px-8 -mt-8 relative z-20">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
                    {/* CAPSULE TAB SWITCHER (Design System: Gold Schemes Style) */}
                    <div className="flex justify-center md:justify-start transition-all duration-200">
                        <TabsList className="h-auto p-1.5 bg-background/80 backdrop-blur-xl border border-border shadow-xl shadow-black/5 rounded-full grid grid-cols-3 w-full md:w-auto md:inline-flex md:h-14">
                            {tabs.map((tab) => {
                                const Icon = tab.icon;
                                return (
                                    <TabsTrigger
                                        key={tab.id}
                                        value={tab.id}
                                        className="rounded-full px-4 md:px-8 py-3 md:py-0 h-full text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all capitalize flex items-center justify-center gap-2"
                                    >
                                        <Icon className="h-4 w-4 md:h-4 md:w-4" />
                                        <span className="hidden md:inline">{tab.label}</span>
                                        <span className="md:hidden">{tab.label}</span>
                                    </TabsTrigger>
                                )
                            })}
                        </TabsList>
                    </div>

                    {/* Overview Tab */}
                    <TabsContent value="overview" className="space-y-6 focus-visible:outline-none animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* Mobile Stats Grid (Bento Style) */}
                        <div className="grid grid-cols-3 gap-3 md:hidden">
                            <div className="bg-card/60 backdrop-blur-xl border border-border/50 p-4 rounded-2xl shadow-sm text-center">
                                <p className="text-2xl font-bold text-foreground">{stats?.page_views || 0}</p>
                                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mt-1">Views</p>
                            </div>
                            <div className="bg-card/60 backdrop-blur-xl border border-border/50 p-4 rounded-2xl shadow-sm text-center">
                                <p className="text-2xl font-bold text-foreground">{stats?.leads || 0}</p>
                                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mt-1">Leads</p>
                            </div>
                            <div className="bg-card/60 backdrop-blur-xl border border-border/50 p-4 rounded-2xl shadow-sm text-center">
                                <p className="text-2xl font-bold text-foreground">{stats?.product_views || 0}</p>
                                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mt-1">Products</p>
                            </div>
                        </div>

                        {/* Quick Actions & QR */}
                        <div className="grid md:grid-cols-2 gap-4 md:gap-6">
                            {/* QR Code Card */}
                            <Card className="border-border/50 shadow-lg shadow-black/5 bg-card/60 backdrop-blur-xl overflow-hidden relative group">
                                <CardContent className="p-6 md:p-8 flex flex-col sm:flex-row items-center gap-8">
                                    <div className="bg-white p-3 rounded-2xl border shadow-sm shrink-0 transition-transform group-hover:scale-105 duration-500">
                                        <QRCodeSVG value={publicUrl} size={140} />
                                    </div>
                                    <div className="text-center sm:text-left space-y-4 w-full">
                                        <div>
                                            <h3 className="text-xl font-bold text-foreground">Store QR Code</h3>
                                            <p className="text-sm text-muted-foreground">Customers can scan this to visit.</p>
                                        </div>
                                        <Button className="w-full sm:w-auto rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20" onClick={() => {
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
                            <Card className="border-0 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-xl shadow-primary/20 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                                <CardContent className="p-6 md:p-8 flex flex-col justify-center h-full space-y-6 relative z-10">
                                    <div className="bg-white/20 w-12 h-12 rounded-xl flex items-center justify-center backdrop-blur-md">
                                        <Sparkles className="h-6 w-6 text-white" />
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="text-2xl font-bold">Boost Your Sales</h3>
                                        <p className="text-primary-foreground/90 text-sm leading-relaxed max-w-sm">
                                            Share your catalogue link in your Instagram Bio and WhatsApp Status every day. Stores sharing daily get 3x more leads.
                                        </p>
                                    </div>
                                    <Button variant="secondary" className="w-full sm:w-auto bg-white hover:bg-white/90 text-primary border-0 rounded-full shadow-lg" onClick={copyLink}>
                                        <Copy className="mr-2 h-4 w-4" /> Copy Link
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    <TabsContent value="products" className="focus-visible:outline-none animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* Products Content Container - Glass */}
                        <div className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-3xl overflow-hidden shadow-xl shadow-black/5 min-h-[500px]">
                            <ProductManager shopId={shopId} viewMode={settings.template_id === 'basic' ? 'list' : 'grid'} />
                        </div>
                    </TabsContent>

                    <TabsContent value="settings" className="focus-visible:outline-none animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-3xl overflow-hidden shadow-xl shadow-black/5 p-6">
                            <CatalogueSettingsForm shopId={shopId} initialSettings={settings} />
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
