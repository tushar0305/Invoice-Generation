import { Button } from '@/components/ui/button';
import { Plus, Users, TrendingUp, Sparkles } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface SchemesHeaderProps {
    shopName: string;
    stats: {
        totalEnrollments: number;
        totalValue: number;
    };
    onAddNew: () => void;
    onLuckyDraw?: () => void;
}

export const SchemesHeader = ({ shopName, stats, onAddNew, onLuckyDraw }: SchemesHeaderProps) => (
    <div className="relative overflow-hidden pb-12">
        {/* Gradient Background - Lighter, more subtle */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/10 to-background" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/30 via-transparent to-transparent" />

        {/* Floating Orbs for Native Feel */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-primary/20 rounded-full blur-3xl -translate-y-1/3 translate-x-1/4 animate-pulse" />
        <div className="absolute bottom-0 left-0 w-56 h-56 bg-primary/15 rounded-full blur-2xl translate-y-1/3 -translate-x-1/4" />
        
        {/* Glass Container */}
        <div className="relative max-w-5xl mx-auto px-4 md:px-8 py-6 md:py-10">
            <div className="backdrop-blur-xl bg-white/60 dark:bg-gray-900/60 rounded-3xl border border-white/40 dark:border-white/10 shadow-2xl shadow-primary/10 p-6 md:p-8">
                <div className="flex flex-col gap-6">
                    
                    {/* Text Content */}
                    <div className="space-y-3 max-w-4xl">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/10 backdrop-blur-md text-xs font-medium text-primary">
                            <Sparkles className="h-3 w-3" />
                            <span>Gold Savings Plan</span>
                        </div>
                        <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-foreground via-foreground to-primary bg-clip-text text-transparent break-words">
                            {shopName} Gold Schemes
                        </h1>
                        <p className="text-muted-foreground max-w-md text-base md:text-lg leading-relaxed">
                            Manage your gold schemes and customer enrollments efficiently.
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-3 w-full md:w-auto border-t border-primary/5 pt-6">
                        {onLuckyDraw && (
                            <Button 
                                variant="outline" 
                                onClick={onLuckyDraw}
                                className="rounded-full h-12 px-6 border-amber-200 hover:bg-amber-50 text-amber-700 dark:border-amber-800 dark:text-amber-400 dark:hover:bg-amber-950/30 font-semibold transition-all flex-1 sm:flex-none"
                            >
                                <Sparkles className="h-4 w-4 mr-2" /> Lucky Draw
                            </Button>
                        )}
                        <Button 
                            onClick={onAddNew} 
                            className="rounded-full h-12 px-8 shadow-lg shadow-primary/30 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-base transition-all hover:scale-105 active:scale-95 flex-1 sm:flex-none"
                        >
                            <Plus className="h-5 w-5 mr-2" /> New Scheme
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    </div>
);
