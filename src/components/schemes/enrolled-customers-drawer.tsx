'use client';

import { useState, useEffect } from 'react';
import {
    Drawer,
    DrawerContent,
    DrawerDescription,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from '@/components/ui/drawer';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Users, Loader2, Phone, Calendar } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { supabase } from '@/supabase/client';
import { format } from 'date-fns';
import { formatCurrency } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface EnrolledCustomersDrawerProps {
    shopId: string;
    schemeId: string;
    schemeName: string;
    trigger?: React.ReactNode;
}

export function EnrolledCustomersDrawer({ shopId, schemeId, schemeName, trigger }: EnrolledCustomersDrawerProps) {
    const [open, setOpen] = useState(false);
    const isMobile = useIsMobile();
    const [enrollments, setEnrollments] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (open) {
            const fetchEnrollments = async () => {
                setIsLoading(true);
                const { data } = await supabase
                    .from('scheme_enrollments')
                    .select('*, customer:customers(name, phone)')
                    .eq('shop_id', shopId)
                    .eq('scheme_id', schemeId)
                    .eq('status', 'ACTIVE')
                    .order('created_at', { ascending: false });
                
                if (data) {
                    setEnrollments(data);
                }
                setIsLoading(false);
            };
            fetchEnrollments();
        }
    }, [open, shopId, schemeId]);

    const Content = (
        <div className="space-y-4 p-4">
            {isLoading ? (
                <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
            ) : enrollments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-10 w-10 mx-auto mb-2 opacity-20" />
                    <p>No active enrollments found.</p>
                </div>
            ) : (
                <ScrollArea className="h-[60vh] pr-4">
                    <div className="space-y-3">
                        {enrollments.map((enrollment) => (
                            <div key={enrollment.id} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                                <div>
                                    <p className="font-medium">{enrollment.customer?.name || 'Unknown Customer'}</p>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <span className="font-mono">#{enrollment.account_number}</span>
                                        <span>•</span>
                                        <span className="flex items-center gap-1">
                                            <Phone className="h-3 w-3" />
                                            {enrollment.customer?.phone || 'N/A'}
                                        </span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-sm text-green-600">{formatCurrency(enrollment.total_paid)}</p>
                                    <p className="text-xs text-muted-foreground">
                                        Since {format(new Date(enrollment.start_date), 'MMM yyyy')}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            )}
        </div>
    );

    if (!isMobile) {
        return (
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                    {trigger || (
                        <Button variant="outline" size="sm" className="gap-2">
                            <Users className="h-4 w-4" /> View Enrollments
                        </Button>
                    )}
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Enrolled Customers</DialogTitle>
                        <DialogDescription>
                            Active enrollments for {schemeName}
                        </DialogDescription>
                    </DialogHeader>
                    {Content}
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Drawer open={open} onOpenChange={setOpen}>
            <DrawerTrigger asChild>
                {trigger || (
                    <Button variant="outline" size="sm" className="gap-2">
                        <Users className="h-4 w-4" /> View Enrollments
                    </Button>
                )}
            </DrawerTrigger>
            <DrawerContent>
                <DrawerHeader>
                    <DrawerTitle>Enrolled Customers</DrawerTitle>
                    <DrawerDescription>
                        Active enrollments for {schemeName}
                    </DrawerDescription>
                </DrawerHeader>
                {Content}
            </DrawerContent>
        </Drawer>
    );
}
