import { Button } from '@/components/ui/button';
import { Users, Shield, UserPlus } from 'lucide-react';

interface StaffHeaderProps {
    shopName: string;
    stats: {
        totalStaff: number;
        activeNow: number;
    };
    onAddStaff: () => void;
}

export const StaffHeader = ({ shopName, stats, onAddStaff }: StaffHeaderProps) => (
    <div className="relative overflow-hidden pb-12">
        {/* Gradient Background - Lighter, more subtle */}
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
                            <Users className="h-3 w-3" />
                            <span>Team Management</span>
                        </div>
                        <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-foreground via-foreground to-primary bg-clip-text text-transparent break-words line-clamp-2">
                            Staff & Roles
                        </h1>
                        <p className="text-muted-foreground max-w-md text-base md:text-lg leading-relaxed">
                            Manage your team, assign roles, and track performance.
                        </p>
                    </div>

                    {/* Actions & Stats */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full md:w-auto">
                         {/* Mini Stats for Desktop (Hidden on mobile to save space/native feel) */}
                        <div className="hidden md:flex gap-6 mr-4 border-r border-border/50 pr-6">
                            <div>
                                <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">Total Staff</p>
                                <p className="text-2xl font-bold text-foreground">{stats.totalStaff}</p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">Active</p>
                                <p className="text-2xl font-bold text-foreground">{stats.activeNow}</p>
                            </div>
                        </div>

                        <Button 
                            onClick={onAddStaff} 
                            size="lg" 
                            className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25 rounded-xl font-semibold text-base h-12 px-8 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                        >
                            <UserPlus className="mr-2 h-5 w-5" />
                            Add Member
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    </div>
);
