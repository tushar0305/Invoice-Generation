/**
 * Staff Details Client Component
 * Handles interactive UI for staff profile, payments, and attendance
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Calendar } from '@/components/ui/calendar';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency, cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ArrowLeft, IndianRupee, Calendar as CalendarIcon, Clock, CheckCircle2, XCircle, AlertCircle, Briefcase, User, Wallet } from 'lucide-react';
import { recordPaymentAction, markAttendanceAction } from '@/app/actions/staff-actions';
import { motion } from 'framer-motion';
import { MotionWrapper } from '@/components/ui/motion-wrapper';

type StaffDetailsProps = {
    shopId: string;
    staff: {
        id: string;
        user_id: string;
        role: string;
        name: string;
        email: string;
        joined_at: string;
        is_active: boolean;
    };
    payments: any[];
    attendance: any[];
    currentUserRole: string;
};

export function StaffDetailsClient({
    shopId,
    staff,
    payments: initialPayments,
    attendance: initialAttendance,
    currentUserRole
}: StaffDetailsProps) {
    const router = useRouter();
    const { toast } = useToast();

    const [payments, setPayments] = useState(initialPayments);
    const [attendance, setAttendance] = useState(initialAttendance);

    useEffect(() => {
        setPayments(initialPayments);
    }, [initialPayments]);

    useEffect(() => {
        setAttendance(initialAttendance);
    }, [initialAttendance]);

    const [isPaymentOpen, setIsPaymentOpen] = useState(false);
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentType, setPaymentType] = useState('salary');
    const [paymentNotes, setPaymentNotes] = useState('');
    const [paymentDate, setPaymentDate] = useState<Date | undefined>(new Date());

    const [isAttendanceOpen, setIsAttendanceOpen] = useState(false);
    const [attendanceStatus, setAttendanceStatus] = useState('present');
    const [attendanceNotes, setAttendanceNotes] = useState('');
    const [attendanceDate, setAttendanceDate] = useState<Date | undefined>(new Date());

    const handleRecordPayment = async () => {
        if (!paymentAmount || !paymentDate) return;

        const result = await recordPaymentAction({
            shopId,
            staffUserId: staff.user_id,
            amount: Number(paymentAmount),
            paymentType: paymentType as any,
            notes: paymentNotes,
            paymentDate: paymentDate,
        });

        if (result.success) {
            toast({ title: 'Payment recorded successfully' });
            setIsPaymentOpen(false);
            setPaymentAmount('');
            setPaymentNotes('');
            router.refresh();
        } else {
            toast({ title: 'Failed to record payment', description: result.error, variant: 'destructive' });
        }
    };

    const handleMarkAttendance = async () => {
        if (!attendanceDate) return;

        const result = await markAttendanceAction({
            shopId,
            staffUserId: staff.user_id,
            date: attendanceDate,
            status: attendanceStatus as any,
            notes: attendanceNotes,
        });

        if (result.success) {
            toast({ title: 'Attendance marked successfully' });
            setIsAttendanceOpen(false);
            setAttendanceNotes('');
            router.refresh();
        } else {
            toast({ title: 'Failed to mark attendance', description: result.error, variant: 'destructive' });
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'present': return 'text-green-600 bg-green-100';
            case 'absent': return 'text-red-600 bg-red-100';
            case 'half_day': return 'text-orange-600 bg-orange-100';
            case 'leave': return 'text-blue-600 bg-blue-100';
            default: return 'text-gray-600 bg-gray-100';
        }
    };

    return (
        <div className="min-h-screen bg-background relative pb-20">
            <MotionWrapper className="space-y-6 p-4 md:p-6 pb-24 md:pb-6 max-w-[1200px] mx-auto">
                {/* Header Card */}
                <div className="bg-card rounded-3xl border border-border shadow-sm p-5 md:p-8 relative overflow-hidden">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
                        <div className="flex items-center gap-4">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="shrink-0 h-10 w-10 rounded-xl bg-muted/50 hover:bg-muted"
                                onClick={() => router.back()}
                            >
                                <ArrowLeft className="h-5 w-5" />
                            </Button>
                            <div>
                                <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
                                    {staff.name}
                                    <Badge variant={staff.role === 'owner' ? 'default' : 'secondary'} className="ml-2 capitalize">
                                        {staff.role}
                                    </Badge>
                                </h1>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                    <User className="h-3.5 w-3.5" />
                                    <span>Joined {format(new Date(staff.joined_at), 'MMM d, yyyy')}</span>
                                    <span className="hidden sm:inline">•</span>
                                    <span className={cn("text-xs px-2 py-0.5 rounded-full border", staff.is_active ? "border-emerald-500/30 text-emerald-600 bg-emerald-500/10" : "border-red-500/30 text-red-600 bg-red-500/10")}>
                                        {staff.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {currentUserRole === 'owner' && (
                            <div className="flex flex-wrap gap-2 w-full md:w-auto">
                                <Dialog open={isAttendanceOpen} onOpenChange={setIsAttendanceOpen}>
                                    <DialogTrigger asChild>
                                        <Button variant="outline" className="flex-1 md:flex-none border-primary/20 hover:bg-primary/5 hover:text-primary hover:border-primary/50">
                                            <Clock className="mr-2 h-4 w-4" />
                                            Attendance
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="rounded-2xl">
                                        <DialogHeader>
                                            <DialogTitle>Mark Attendance</DialogTitle>
                                            <DialogDescription>Record attendance for {staff.name}</DialogDescription>
                                        </DialogHeader>
                                        <div className="space-y-4 py-4">
                                            <div className="space-y-2">
                                                <Label>Date</Label>
                                                <div className="border rounded-md p-2">
                                                    <Calendar
                                                        mode="single"
                                                        selected={attendanceDate}
                                                        onSelect={setAttendanceDate}
                                                        initialFocus
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Status</Label>
                                                <Select value={attendanceStatus} onValueChange={setAttendanceStatus}>
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="present">Present</SelectItem>
                                                        <SelectItem value="absent">Absent</SelectItem>
                                                        <SelectItem value="half_day">Half Day</SelectItem>
                                                        <SelectItem value="leave">Leave</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Notes</Label>
                                                <Textarea
                                                    value={attendanceNotes}
                                                    onChange={(e) => setAttendanceNotes(e.target.value)}
                                                    placeholder="Optional notes..."
                                                />
                                            </div>
                                            <Button onClick={handleMarkAttendance} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">Save Attendance</Button>
                                        </div>
                                    </DialogContent>
                                </Dialog>

                                <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
                                    <DialogTrigger asChild>
                                        <Button className="flex-1 md:flex-none bg-primary hover:bg-primary/90 text-primary-foreground shadow-md shadow-primary/20 border-0">
                                            <IndianRupee className="mr-2 h-4 w-4" />
                                            Payment
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="rounded-2xl">
                                        <DialogHeader>
                                            <DialogTitle>Record Payment</DialogTitle>
                                            <DialogDescription>Add a salary or bonus payment for {staff.name}</DialogDescription>
                                        </DialogHeader>
                                        <div className="space-y-4 py-4">
                                            <div className="space-y-2">
                                                <Label>Amount (₹)</Label>
                                                <Input
                                                    type="number"
                                                    value={paymentAmount}
                                                    onChange={(e) => setPaymentAmount(e.target.value)}
                                                    placeholder="0.00"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Type</Label>
                                                <Select value={paymentType} onValueChange={setPaymentType}>
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="salary">Salary</SelectItem>
                                                        <SelectItem value="bonus">Bonus</SelectItem>
                                                        <SelectItem value="advance">Advance</SelectItem>
                                                        <SelectItem value="commission">Commission</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Date</Label>
                                                <div className="border rounded-md p-2">
                                                    <Calendar
                                                        mode="single"
                                                        selected={paymentDate}
                                                        onSelect={setPaymentDate}
                                                        initialFocus
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Notes</Label>
                                                <Textarea
                                                    value={paymentNotes}
                                                    onChange={(e) => setPaymentNotes(e.target.value)}
                                                    placeholder="Optional notes..."
                                                />
                                            </div>
                                            <Button onClick={handleRecordPayment} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">Record Payment</Button>
                                        </div>
                                    </DialogContent>
                                </Dialog>
                            </div>
                        )}
                    </div>
                </div>

                {/* Content Tabs */}
                <Tabs defaultValue="overview" className="w-full">
                    <TabsList className="bg-muted/50 p-1 rounded-xl w-full sm:w-auto overflow-x-auto flex-nowrap justify-start mb-6">
                        <TabsTrigger value="overview" className="rounded-lg data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">Overview</TabsTrigger>
                        <TabsTrigger value="payments" className="rounded-lg data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">Payments</TabsTrigger>
                        <TabsTrigger value="attendance" className="rounded-lg data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">Attendance</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="space-y-6">
                        <div className="grid gap-6 md:grid-cols-3">
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                                <Card className="border border-border shadow-sm bg-card overflow-hidden h-full">
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Paid (Year)</CardTitle>
                                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                            <IndianRupee className="h-4 w-4 text-primary" />
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold text-foreground">
                                            {formatCurrency(payments.reduce((sum, p) => sum + Number(p.amount), 0))}
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1">Salary & Bonuses</p>
                                    </CardContent>
                                </Card>
                            </motion.div>

                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                                <Card className="border border-border shadow-sm bg-card overflow-hidden h-full">
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium text-muted-foreground">Attendance Rate</CardTitle>
                                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                            <CheckCircle2 className="h-4 w-4 text-primary" />
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold text-foreground">
                                            {attendance.length > 0
                                                ? Math.round((attendance.filter(a => a.status === 'present').length / attendance.length) * 100)
                                                : 0}%
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1">Last 30 days performance</p>
                                    </CardContent>
                                </Card>
                            </motion.div>

                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                                <Card className="border border-border shadow-sm bg-card overflow-hidden h-full">
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium text-muted-foreground">Last Payment</CardTitle>
                                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                            <Clock className="h-4 w-4 text-primary" />
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold text-foreground">
                                            {payments.length > 0
                                                ? formatCurrency(Number(payments[0].amount))
                                                : '₹0'}
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {payments.length > 0
                                                ? format(new Date(payments[0].payment_date), 'MMM d, yyyy')
                                                : 'No payments yet'}
                                        </p>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        </div>
                    </TabsContent>

                    <TabsContent value="payments">
                        <Card className="border border-border/50 bg-card shadow-sm">
                            <CardHeader className="pb-3 border-b border-border/50">
                                <CardTitle className="text-lg">Payment History</CardTitle>
                                <CardDescription className="text-xs md:text-sm">All salary, bonus, and advance payments.</CardDescription>
                            </CardHeader>
                            <CardContent className="p-0">
                                {/* Mobile View */}
                                <div className="md:hidden divide-y divide-border/50">
                                    {payments.length === 0 ? (
                                        <div className="text-center py-8 text-muted-foreground px-4">
                                            No payments recorded yet.
                                        </div>
                                    ) : (
                                        payments.map((payment) => (
                                            <div key={payment.id} className="p-4 space-y-1">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <span className="font-medium text-foreground">{formatCurrency(payment.amount)}</span>
                                                        <Badge variant="outline" className="ml-2 capitalize text-xs bg-muted/50 border-0">{payment.payment_type}</Badge>
                                                    </div>
                                                    <span className="text-xs text-muted-foreground">{format(new Date(payment.payment_date), 'MMM d')}</span>
                                                </div>
                                                {payment.description && (
                                                    <p className="text-xs text-muted-foreground">{payment.description}</p>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>
                                {/* Desktop View */}
                                <div className="hidden md:block">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="hover:bg-muted/30 border-b border-border/50">
                                                <TableHead>Date</TableHead>
                                                <TableHead>Type</TableHead>
                                                <TableHead>Amount</TableHead>
                                                <TableHead>Notes</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {payments.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                                        No payments recorded yet.
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                payments.map((payment) => (
                                                    <TableRow key={payment.id} className="hover:bg-muted/30 border-b border-border/30">
                                                        <TableCell>{format(new Date(payment.payment_date), 'MMM d, yyyy')}</TableCell>
                                                        <TableCell>
                                                            <Badge variant="secondary" className="capitalize">
                                                                {payment.payment_type}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="font-medium">{formatCurrency(payment.amount)}</TableCell>
                                                        <TableCell className="text-muted-foreground">{payment.description || '-'}</TableCell>
                                                    </TableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="attendance">
                        <Card className="border border-border/50 bg-card shadow-sm">
                            <CardHeader className="pb-3 border-b border-border/50">
                                <CardTitle className="text-lg">Attendance Log</CardTitle>
                                <CardDescription className="text-xs md:text-sm">Attendance records for the last 30 days.</CardDescription>
                            </CardHeader>
                            <CardContent className="p-0">
                                {/* Mobile View */}
                                <div className="md:hidden divide-y divide-border/50">
                                    {attendance.length === 0 ? (
                                        <div className="text-center py-8 text-muted-foreground px-4">
                                            No attendance records found.
                                        </div>
                                    ) : (
                                        attendance.map((record) => (
                                            <div key={record.id} className="p-4 flex justify-between items-center">
                                                <div className="flex items-center gap-3">
                                                    <Badge variant="outline" className={cn(getStatusColor(record.status), "text-xs border-0")}>
                                                        {record.status.replace('_', ' ').toUpperCase()}
                                                    </Badge>
                                                    {record.notes && (
                                                        <span className="text-xs text-muted-foreground truncate max-w-[120px]">{record.notes}</span>
                                                    )}
                                                </div>
                                                <span className="text-xs text-muted-foreground shrink-0">{format(new Date(record.date), 'MMM d')}</span>
                                            </div>
                                        ))
                                    )}
                                </div>
                                {/* Desktop View */}
                                <div className="hidden md:block">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="hover:bg-muted/30 border-b border-border/50">
                                                <TableHead>Date</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead>Notes</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {attendance.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                                                        No attendance records found.
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                attendance.map((record) => (
                                                    <TableRow key={record.id} className="hover:bg-muted/30 border-b border-border/30">
                                                        <TableCell>{format(new Date(record.date), 'MMM d, yyyy')}</TableCell>
                                                        <TableCell>
                                                            <Badge variant="outline" className={cn(getStatusColor(record.status), "border-0 shadow-sm")}>
                                                                {record.status.replace('_', ' ').toUpperCase()}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="text-muted-foreground">{record.notes || '-'}</TableCell>
                                                    </TableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </MotionWrapper>
        </div>
    );
}
