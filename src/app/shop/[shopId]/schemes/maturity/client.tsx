'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { 
    BarChart, 
    Bar, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    ResponsiveContainer,
    Cell
} from 'recharts';
import { 
    CalendarClock, 
    Coins, 
    TrendingUp, 
    AlertTriangle, 
    MessageCircle, 
    ArrowUpRight,
    Download
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import { MotionWrapper } from '@/components/ui/motion-wrapper';
import type { MaturityForecastItem, MaturitySummary } from '@/actions/scheme-analytics-actions';

interface MaturityForecastClientProps {
    forecast: MaturityForecastItem[];
    summary: MaturitySummary;
    shopId: string;
}

export function MaturityForecastClient({ forecast, summary, shopId }: MaturityForecastClientProps) {
    const [filter, setFilter] = useState<'ALL' | 'GOLD' | 'CASH'>('ALL');

    // Prepare chart data
    const chartData = Object.entries(summary.monthlyBreakdown).map(([month, value]) => ({
        month,
        value
    }));

    const filteredForecast = forecast.filter(item => {
        if (filter === 'GOLD') return item.type === 'WEIGHT_ACCUMULATION';
        if (filter === 'CASH') return item.type !== 'WEIGHT_ACCUMULATION';
        return true;
    });

    const handleNotify = (phone: string, customerName: string, schemeName: string, date: string) => {
        const msg = `Hello ${customerName}, your scheme "${schemeName}" is maturing on ${format(new Date(date), 'dd MMM yyyy')}. Please visit our store to redeem your savings!`;
        window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
    };

    return (
        <MotionWrapper className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <CalendarClock className="h-6 w-6 text-blue-600" />
                        Maturity Forecast
                    </h1>
                    <p className="text-muted-foreground">Plan your inventory and cash flow for upcoming redemptions.</p>
                </div>
                <Button variant="outline" className="gap-2">
                    <Download className="h-4 w-4" /> Export Report
                </Button>
            </div>

            {/* KPI Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-100 dark:border-blue-900">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-100 dark:bg-blue-900/50 rounded-xl text-blue-600 dark:text-blue-400">
                                <CalendarClock className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Maturing Soon (6 Mo)</p>
                                <h3 className="text-2xl font-bold">{summary.totalCount} Schemes</h3>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border-amber-100 dark:border-amber-900">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-amber-100 dark:bg-amber-900/50 rounded-xl text-amber-600 dark:text-amber-400">
                                <Coins className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Gold Liability</p>
                                <h3 className="text-2xl font-bold">{summary.totalGoldWeight.toFixed(3)}g</h3>
                                <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 flex items-center">
                                    <AlertTriangle className="h-3 w-3 mr-1" /> Stock up required
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/30 border-emerald-100 dark:border-emerald-900">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-emerald-100 dark:bg-emerald-900/50 rounded-xl text-emerald-600 dark:text-emerald-400">
                                <TrendingUp className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Est. Cash Payout</p>
                                <h3 className="text-2xl font-bold">{formatCurrency(summary.totalCashLiability)}</h3>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                {/* Chart Section */}
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle>Payout Timeline</CardTitle>
                        <CardDescription>Estimated value of maturing schemes by month</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                                <XAxis 
                                    dataKey="month" 
                                    stroke="hsl(var(--muted-foreground))" 
                                    fontSize={12} 
                                    tickLine={false} 
                                    axisLine={false} 
                                />
                                <YAxis 
                                    stroke="hsl(var(--muted-foreground))" 
                                    fontSize={12} 
                                    tickLine={false} 
                                    axisLine={false}
                                    tickFormatter={(value) => `₹${value / 1000}k`}
                                />
                                <Tooltip 
                                    cursor={{ fill: 'hsl(var(--muted)/0.2)' }}
                                    contentStyle={{ 
                                        backgroundColor: 'hsl(var(--card))', 
                                        borderColor: 'hsl(var(--border))',
                                        borderRadius: '8px'
                                    }}
                                    formatter={(value: number) => [formatCurrency(value), 'Est. Value']}
                                />
                                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={index % 2 === 0 ? 'hsl(var(--primary))' : 'hsl(var(--primary)/0.7)'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Recommendations */}
                <Card>
                    <CardHeader>
                        <CardTitle>Smart Insights</CardTitle>
                        <CardDescription>AI-driven recommendations</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20 rounded-lg">
                            <h4 className="font-semibold text-amber-800 dark:text-amber-400 mb-1 flex items-center gap-2">
                                <Coins className="h-4 w-4" /> Inventory Alert
                            </h4>
                            <p className="text-sm text-amber-700 dark:text-amber-300/80">
                                You have <strong>{summary.totalGoldWeight.toFixed(0)}g</strong> of gold liability maturing soon. Ensure you have sufficient stock of lightweight jewellery.
                            </p>
                        </div>
                        
                        <div className="p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/20 rounded-lg">
                            <h4 className="font-semibold text-blue-800 dark:text-blue-400 mb-1 flex items-center gap-2">
                                <MessageCircle className="h-4 w-4" /> Engagement
                            </h4>
                            <p className="text-sm text-blue-700 dark:text-blue-300/80">
                                <strong>{summary.totalCount} customers</strong> are completing their schemes. Send them a catalogue of new designs to ensure they redeem immediately.
                            </p>
                            <Button size="sm" variant="link" className="px-0 text-blue-600 h-auto mt-2">
                                Send Catalogue Blast <ArrowUpRight className="h-3 w-3 ml-1" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Detailed List */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Upcoming Maturities</CardTitle>
                            <CardDescription>Detailed list of maturing schemes</CardDescription>
                        </div>
                        <div className="flex gap-2">
                            <Button 
                                variant={filter === 'ALL' ? 'default' : 'outline'} 
                                size="sm" 
                                onClick={() => setFilter('ALL')}
                            >
                                All
                            </Button>
                            <Button 
                                variant={filter === 'GOLD' ? 'default' : 'outline'} 
                                size="sm" 
                                onClick={() => setFilter('GOLD')}
                            >
                                Gold
                            </Button>
                            <Button 
                                variant={filter === 'CASH' ? 'default' : 'outline'} 
                                size="sm" 
                                onClick={() => setFilter('CASH')}
                            >
                                Cash
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Customer</TableHead>
                                <TableHead>Scheme</TableHead>
                                <TableHead className="text-right">Accumulated</TableHead>
                                <TableHead className="text-right">Est. Value</TableHead>
                                <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredForecast.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                        No schemes found matching your filter.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredForecast.map((item) => (
                                    <TableRow key={item.enrollmentId}>
                                        <TableCell className="font-medium">
                                            {format(new Date(item.maturityDate), 'dd MMM yyyy')}
                                        </TableCell>
                                        <TableCell>
                                            <div className="font-medium">{item.customerName}</div>
                                            <div className="text-xs text-muted-foreground">{item.customerPhone}</div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{item.schemeName}</Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {item.type === 'WEIGHT_ACCUMULATION' ? (
                                                <span className="font-bold text-amber-600">{item.accumulatedWeight.toFixed(3)}g</span>
                                            ) : (
                                                <span className="font-medium">{formatCurrency(item.totalPaid)}</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right text-muted-foreground">
                                            ~{formatCurrency(item.expectedPayoutValue)}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button 
                                                size="sm" 
                                                variant="ghost" 
                                                className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                                                onClick={() => handleNotify(item.customerPhone, item.customerName, item.schemeName, item.maturityDate)}
                                            >
                                                <MessageCircle className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </MotionWrapper>
    );
}
