'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { format } from 'date-fns';
import { Trophy, Users, Calendar, Gift, Sparkles, History, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { getEligibleParticipants, saveLuckyDrawWinner, type EligibleParticipant } from '@/actions/lucky-draw-actions';
import { MotionWrapper } from '@/components/ui/motion-wrapper';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

interface LuckyDrawClientProps {
    initialHistory: any[];
}

export function LuckyDrawClient({ initialHistory }: LuckyDrawClientProps) {
    const params = useParams();
    const shopId = params.shopId as string;
    const { toast } = useToast();

    const [month, setMonth] = useState<string>(new Date().getMonth().toString()); // 0-11
    const [year, setYear] = useState<string>(new Date().getFullYear().toString());
    const [participants, setParticipants] = useState<EligibleParticipant[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [prize, setPrize] = useState('1g Gold Coin');
    
    const [isSpinning, setIsSpinning] = useState(false);
    const [winner, setWinner] = useState<EligibleParticipant | null>(null);
    const [showWinnerModal, setShowWinnerModal] = useState(false);
    const [history, setHistory] = useState(initialHistory);

    // Fetch participants when month/year changes
    useEffect(() => {
        fetchParticipants();
    }, [month, year]);

    const fetchParticipants = async () => {
        setIsLoading(true);
        try {
            // Month is 0-indexed in JS, but 1-indexed in our action
            const data = await getEligibleParticipants(shopId, parseInt(month) + 1, parseInt(year));
            setParticipants(data);
        } catch (error) {
            console.error(error);
            toast({ title: "Error", description: "Failed to fetch eligible participants", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };

    const handleSpin = async () => {
        if (participants.length === 0) return;
        
        // Check if draw already exists for this month
        const drawExists = history.some(h => {
            const d = new Date(h.draw_period);
            return d.getMonth() === parseInt(month) && d.getFullYear() === parseInt(year);
        });

        if (drawExists) {
            toast({ 
                title: "Draw Already Conducted", 
                description: "A lucky draw has already been done for this month.", 
                variant: "destructive" 
            });
            return;
        }

        setIsSpinning(true);
        
        // Simulate spinning effect
        let spinInterval: NodeJS.Timeout;
        let counter = 0;
        const spinDuration = 3000; // 3 seconds
        
        // Visual spin
        spinInterval = setInterval(() => {
            const randomIndex = Math.floor(Math.random() * participants.length);
            setWinner(participants[randomIndex]);
            counter += 100;
        }, 100);

        // Actual selection and save
        setTimeout(async () => {
            clearInterval(spinInterval);
            const finalWinnerIndex = Math.floor(Math.random() * participants.length);
            const finalWinner = participants[finalWinnerIndex];
            setWinner(finalWinner);
            
            try {
                const savedDraw = await saveLuckyDrawWinner(
                    shopId, 
                    parseInt(month) + 1, 
                    parseInt(year), 
                    finalWinner.enrollmentId, 
                    prize
                );
                
                // Update history locally
                setHistory([
                    {
                        ...savedDraw,
                        enrollment: {
                            account_number: finalWinner.accountNumber,
                            customer: { name: finalWinner.customerName },
                            scheme: { name: finalWinner.schemeName }
                        }
                    },
                    ...history
                ]);
                
                setShowWinnerModal(true);
                toast({ title: "Winner Selected!", description: `${finalWinner.customerName} won the lucky draw!` });
            } catch (error: any) {
                toast({ title: "Error", description: error.message, variant: "destructive" });
                setWinner(null);
            } finally {
                setIsSpinning(false);
            }
        }, spinDuration);
    };

    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const years = [2024, 2025, 2026];

    return (
        <MotionWrapper className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Sparkles className="h-6 w-6 text-amber-500" />
                        Monthly Lucky Draw
                    </h1>
                    <p className="text-muted-foreground">Reward your loyal customers who pay on time.</p>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                {/* Configuration Card */}
                <Card className="md:col-span-1">
                    <CardHeader>
                        <CardTitle>Draw Settings</CardTitle>
                        <CardDescription>Select period and prize</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Month</label>
                            <Select value={month} onValueChange={setMonth}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {months.map((m, i) => (
                                        <SelectItem key={i} value={i.toString()}>{m}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Year</label>
                            <Select value={year} onValueChange={setYear}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {years.map((y) => (
                                        <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Prize</label>
                            <Input 
                                value={prize} 
                                onChange={(e) => setPrize(e.target.value)} 
                                placeholder="e.g. 1g Gold Coin"
                            />
                        </div>

                        <div className="pt-4">
                            <Button 
                                className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white border-0"
                                size="lg"
                                onClick={handleSpin}
                                disabled={isLoading || participants.length === 0 || isSpinning}
                            >
                                {isSpinning ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Spinning...
                                    </>
                                ) : (
                                    <>
                                        <Gift className="mr-2 h-4 w-4" />
                                        Conduct Draw
                                    </>
                                )}
                            </Button>
                            <p className="text-xs text-center text-muted-foreground mt-2">
                                {participants.length} eligible customers found
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Participants List */}
                <Card className="md:col-span-2 h-[500px] flex flex-col">
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            <span>Eligible Participants</span>
                            <Badge variant="secondary">{participants.length}</Badge>
                        </CardTitle>
                        <CardDescription>Customers who made a payment in {months[parseInt(month)]} {year}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-auto">
                        {isLoading ? (
                            <div className="flex items-center justify-center h-full">
                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                            </div>
                        ) : participants.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-muted-foreground space-y-2">
                                <Users className="h-12 w-12 opacity-20" />
                                <p>No eligible participants found for this period.</p>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Customer</TableHead>
                                        <TableHead>Scheme</TableHead>
                                        <TableHead className="text-right">Paid Amount</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {participants.map((p) => (
                                        <TableRow key={p.enrollmentId} className={isSpinning && winner?.enrollmentId === p.enrollmentId ? "bg-amber-100 dark:bg-amber-900/30 transition-colors duration-100" : ""}>
                                            <TableCell>
                                                <div className="font-medium">{p.customerName}</div>
                                                <div className="text-xs text-muted-foreground font-mono">{p.accountNumber}</div>
                                            </TableCell>
                                            <TableCell>{p.schemeName}</TableCell>
                                            <TableCell className="text-right font-mono">₹{p.totalPaidInMonth.toLocaleString()}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* History Section */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <History className="h-5 w-5" />
                        Draw History
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Period</TableHead>
                                <TableHead>Winner</TableHead>
                                <TableHead>Prize</TableHead>
                                <TableHead>Draw Date</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {history.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                        No past draws found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                history.map((h) => (
                                    <TableRow key={h.id}>
                                        <TableCell className="font-medium">
                                            {format(new Date(h.draw_period), 'MMMM yyyy')}
                                        </TableCell>
                                        <TableCell>
                                            <div className="font-medium">{h.enrollment?.customer?.name}</div>
                                            <div className="text-xs text-muted-foreground">{h.enrollment?.scheme?.name}</div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                                                {h.prize_details}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground text-sm">
                                            {format(new Date(h.created_at), 'dd MMM yyyy')}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Winner Modal */}
            <Dialog open={showWinnerModal} onOpenChange={setShowWinnerModal}>
                <DialogContent className="sm:max-w-md text-center">
                    <DialogHeader>
                        <DialogTitle className="text-center text-2xl font-bold text-amber-600">🎉 We Have a Winner! 🎉</DialogTitle>
                    </DialogHeader>
                    
                    <div className="py-8 flex flex-col items-center justify-center space-y-4">
                        <div className="h-24 w-24 rounded-full bg-amber-100 flex items-center justify-center border-4 border-amber-200">
                            <Trophy className="h-12 w-12 text-amber-600" />
                        </div>
                        
                        <div className="space-y-1">
                            <h2 className="text-3xl font-bold">{winner?.customerName}</h2>
                            <p className="text-muted-foreground font-mono">{winner?.accountNumber}</p>
                        </div>

                        <div className="bg-muted/50 p-4 rounded-lg w-full">
                            <p className="text-sm text-muted-foreground mb-1">Prize Won</p>
                            <p className="text-xl font-bold text-foreground">{prize}</p>
                        </div>
                    </div>

                    <DialogFooter className="sm:justify-center">
                        <Button onClick={() => setShowWinnerModal(false)} className="w-full sm:w-auto">
                            Close & Celebrate
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </MotionWrapper>
    );
}
