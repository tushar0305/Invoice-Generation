import { Button } from '@/components/ui/button';
import { Plus, Crown, Sparkles, Gift } from 'lucide-react';

interface LoyaltyHeaderProps {
    shopName: string;
    onNewReward: () => void;
}

export const LoyaltyHeader = ({ shopName, onNewReward }: LoyaltyHeaderProps) => (
    <div className="relative overflow-hidden pb-12">
        {/* Gradient Background - Purple Theme */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/10 to-background" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/30 via-transparent to-transparent" />

        {/* Floating Orbs for Native Feel */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-primary/20 rounded-full blur-3xl -translate-y-1/3 translate-x-1/4 animate-pulse" />
        <div className="absolute bottom-0 left-0 w-56 h-56 bg-primary/15 rounded-full blur-2xl translate-y-1/3 -translate-x-1/4" />
        
        {/* Glass Container */}
        <div className="relative max-w-5xl mx-auto px-4 md:px-8 py-10 md:py-16">
            <div className="backdrop-blur-xl bg-white/60 dark:bg-gray-900/60 rounded-3xl border border-white/40 dark:border-white/10 shadow-2xl shadow-primary/10 p-6 md:p-10">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    
                    {/* Text Content */}
                    <div className="space-y-3">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/10 backdrop-blur-md text-xs font-medium text-primary">
                            <Crown className="h-3 w-3" />
                            <span>Loyalty Program</span>
                        </div>
                        <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-foreground via-foreground to-primary bg-clip-text text-transparent break-words line-clamp-2">
                            {shopName} Rewards
                        </h1>
                        <p className="text-muted-foreground max-w-md text-base md:text-lg leading-relaxed">
                            Build customer loyalty with points, rewards, and exclusive tiers.
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full md:w-auto">
                        <Button 
                            onClick={onNewReward} 
                            className="rounded-full h-12 px-8 shadow-lg shadow-primary/30 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-base transition-all hover:scale-105 active:scale-95"
                        >
                            <Gift className="h-5 w-5 mr-2" /> Issue Points
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    </div>
);
