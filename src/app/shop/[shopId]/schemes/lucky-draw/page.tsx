'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useActiveShop } from '@/hooks/use-active-shop';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Calendar, Users, Trophy, Sparkles, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/supabase/client';
import { LuckyDrawWheel, Participant } from '@/components/schemes/lucky-draw/wheel';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { Loader2 } from 'lucide-react';

interface Scheme {
    id: string;
    name: string;
}

export default function LuckyDrawPage({ params }: { params: Promise<{ shopId: string }> }) {
    const unwrappedParams = use(params);
    const shopId = unwrappedParams.shopId;
    const router = useRouter();
    const { toast } = useToast();

    const [schemes, setSchemes] = useState<Scheme[]>([]);
    const [selectedSchemeId, setSelectedSchemeId] = useState<string>('');
    const [selectedMonth, setSelectedMonth] = useState<string>(format(new Date(), 'yyyy-MM'));
    
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [winner, setWinner] = useState<Participant | null>(null);

    // Fetch Schemes
    useEffect(() => {
        const fetchSchemes = async () => {
            const { data, error } = await supabase
                .from('schemes')
                .select('id, name')
                .eq('shop_id', shopId)
                .eq('is_active', true);
            
            if (data) {
                setSchemes(data);
                if (data.length > 0) setSelectedSchemeId(data[0].id);
            }
        };
        fetchSchemes();
    }, [shopId]);

    // Fetch Eligible Participants
    useEffect(() => {
        if (!selectedSchemeId || !selectedMonth) return;

        const fetchParticipants = async () => {
            setIsLoading(true);
            setWinner(null);
            try {
                const date = new Date(selectedMonth);
                const start = startOfMonth(date).toISOString();
                const end = endOfMonth(date).toISOString();

                // 1. Get all transactions for this scheme in this month
                // We need to join with enrollments to filter by scheme_id
                // But Supabase join syntax is tricky for deep filters.
                // Let's do it in two steps or use a view if performance is an issue.
                // Step 1: Get enrollments for this scheme
                const { data: enrollments } = await supabase
                    .from('scheme_enrollments')
                    .select('id, account_number, customer:customers(name)')
                    .eq('scheme_id', selectedSchemeId)
                    .eq('status', 'ACTIVE');

                if (!enrollments || enrollments.length === 0) {
                    setParticipants([]);
                    return;
                }

                const enrollmentIds = enrollments.map(e => e.id);

                // Step 2: Check which of these enrollments have paid in the selected month
                // We need to check if there is ANY transaction in the selected month
                // The previous logic was strict on 'PAID' status, let's broaden it slightly to catch any payment
                const { data: transactions } = await supabase
                    .from('scheme_transactions')
                    .select('enrollment_id')
                    .in('enrollment_id', enrollmentIds)
                    .gte('payment_date', start)
                    .lte('payment_date', end);

                if (!transactions) {
                    setParticipants([]);
                    return;
                }

                // Unique set of paid enrollment IDs
                const paidEnrollmentIds = new Set(transactions.map(t => t.enrollment_id));

                // Filter enrollments
                const eligible = enrollments
                    .filter(e => paidEnrollmentIds.has(e.id))
                    .map(e => ({
                        id: e.id,
                        name: (e.customer as any)?.name || 'Unknown',
                        ticketNumber: e.account_number,
                        enrollmentId: e.id
                    }));

                setParticipants(eligible);

            } catch (error) {
                console.error(error);
                toast({ title: "Error", description: "Failed to load participants", variant: "destructive" });
            } finally {
                setIsLoading(false);
            }
        };

        fetchParticipants();
    }, [selectedSchemeId, selectedMonth, toast]);

    const handleWinnerSelected = async (winner: Participant) => {
        setWinner(winner);
        // Optional: Save winner to DB
        // await supabase.from('lucky_draw_winners').insert(...)
        toast({
            title: "Winner Selected!",
            description: `${winner.name} has won the lucky draw!`,
            className: "bg-emerald-500 text-white border-0"
        });
    };

    // Generate last 6 months for dropdown
    const months = Array.from({ length: 6 }, (_, i) => {
        const d = subMonths(new Date(), i);
        return {
            value: format(d, 'yyyy-MM'),
            label: format(d, 'MMMM yyyy')
        };
    });

    return (
        <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-8 pb-24">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Sparkles className="w-6 h-6 text-amber-500" />
                        Monthly Lucky Draw
                    </h1>
                    <p className="text-muted-foreground">Select a winner from customers who paid on time.</p>
                </div>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
                {/* Controls & List */}
                <div className="md:col-span-1 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Configuration</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Select Scheme</label>
                                <Select value={selectedSchemeId} onValueChange={setSelectedSchemeId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select scheme" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {schemes.map(s => (
                                            <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Select Month</label>
                                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select month" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {months.map(m => (
                                            <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="pt-4 border-t">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm font-medium flex items-center gap-2">
                                        <Users className="w-4 h-4" />
                                        Eligible Participants
                                    </span>
                                    <Badge variant="secondary">{participants.length}</Badge>
                                </div>
                                
                                <div className="bg-muted/30 rounded-lg p-2 max-h-[300px] overflow-y-auto space-y-1">
                                    {isLoading ? (
                                        <div className="flex justify-center py-4">
                                            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                                        </div>
                                    ) : participants.length > 0 ? (
                                        participants.map(p => (
                                            <div key={p.id} className="text-sm p-2 hover:bg-muted rounded flex justify-between items-center">
                                                <span>{p.name}</span>
                                                <span className="font-mono text-xs text-muted-foreground">#{p.ticketNumber}</span>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-8 text-muted-foreground text-xs">
                                            <AlertCircle className="w-6 h-6 mx-auto mb-2 opacity-50" />
                                            No eligible customers found for this month.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* The Wheel */}
                <div className="md:col-span-2">
                    <Card className="h-full border-2 border-amber-100 dark:border-amber-900/30 bg-gradient-to-b from-amber-50/50 to-transparent dark:from-amber-950/10">
                        <CardContent className="flex items-center justify-center min-h-[500px] p-8">
                            {participants.length >= 2 ? (
                                <LuckyDrawWheel 
                                    participants={participants} 
                                    onWinnerSelected={handleWinnerSelected} 
                                />
                            ) : (
                                <div className="text-center max-w-md mx-auto">
                                    <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Trophy className="w-10 h-10 text-slate-300" />
                                    </div>
                                    <h3 className="text-xl font-semibold mb-2">Waiting for Participants</h3>
                                    <p className="text-muted-foreground">
                                        We need at least 2 eligible customers to start the lucky draw. 
                                        Select a different month or ensure payments are recorded.
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
