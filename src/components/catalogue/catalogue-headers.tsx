import { Button } from '@/components/ui/button';
import { ExternalLink, Copy, Globe, Sparkles, MapPin, Phone } from 'lucide-react';
import { cn } from '@/lib/utils';
import { QRCodeSVG } from 'qrcode.react';

interface HeaderProps {
    settings: any;
    stats?: {
        page_views: number;
        leads: number;
    };
    publicUrl: string;
    onCopyLink: () => void;
}

// --- BASIC HEADER: Modern Glass Effect ---
export const BasicHeader = ({ settings, publicUrl, onCopyLink }: HeaderProps) => (
    <div className="relative overflow-hidden">
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/10 to-background" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/30 via-transparent to-transparent" />

        {/* Floating Glass Orbs */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-primary/20 rounded-full blur-3xl -translate-y-1/3 translate-x-1/4 animate-pulse" />
        <div className="absolute bottom-0 left-0 w-56 h-56 bg-primary/15 rounded-full blur-2xl translate-y-1/3 -translate-x-1/4" />

        {/* Glass Container */}
        <div className="relative max-w-5xl mx-auto px-4 md:px-8 py-10 md:py-16">
            <div className="backdrop-blur-xl bg-white/60 dark:bg-gray-900/60 rounded-3xl border border-white/40 dark:border-white/10 shadow-2xl shadow-primary/10 p-6 md:p-10">
                <div className="flex flex-col gap-6">

                    {/* Brand Section */}
                    <div className="space-y-3">
                        <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-foreground via-foreground to-primary bg-clip-text text-transparent">
                            {settings.shop_display_name || 'My Shop'}
                        </h1>
                        {settings.about_text && (
                            <p className="text-muted-foreground max-w-xl text-base md:text-lg leading-relaxed">
                                {settings.about_text}
                            </p>
                        )}
                    </div>

                    {/* Action Bar */}
                    <div className="flex flex-wrap items-center gap-3">
                        <button
                            onClick={onCopyLink}
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/80 dark:bg-white/10 hover:bg-white dark:hover:bg-white/20 backdrop-blur-sm border border-white/50 dark:border-white/20 rounded-full text-sm font-medium text-foreground transition-all shadow-lg shadow-black/5 hover:shadow-xl active:scale-[0.98]"
                        >
                            <Copy className="h-4 w-4" />
                            Share
                        </button>
                        <button
                            onClick={() => window.open(publicUrl, '_blank')}
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary/90 rounded-full text-sm font-semibold text-primary-foreground transition-all shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 active:scale-[0.98]"
                        >
                            <ExternalLink className="h-4 w-4" />
                            Visit Store
                        </button>

                        {/* Phone - Clickable */}
                        {settings.contact_phone && (
                            <a
                                href={`tel:${settings.contact_phone}`}
                                className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-500/10 dark:bg-emerald-500/20 backdrop-blur-sm border border-emerald-500/30 rounded-full text-sm font-medium text-emerald-700 dark:text-emerald-400 transition-all hover:bg-emerald-500/20 dark:hover:bg-emerald-500/30"
                            >
                                <Phone className="h-4 w-4" />
                                {settings.contact_phone}
                            </a>
                        )}
                    </div>
                </div>
            </div>
        </div>
    </div>
);

// --- MODERN HEADER: Card-based, Grid Alignment, Bold Colors ---
export const ModernHeader = ({ settings, stats, publicUrl, onCopyLink }: HeaderProps) => (
    <div className="bg-muted/30 pb-20 pt-8 px-4 md:px-8">
        <div className="max-w-5xl mx-auto">
            <div className="relative overflow-hidden rounded-[2rem] bg-primary text-primary-foreground shadow-2xl p-6 md:p-10">
                {/* Decorative Pattern */}
                <div className="absolute top-0 right-0 p-12 opacity-10">
                    <Sparkles className="h-48 w-48" />
                </div>

                <div className="relative z-10 grid md:grid-cols-2 gap-8 items-center">
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <div className="inline-flex items-center rounded-full bg-white/20 px-3 py-1 text-xs font-medium text-white backdrop-blur-md">
                                Verified Store
                            </div>
                            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
                                {settings.shop_display_name || 'Store Name'}
                            </h1>
                            <p className="text-primary-foreground/80 max-w-md text-lg">
                                {settings.about_text || 'Welcome to our digital collection.'}
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            <button onClick={onCopyLink} className="flex items-center gap-2 bg-white text-primary px-5 py-2.5 rounded-xl font-semibold hover:bg-white/90 transition-colors shadow-lg shadow-black/5">
                                <Copy className="h-4 w-4" /> Copy Link
                            </button>
                            <button onClick={() => window.open(publicUrl, '_blank')} className="flex items-center gap-2 bg-black/20 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-black/30 transition-colors backdrop-blur-sm">
                                <Globe className="h-4 w-4" /> Visit Website
                            </button>
                        </div>
                    </div>

                    <div className="hidden md:flex justify-end">
                        <div className="bg-white/10 p-6 rounded-2xl backdrop-blur-md border border-white/10 w-64">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="p-3 bg-white/20 rounded-xl">
                                    <Globe className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                    <p className="text-sm text-white/60">Total Views</p>
                                    <p className="text-2xl font-bold text-white">{stats?.page_views || 0}</p>
                                </div>
                            </div>
                            <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                                <div className="h-full bg-white w-[70%]" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
);

// --- PREMIUM HEADER: (The Existing Luxury One) ---
export const PremiumHeader = ({ settings, stats, publicUrl, onCopyLink }: HeaderProps) => (
    <div className="relative overflow-hidden bg-gradient-to-b from-muted/50 to-background border-b border-border transition-colors duration-300 pb-16 pt-8 md:pt-12 md:pb-24">
        {/* Abstract Background Elements */}
        <div className="absolute top-0 right-0 w-[250px] h-[250px] md:w-[500px] md:h-[500px] bg-primary/5 rounded-full blur-[80px] md:blur-[120px] -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-[150px] h-[150px] md:w-[300px] md:h-[300px] bg-primary/5 rounded-full blur-[60px] md:blur-[100px] translate-y-1/2 -translate-x-1/2" />

        <div className="relative max-w-5xl mx-auto px-4 md:px-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 md:gap-8">

                {/* Brand Info */}
                <div className="space-y-4 max-w-full md:max-w-2xl overflow-hidden">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/10 backdrop-blur-md text-xs font-medium text-primary">
                        <Sparkles className="h-3 w-3" />
                        <span>Premium Storefront</span>
                    </div>

                    <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold tracking-tight text-foreground leading-tight md:leading-[1.1] break-words">
                        <span className="block text-transparent bg-clip-text bg-gradient-to-r from-primary via-foreground to-primary/70">
                            {settings.shop_display_name || 'My Catalogue'}
                        </span>
                    </h1>

                    {/* Smart Link Bar */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 max-w-md w-full">
                        <div
                            onClick={onCopyLink}
                            className="group flex-1 flex items-center justify-between gap-3 px-4 py-2.5 rounded-full bg-card hover:bg-muted border border-border shadow-sm transition-all cursor-pointer active:scale-[0.98] overflow-hidden"
                        >
                            <div className="flex items-center gap-3 overflow-hidden min-w-0">
                                <Globe className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                                <span className="text-sm font-medium text-foreground truncate font-mono tracking-tight w-full">
                                    {publicUrl.replace(/^https?:\/\//, '')}
                                </span>
                            </div>
                            <Copy className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                        </div>

                        <Button
                            size="icon"
                            className="hidden sm:flex rounded-full h-11 w-11 shrink-0 bg-primary text-primary-foreground hover:opacity-90 transition-all shadow-lg"
                            onClick={() => window.open(publicUrl, '_blank')}
                        >
                            <ExternalLink className="h-5 w-5" />
                        </Button>
                    </div>
                </div>

                {/* Desktop Stats */}
                <div className="hidden md:flex gap-8 border-l border-border pl-8 shrink-0">
                    <div>
                        <p className="text-3xl font-bold text-foreground">{stats?.page_views || 0}</p>
                        <p className="text-sm text-muted-foreground">Views</p>
                    </div>
                    <div>
                        <p className="text-3xl font-bold text-foreground">{stats?.leads || 0}</p>
                        <p className="text-sm text-muted-foreground">Leads</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
);
