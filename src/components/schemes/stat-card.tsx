import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
    title: string;
    value: string | number;
    subtext?: string;
    icon: LucideIcon;
    iconColor?: string;
    bgColor?: string;
}

export function StatCard({ title, value, subtext, icon: Icon, iconColor, bgColor }: StatCardProps) {
    return (
        <Card className="border-border/60 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
            <CardContent className="p-4 md:p-6">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">{title}</p>
                        <h3 className="text-2xl font-bold mt-1 tracking-tight">{value}</h3>
                        {subtext && <p className="text-xs text-muted-foreground mt-1">{subtext}</p>}
                    </div>
                    <div className={cn("p-2.5 rounded-xl transition-transform group-hover:scale-110", bgColor, iconColor)}>
                        <Icon className="w-5 h-5" />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
