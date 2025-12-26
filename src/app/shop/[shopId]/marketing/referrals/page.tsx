import { createClient } from '@/supabase/server';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Share2, Trophy, Users, Coins, Download } from 'lucide-react';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export default async function ReferralDashboardPage({ params }: { params: Promise<{ shopId: string }> }) {
    const { shopId } = await params;
    const supabase = await createClient();

    // Fetch all referrals
    const { data: referrals, error } = await supabase
        .from('customers')
        .select(`
            id, 
            name,
            total_spent, 
            created_at,
            referred_by, 
            referrer:referred_by(id, name, phone, referral_code)
        `)
        .eq('shop_id', shopId)
        .not('referred_by', 'is', null);

    if (error) {
        console.error(error);
        return <div>Error loading referrals</div>;
    }

    // Aggregate Data
    const referrerStats: Record<string, { 
        id: string;
        name: string;
        phone: string;
        code: string;
        referralCount: number;
        totalRevenue: number;
        lastReferralDate: string;
    }> = {};

    let totalRevenueGenerated = 0;

    referrals?.forEach((r: any) => {
        const referrerId = r.referred_by;
        if (!referrerId || !r.referrer) return;

        // Handle array or object response from join
        const referrer = Array.isArray(r.referrer) ? r.referrer[0] : r.referrer;
        if (!referrer) return;

        if (!referrerStats[referrerId]) {
            referrerStats[referrerId] = {
                id: referrer.id,
                name: referrer.name,
                phone: referrer.phone || 'N/A',
                code: referrer.referral_code || 'N/A',
                referralCount: 0,
                totalRevenue: 0,
                lastReferralDate: r.created_at
            };
        }

        referrerStats[referrerId].referralCount++;
        referrerStats[referrerId].totalRevenue += (Number(r.total_spent) || 0);
        
        // Update last referral date if newer
        if (new Date(r.created_at) > new Date(referrerStats[referrerId].lastReferralDate)) {
            referrerStats[referrerId].lastReferralDate = r.created_at;
        }

        totalRevenueGenerated += (Number(r.total_spent) || 0);
    });

    const sortedReferrers = Object.values(referrerStats).sort((a, b) => b.referralCount - a.referralCount);
    const totalReferrals = referrals?.length || 0;

    return (
        <div className="min-h-screen bg-background pb-24 md:pb-8">
            <div className="max-w-6xl mx-auto px-4 md:px-8 py-8 space-y-8">
                
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <Link href={`/shop/${shopId}/dashboard`}>
                                <Button variant="ghost" size="icon" className="-ml-2">
                                    <ArrowLeft className="w-5 h-5" />
                                </Button>
                            </Link>
                            <h1 className="text-2xl font-bold tracking-tight">Referral Dashboard</h1>
                        </div>
                        <p className="text-muted-foreground ml-10">Track your top promoters and reward them.</p>
                    </div>
                    <Button variant="outline" className="gap-2">
                        <Download className="w-4 h-4" /> Export Report
                    </Button>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-950/20 dark:to-slate-950 border-indigo-100 dark:border-indigo-900/30">
                        <CardContent className="p-6 flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Total Referrals</p>
                                <h3 className="text-3xl font-bold mt-2">{totalReferrals}</h3>
                            </div>
                            <div className="h-12 w-12 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                                <Users className="w-6 h-6" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-950/20 dark:to-slate-950 border-emerald-100 dark:border-emerald-900/30">
                        <CardContent className="p-6 flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Revenue Generated</p>
                                <h3 className="text-3xl font-bold mt-2">{formatCurrency(totalRevenueGenerated)}</h3>
                            </div>
                            <div className="h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                                <Coins className="w-6 h-6" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-amber-50 to-white dark:from-amber-950/20 dark:to-slate-950 border-amber-100 dark:border-amber-900/30">
                        <CardContent className="p-6 flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-amber-600 dark:text-amber-400 uppercase tracking-wider">Top Referrer</p>
                                <h3 className="text-xl font-bold mt-2 truncate max-w-[150px]">{sortedReferrers[0]?.name || 'None'}</h3>
                                <p className="text-xs text-muted-foreground mt-1">{sortedReferrers[0]?.referralCount || 0} Invites</p>
                            </div>
                            <div className="h-12 w-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
                                <Trophy className="w-6 h-6" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Top Referrers Table */}
                <Card className="border-none shadow-lg">
                    <CardHeader>
                        <CardTitle>Top Referrers</CardTitle>
                        <CardDescription>Customers who have invited the most people.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Customer</TableHead>
                                    <TableHead>Referral Code</TableHead>
                                    <TableHead className="text-center">Invites</TableHead>
                                    <TableHead className="text-right">Revenue Generated</TableHead>
                                    <TableHead className="text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sortedReferrers.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                                            No referrals yet. Share referral codes with your customers!
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    sortedReferrers.map((referrer) => (
                                        <TableRow key={referrer.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-9 w-9">
                                                        <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                                            {referrer.name.substring(0, 2).toUpperCase()}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <p className="font-medium">{referrer.name}</p>
                                                        <p className="text-xs text-muted-foreground">{referrer.phone}</p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="font-mono">
                                                    {referrer.code}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">
                                                    {referrer.referralCount}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right font-medium">
                                                {formatCurrency(referrer.totalRevenue)}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="sm" className="text-primary">
                                                    View Details
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
