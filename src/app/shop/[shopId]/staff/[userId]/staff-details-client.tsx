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
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { ArrowLeft, IndianRupee, Calendar as CalendarIcon, Clock, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { recordPaymentAction, markAttendanceAction } from '@/app/actions/staff-actions';

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
        <div className="space-y-6 p-4 md:p-6 pb-24 md:pb-6 max-w-[1200px] mx-auto">
            {/* Header */}
            <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" className="shrink-0" onClick={() => router.back()}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div className="flex-1 min-w-0">
                        <h1 className="text-xl md:text-2xl font-bold tracking-tight truncate">{staff.name}</h1>
                        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                            <Badge variant={staff.role === 'owner' ? 'default' : 'secondary'} className="shrink-0">
                                {staff.role.toUpperCase()}
                            </Badge>
                            <span className="hidden sm:inline">•</span>
                            <span className="text-xs md:text-sm">Joined {format(new Date(staff.joined_at), 'MMM d, yyyy')}</span>
                        </div>
                    </div>
                </div>

                {currentUserRole === 'owner' && (
                    <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                        <Dialog open={isAttendanceOpen} onOpenChange={setIsAttendanceOpen}>
                            <DialogTrigger asChild>
                                <Button variant="outline" className="flex-1 sm:flex-none text-sm">
                                    <Clock className="mr-2 h-4 w-4" />
                                    Attendance
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-[95vw] sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
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
                                    <Button onClick={handleMarkAttendance} className="w-full">Save Attendance</Button>
                                </div>
                            </DialogContent>
                        </Dialog>

                        <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
                            <DialogTrigger asChild>
                                <Button className="flex-1 sm:flex-none text-sm">
                                    <IndianRupee className="mr-2 h-4 w-4" />
                                    Payment
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-[95vw] sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
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
                                    <Button onClick={handleRecordPayment} className="w-full">Record Payment</Button>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>
                )}
            </div>

            {/* Content Tabs */}
            <Tabs defaultValue="overview" className="w-full">
                <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
                    <TabsList className="w-full sm:w-auto inline-flex">
                        <TabsTrigger value="overview" className="flex-1 sm:flex-none text-xs sm:text-sm">Overview</TabsTrigger>
                        <TabsTrigger value="payments" className="flex-1 sm:flex-none text-xs sm:text-sm">Payments</TabsTrigger>
                        <TabsTrigger value="attendance" className="flex-1 sm:flex-none text-xs sm:text-sm">Attendance</TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="overview" className="space-y-4 mt-4">
                    <div className="grid gap-4 md:grid-cols-3">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Paid (This Year)</CardTitle>
                                <IndianRupee className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {formatCurrency(payments.reduce((sum, p) => sum + Number(p.amount), 0))}
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
                                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {attendance.length > 0
                                        ? Math.round((attendance.filter(a => a.status === 'present').length / attendance.length) * 100)
                                        : 0}%
                                </div>
                                <p className="text-xs text-muted-foreground">Last 30 days</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Last Payment</CardTitle>
                                <Clock className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {payments.length > 0
                                        ? formatCurrency(Number(payments[0].amount))
                                        : '₹0'}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    {payments.length > 0
                                        ? format(new Date(payments[0].payment_date), 'MMM d, yyyy')
                                        : 'No payments yet'}
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="payments" className="mt-4">
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg">Payment History</CardTitle>
                            <CardDescription className="text-xs md:text-sm">All salary, bonus, and advance payments.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0 md:p-6">
                            {/* Mobile View */}
                            <div className="md:hidden divide-y">
                                {payments.length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground px-4">
                                        No payments recorded yet.
                                    </div>
                                ) : (
                                    payments.map((payment) => (
                                        <div key={payment.id} className="p-4 space-y-1">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <span className="font-medium">{formatCurrency(payment.amount)}</span>
                                                    <Badge variant="outline" className="ml-2 capitalize text-xs">{payment.payment_type}</Badge>
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
                                        <TableRow>
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
                                                <TableRow key={payment.id}>
                                                    <TableCell>{format(new Date(payment.payment_date), 'MMM d, yyyy')}</TableCell>
                                                    <TableCell className="capitalize">{payment.payment_type}</TableCell>
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

                <TabsContent value="attendance" className="mt-4">
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg">Attendance Log</CardTitle>
                            <CardDescription className="text-xs md:text-sm">Attendance records for the last 30 days.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0 md:p-6">
                            {/* Mobile View */}
                            <div className="md:hidden divide-y">
                                {attendance.length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground px-4">
                                        No attendance records found.
                                    </div>
                                ) : (
                                    attendance.map((record) => (
                                        <div key={record.id} className="p-4 flex justify-between items-center">
                                            <div className="flex items-center gap-3">
                                                <Badge variant="outline" className={`${getStatusColor(record.status)} text-xs`}>
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
                                        <TableRow>
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
                                                <TableRow key={record.id}>
                                                    <TableCell>{format(new Date(record.date), 'MMM d, yyyy')}</TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline" className={getStatusColor(record.status)}>
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
        </div>
    );
}
