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
    Smartphone
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { QRCodeSVG } from 'qrcode.react';
import { ProductManager } from '@/components/catalogue/product-manager';

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

    // If no settings exist, show Setup Wizard
    if (!settings) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8 flex items-center justify-center">
                <div className="max-w-4xl w-full space-y-8">
                    <div className="text-center space-y-4">
                        <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-gradient-to-br from-amber-100 to-amber-50 dark:from-amber-900/40 dark:to-amber-900/10 mb-4">
                            <Sparkles className="h-8 w-8 text-[#D4AF37]" />
                        </div>
                        <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 via-gray-700 to-gray-900 dark:from-white dark:via-gray-200 dark:to-white">
                            Digital Showcase
                        </h1>
                        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
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
        toast({ title: 'Link copied!', description: 'Share it on WhatsApp or Instagram bio.' });
    };

    return (
        <div className="min-h-screen bg-muted/10 pb-20">
            {/* Hero Header */}
            <div className="relative overflow-hidden bg-card border-b border-border">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-50/50 via-transparent to-purple-50/30 dark:from-background dark:via-background dark:to-background" />
                <div className="relative max-w-7xl mx-auto p-6 md:p-10">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-[#D4AF37] font-medium text-sm">
                                <Globe className="h-4 w-4" />
                                <span>Your Digital Storefront</span>
                            </div>
                            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white tracking-tight">
                                {settings.shop_display_name || 'My Catalogue'}
                            </h1>
                            <a
                                href={publicUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-2 text-gray-500 hover:text-[#D4AF37] transition-colors group"
                            >
                                <span className="underline decoration-dotted underline-offset-4">{publicUrl}</span>
                                <ExternalLink className="h-4 w-4 opacity-50 group-hover:opacity-100 transition-opacity" />
                            </a>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3">
                            <Button
                                variant="outline"
                                onClick={copyLink}
                                className="h-12 px-6 border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 gap-2"
                            >
                                <Copy className="h-4 w-4" />
                                Copy Link
                            </Button>
                            <Button
                                className="h-12 px-6 bg-[#D4AF37] hover:bg-[#b5952f] text-white shadow-lg shadow-amber-500/20 gap-2"
                                onClick={() => setActiveTab('products')}
                            >
                                <Package className="h-4 w-4" />
                                Manage Products
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8">
                {/* Main Dashboard Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
                    <div className="sticky top-0 z-30 bg-gray-50/80 dark:bg-gray-900/80 backdrop-blur-xl py-2 -mx-4 px-4 md:mx-0 md:px-0 md:bg-transparent md:backdrop-blur-none md:static">
                        <TabsList className="bg-white/50 dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-700/50 p-1 h-12 w-full md:w-auto overflow-x-auto justify-start md:justify-center rounded-xl backdrop-blur-sm">
                            <TabsTrigger
                                value="overview"
                                className="h-10 px-6 rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900 data-[state=active]:text-[#D4AF37] data-[state=active]:shadow-sm transition-all"
                            >
                                Overview
                            </TabsTrigger>
                            <TabsTrigger
                                value="products"
                                className="h-10 px-6 rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900 data-[state=active]:text-[#D4AF37] data-[state=active]:shadow-sm transition-all"
                            >
                                Products
                            </TabsTrigger>
                            <TabsTrigger
                                value="settings"
                                className="h-10 px-6 rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900 data-[state=active]:text-[#D4AF37] data-[state=active]:shadow-sm transition-all"
                            >
                                Settings
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    {/* Overview Tab */}
                    <TabsContent value="overview" className="space-y-6 focus-visible:outline-none">
                        <div className="grid md:grid-cols-3 gap-6">
                            {/* Analytics Panel */}
                            <Card className="md:col-span-2 border border-border shadow-sm bg-card">
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <CardTitle className="text-xl font-bold">Performance</CardTitle>
                                            <CardDescription>Activity in the last 30 days</CardDescription>
                                        </div>
                                        <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                            <BarChart3 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <div className="p-6 bg-card border border-border rounded-2xl">
                                            <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-2">Page Views</p>
                                            <div className="flex items-end justify-between">
                                                <p className="text-4xl font-bold text-gray-900 dark:text-white">{stats?.page_views || 0}</p>
                                                <div className="text-xs text-blue-600 dark:text-blue-400 font-medium py-1 px-2 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                                                    Views
                                                </div>
                                            </div>
                                        </div>
                                        <div className="p-6 bg-card border border-border rounded-2xl">
                                            <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400 mb-2">WhatsApp Leads</p>
                                            <div className="flex items-end justify-between">
                                                <p className="text-4xl font-bold text-gray-900 dark:text-white">{stats?.leads || 0}</p>
                                                <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium py-1 px-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-full">
                                                    Clicks
                                                </div>
                                            </div>
                                        </div>
                                        <div className="p-6 bg-card border border-border rounded-2xl">
                                            <p className="text-sm font-medium text-purple-600 dark:text-purple-400 mb-2">Products Viewed</p>
                                            <div className="flex items-end justify-between">
                                                <p className="text-4xl font-bold text-gray-900 dark:text-white">{stats?.product_views || 0}</p>
                                                <div className="text-xs text-purple-600 dark:text-purple-400 font-medium py-1 px-2 bg-purple-100 dark:bg-purple-900/30 rounded-full">
                                                    Interest
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* QR Code & Share Card */}
                            <Card className="border-none shadow-xl shadow-gray-200/50 dark:shadow-black/20 bg-gradient-to-br from-gray-900 to-gray-800 text-white overflow-hidden relative">
                                <div className="absolute inset-0 bg-[#D4AF37]/10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-400/20 via-transparent to-transparent" />
                                <CardHeader className="relative">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-lg">Share Store</CardTitle>
                                        <Share2 className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <CardDescription className="text-gray-400">Scan to visit on mobile</CardDescription>
                                </CardHeader>
                                <CardContent className="relative flex flex-col items-center">
                                    <div className="bg-white p-4 rounded-2xl shadow-lg mb-6">
                                        <QRCodeSVG value={publicUrl} size={160} />
                                    </div>
                                    <div className="flex gap-2 w-full">
                                        <Button
                                            variant="secondary"
                                            className="flex-1 font-semibold"
                                            onClick={() => {
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
                                            }}
                                        >
                                            Download
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className="flex-1 bg-transparent border-white/20 hover:bg-white/10 text-white"
                                            onClick={copyLink}
                                        >
                                            <Copy className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Quick Tips Section */}
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="p-6 rounded-2xl bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20">
                                <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-2">
                                    <Sparkles className="h-4 w-4 text-[#D4AF37]" />
                                    Pro Tip
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400 text-sm">
                                    Share your catalogue link in your Instagram Bio and WhatsApp Status regularly to drive more traffic.
                                </p>
                            </div>
                            <div className="p-6 rounded-2xl bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/20 flex items-center justify-between gap-4">
                                <div>
                                    <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-2">
                                        <Smartphone className="h-4 w-4 text-blue-500" />
                                        Mobile Preview
                                    </h3>
                                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                                        See how your store looks to your customers.
                                    </p>
                                </div>
                                <Button variant="outline" size="sm" onClick={() => window.open(publicUrl, '_blank')}>
                                    View
                                </Button>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="products" className="focus-visible:outline-none">
                        <ProductManager shopId={shopId} />
                    </TabsContent>

                    <TabsContent value="settings" className="focus-visible:outline-none">
                        <Card className="max-w-3xl mx-auto border border-border shadow-sm bg-card">
                            <CardContent className="p-0">
                                <div className="p-8 border-b border-gray-100 dark:border-gray-800 text-center">
                                    <h2 className="text-2xl font-bold mb-2">Store Configuration</h2>
                                    <p className="text-muted-foreground">Update your store details and appearance</p>
                                </div>
                                <div className="p-8">
                                    <CatalogueSetupWizard
                                        shopId={shopId}
                                        onComplete={() => window.location.reload()}
                                        initialData={settings}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
