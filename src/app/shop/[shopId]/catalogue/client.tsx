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
            <div className="min-h-screen bg-gradient-to-br from-amber-50/50 via-white to-purple-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900 p-4 md:p-8 flex items-center justify-center">
                <div className="max-w-4xl w-full space-y-8">
                    <div className="text-center space-y-4">
                        <div className="inline-flex items-center justify-center p-4 rounded-2xl bg-gradient-to-br from-amber-100 to-amber-50 dark:from-amber-900/40 dark:to-amber-900/10 mb-4 shadow-lg shadow-amber-500/10">
                            <Sparkles className="h-10 w-10 text-[#D4AF37]" />
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
        toast({ title: 'Link copied!', description: 'Share it on WhatsApp or Instagram bio.' });
    };

    return (
        <div className="min-h-screen bg-muted/10 pb-24 md:pb-8">
            {/* Hero Header */}
            <div className="relative overflow-hidden bg-card border-b border-border">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-50/50 via-transparent to-purple-50/30 dark:from-background dark:via-background dark:to-background" />
                <div className="relative max-w-7xl mx-auto p-4 md:p-8">
                    <div className="flex flex-col gap-4">
                        {/* Title Section */}
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-[#D4AF37] font-medium text-sm">
                                <Globe className="h-4 w-4" />
                                <span>Your Digital Storefront</span>
                            </div>
                            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
                                {settings.shop_display_name || 'My Catalogue'}
                            </h1>
                        </div>

                        {/* URL and Actions */}
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                            <a
                                href={publicUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[#D4AF37] transition-colors group truncate"
                            >
                                <span className="underline decoration-dotted underline-offset-4 truncate max-w-[250px] md:max-w-none">{publicUrl}</span>
                                <ExternalLink className="h-4 w-4 opacity-50 group-hover:opacity-100 transition-opacity shrink-0" />
                            </a>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={copyLink}
                                    className="h-9 gap-2"
                                >
                                    <Copy className="h-4 w-4" />
                                    <span className="hidden sm:inline">Copy Link</span>
                                </Button>
                                <Button
                                    size="sm"
                                    className="h-9 bg-[#D4AF37] hover:bg-[#b5952f] text-white shadow-lg shadow-amber-500/20 gap-2"
                                    onClick={() => window.open(publicUrl, '_blank')}
                                >
                                    <Eye className="h-4 w-4" />
                                    <span className="hidden sm:inline">View Store</span>
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-6">
                {/* Main Dashboard Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                    <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
                        <TabsList className="bg-white/80 dark:bg-gray-800/80 border border-gray-200/50 dark:border-gray-700/50 p-1 h-auto w-full md:w-auto inline-flex justify-start md:justify-center rounded-xl backdrop-blur-sm">
                            <TabsTrigger
                                value="overview"
                                className="h-10 px-4 md:px-6 rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900 data-[state=active]:text-[#D4AF37] data-[state=active]:shadow-sm transition-all text-xs md:text-sm flex items-center gap-2"
                            >
                                <BarChart3 className="h-4 w-4" />
                                <span className="hidden sm:inline">Overview</span>
                            </TabsTrigger>
                            <TabsTrigger
                                value="products"
                                className="h-10 px-4 md:px-6 rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900 data-[state=active]:text-[#D4AF37] data-[state=active]:shadow-sm transition-all text-xs md:text-sm flex items-center gap-2"
                            >
                                <Package className="h-4 w-4" />
                                <span className="hidden sm:inline">Products</span>
                            </TabsTrigger>
                            <TabsTrigger
                                value="settings"
                                className="h-10 px-4 md:px-6 rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900 data-[state=active]:text-[#D4AF37] data-[state=active]:shadow-sm transition-all text-xs md:text-sm flex items-center gap-2"
                            >
                                <Settings className="h-4 w-4" />
                                <span className="hidden sm:inline">Settings</span>
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    {/* Overview Tab */}
                    <TabsContent value="overview" className="space-y-6 focus-visible:outline-none">
                        {/* Stats Grid */}
                        <div className="grid grid-cols-3 gap-3 md:gap-6">
                            <Card className="border border-border shadow-sm bg-card overflow-hidden">
                                <CardContent className="p-4 md:p-6">
                                    <div className="flex items-center justify-between mb-2 md:mb-3">
                                        <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                            <Eye className="h-4 w-4 md:h-5 md:w-5 text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <TrendingUp className="h-4 w-4 text-green-500" />
                                    </div>
                                    <p className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">{stats?.page_views || 0}</p>
                                    <p className="text-xs md:text-sm text-muted-foreground">Page Views</p>
                                </CardContent>
                            </Card>
                            <Card className="border border-border shadow-sm bg-card overflow-hidden">
                                <CardContent className="p-4 md:p-6">
                                    <div className="flex items-center justify-between mb-2 md:mb-3">
                                        <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                                            <Users className="h-4 w-4 md:h-5 md:w-5 text-emerald-600 dark:text-emerald-400" />
                                        </div>
                                        <TrendingUp className="h-4 w-4 text-green-500" />
                                    </div>
                                    <p className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">{stats?.leads || 0}</p>
                                    <p className="text-xs md:text-sm text-muted-foreground">WhatsApp Leads</p>
                                </CardContent>
                            </Card>
                            <Card className="border border-border shadow-sm bg-card overflow-hidden">
                                <CardContent className="p-4 md:p-6">
                                    <div className="flex items-center justify-between mb-2 md:mb-3">
                                        <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                                            <MousePointer className="h-4 w-4 md:h-5 md:w-5 text-purple-600 dark:text-purple-400" />
                                        </div>
                                        <TrendingUp className="h-4 w-4 text-green-500" />
                                    </div>
                                    <p className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">{stats?.product_views || 0}</p>
                                    <p className="text-xs md:text-sm text-muted-foreground">Product Views</p>
                                </CardContent>
                            </Card>
                        </div>

                        {/* QR Code & Quick Actions */}
                        <div className="grid md:grid-cols-2 gap-4 md:gap-6">
                            {/* QR Code Card */}
                            <Card className="border-none shadow-xl shadow-gray-200/50 dark:shadow-black/20 bg-gradient-to-br from-gray-900 to-gray-800 text-white overflow-hidden relative">
                                <div className="absolute inset-0 bg-[#D4AF37]/10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-400/20 via-transparent to-transparent" />
                                <CardHeader className="relative pb-3">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-lg">Share Your Store</CardTitle>
                                        <Share2 className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <CardDescription className="text-gray-400">Scan the QR code to visit on mobile</CardDescription>
                                </CardHeader>
                                <CardContent className="relative flex flex-col sm:flex-row items-center gap-6">
                                    <div className="bg-white p-4 rounded-2xl shadow-lg shrink-0">
                                        <QRCodeSVG value={publicUrl} size={140} />
                                    </div>
                                    <div className="flex flex-col gap-3 w-full sm:w-auto">
                                        <Button
                                            variant="secondary"
                                            className="w-full font-semibold"
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
                                            Download QR
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className="w-full bg-transparent border-white/20 hover:bg-white/10 text-white"
                                            onClick={copyLink}
                                        >
                                            <Copy className="mr-2 h-4 w-4" />
                                            Copy Link
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Quick Actions Card */}
                            <div className="space-y-4">
                                <Card className="border border-amber-100 dark:border-amber-900/20 bg-amber-50/50 dark:bg-amber-900/10">
                                    <CardContent className="p-4 md:p-6">
                                        <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-2">
                                            <Sparkles className="h-4 w-4 text-[#D4AF37]" />
                                            Pro Tip
                                        </h3>
                                        <p className="text-gray-600 dark:text-gray-400 text-sm">
                                            Share your catalogue link in your Instagram Bio and WhatsApp Status regularly to drive more traffic.
                                        </p>
                                    </CardContent>
                                </Card>

                                <Card className="border border-blue-100 dark:border-blue-900/20 bg-blue-50/50 dark:bg-blue-900/10">
                                    <CardContent className="p-4 md:p-6 flex items-center justify-between gap-4">
                                        <div>
                                            <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-1">
                                                <Smartphone className="h-4 w-4 text-blue-500" />
                                                Mobile Preview
                                            </h3>
                                            <p className="text-gray-600 dark:text-gray-400 text-sm">
                                                See how your store looks to customers.
                                            </p>
                                        </div>
                                        <Button variant="outline" size="sm" onClick={() => window.open(publicUrl, '_blank')}>
                                            View
                                        </Button>
                                    </CardContent>
                                </Card>

                                <Card className="border border-purple-100 dark:border-purple-900/20 bg-purple-50/50 dark:bg-purple-900/10">
                                    <CardContent className="p-4 md:p-6 flex items-center justify-between gap-4">
                                        <div>
                                            <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-1">
                                                <Package className="h-4 w-4 text-purple-500" />
                                                Add Products
                                            </h3>
                                            <p className="text-gray-600 dark:text-gray-400 text-sm">
                                                Showcase your jewellery collection.
                                            </p>
                                        </div>
                                        <Button variant="outline" size="sm" onClick={() => setActiveTab('products')}>
                                            Manage
                                        </Button>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="products" className="focus-visible:outline-none">
                        <ProductManager shopId={shopId} />
                    </TabsContent>

                    <TabsContent value="settings" className="focus-visible:outline-none">
                        <div className="fixed inset-0 z-50 bg-white dark:bg-gray-950 overflow-auto">
                            {/* Close/Back Button */}
                            <button
                                onClick={() => setActiveTab('overview')}
                                className="fixed top-4 right-4 z-50 p-3 rounded-full bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-800 shadow-xl hover:shadow-2xl transition-all hover:scale-110"
                            >
                                <svg className="h-6 w-6 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                            
                            <CatalogueSetupWizard
                                shopId={shopId}
                                onComplete={() => {
                                    window.location.reload();
                                }}
                                initialData={settings}
                            />
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
