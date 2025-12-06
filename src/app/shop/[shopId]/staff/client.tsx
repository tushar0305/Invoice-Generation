/**
 * Staff Client Component
 * Handles interactive UI for staff management
 */

'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader2, UserPlus, Trash2, Shield, User, MoreHorizontal, IndianRupee } from 'lucide-react';
import { format } from 'date-fns';
import { MotionWrapper } from '@/components/ui/motion-wrapper';
import { getRoleBadgeColor } from '@/lib/permissions';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { inviteStaffAction, removeStaffAction, recordPaymentAction, markAttendanceAction, getStaffPayments, getStaffAttendance } from '@/app/actions/staff-actions';
import { formatCurrency } from '@/lib/utils';
import { useActiveShop } from '@/hooks/use-active-shop';

type StaffMember = {
    id: string;
    user_id: string;
    role: 'owner' | 'manager' | 'staff';
    email: string;
    joined_at: string;
    is_active: boolean;
};

type Invitation = {
    id: string;
    email: string;
    role: string;
    status: string;
    created_at: string;
};

type StaffClientProps = {
    initialStaff: StaffMember[];
    initialInvitations: Invitation[];
    shopId: string;
    currentUserId: string;
};

export function StaffClient({
    initialStaff,
    initialInvitations,
    shopId,
    currentUserId
}: StaffClientProps) {
    const router = useRouter();
    const { toast } = useToast();
    const { permissions } = useActiveShop();
    const [isPending, startTransition] = useTransition();

    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
    const [isProfileOpen, setIsProfileOpen] = useState(false);

    // Form State
    const [email, setEmail] = useState('');
    const [role, setRole] = useState<'manager' | 'staff'>('staff');

    // Profile Data State
    const [payments, setPayments] = useState<any[]>([]);
    const [attendance, setAttendance] = useState<any[]>([]);
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentType, setPaymentType] = useState('salary');

    const loadProfileData = async (staffId: string) => {
        try {
            const [paymentsData, attendanceData] = await Promise.all([
                getStaffPayments(shopId, staffId),
                getStaffAttendance(shopId, staffId)
            ]);
            setPayments(paymentsData || []);
            setAttendance(attendanceData || []);
        } catch (error) {
            console.error('Error loading profile data:', error);
        }
    };

    const handleViewProfile = (member: StaffMember) => {
        setSelectedStaff(member);
        setIsProfileOpen(true);
        loadProfileData(member.user_id);
    };

    const handleInviteStaff = async () => {
        if (!email) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please enter an email' });
            return;
        }

        startTransition(async () => {
            const result = await inviteStaffAction({
                email,
                role,
                shopId,
            });

            if (result.success) {
                toast({ title: 'Success', description: 'Invitation sent successfully' });
                setIsCreateOpen(false);
                setEmail('');
                router.refresh();
            } else {
                toast({ variant: 'destructive', title: 'Error', description: result.error });
            }
        });
    };

    const handleRemoveStaff = async (staffId: string) => {
        if (!confirm('Are you sure you want to remove this staff member?')) return;

        startTransition(async () => {
            const result = await removeStaffAction(staffId, shopId);
            if (result.success) {
                toast({ title: 'Success', description: 'Staff member removed' });
                router.refresh();
            } else {
                toast({ variant: 'destructive', title: 'Error', description: result.error });
            }
        });
    };

    const handleRecordPayment = async () => {
        if (!selectedStaff || !paymentAmount) return;

        startTransition(async () => {
            const result = await recordPaymentAction({
                shopId,
                staffUserId: selectedStaff.user_id,
                amount: parseFloat(paymentAmount),
                paymentType: paymentType as any,
                paymentDate: new Date(),
            });

            if (result.success) {
                toast({ title: 'Success', description: 'Payment recorded' });
                setPaymentAmount('');
                loadProfileData(selectedStaff.user_id);
            } else {
                toast({ variant: 'destructive', title: 'Error', description: result.error });
            }
        });
    };

    const handleMarkAttendance = async (status: 'present' | 'absent' | 'half_day') => {
        if (!selectedStaff) return;

        startTransition(async () => {
            const result = await markAttendanceAction({
                shopId,
                staffUserId: selectedStaff.user_id,
                date: new Date(),
                status,
            });

            if (result.success) {
                toast({ title: 'Success', description: 'Attendance marked' });
                loadProfileData(selectedStaff.user_id);
            } else {
                toast({ variant: 'destructive', title: 'Error', description: result.error });
            }
        });
    };

    if (!permissions?.canInviteStaff) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center p-4">
                <Shield className="h-16 w-16 text-muted-foreground mb-4 opacity-50" />
                <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
                <p className="text-muted-foreground max-w-md">
                    You do not have permission to manage staff. Only shop owners can access this page.
                </p>
            </div>
        );
    }

    return (
        <MotionWrapper className="space-y-6 p-6 pb-24 md:pb-6 max-w-[1800px] mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight font-heading text-foreground">Staff Management</h1>
                    <p className="text-muted-foreground mt-1">Manage your team members and their permissions.</p>
                </div>

                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-md">
                            <UserPlus className="mr-2 h-4 w-4" />
                            Invite Staff
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Invite Staff Member</DialogTitle>
                            <DialogDescription>
                                Send an email invitation to join your shop.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="email">Email Address</Label>
                                <Input id="email" type="email" placeholder="john@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="role">Role</Label>
                                <Select value={role} onValueChange={(v: 'manager' | 'staff') => setRole(v)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="manager">Manager (Full Access)</SelectItem>
                                        <SelectItem value="staff">Staff (Limited Access)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3">
                            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                            <Button onClick={handleInviteStaff} disabled={isPending}>
                                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Send Invite
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Pending Invitations */}
            {initialInvitations.length > 0 && (
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-muted-foreground">Pending Invitations</h3>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {initialInvitations.map((invite) => (
                            <Card key={invite.id} className="border border-border shadow-sm bg-card">
                                <CardContent className="p-4 flex justify-between items-center">
                                    <div>
                                        <div className="font-medium">{invite.email}</div>
                                        <div className="text-xs text-muted-foreground capitalize">{invite.role} • {format(new Date(invite.created_at), 'MMM d')}</div>
                                    </div>
                                    <Badge variant="outline" className="text-primary border-primary/30 bg-primary/10">Pending</Badge>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            )}

            <div className="rounded-xl border border-border bg-card shadow-sm overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/50 hover:bg-muted/50">
                            <TableHead>Staff Member</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Joined</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {initialStaff.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-32 text-center">
                                    <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                                        <UserPlus className="h-8 w-8 opacity-50" />
                                        <p>No staff members found</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            initialStaff.map((member) => (
                                <TableRow key={member.id} className="group">
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
                                                {member.email.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-medium text-foreground">{member.email}</span>
                                                <span className="text-xs text-muted-foreground">ID: {member.user_id.slice(0, 8)}</span>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="secondary" className={`${getRoleBadgeColor(member.role)} capitalize`}>
                                            {member.role}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {format(new Date(member.joined_at), 'MMM d, yyyy')}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <div className={`h-2 w-2 rounded-full ${member.is_active ? 'bg-emerald-500' : 'bg-red-500'}`} />
                                            <span className="text-sm text-muted-foreground">{member.is_active ? 'Active' : 'Inactive'}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuItem onClick={() => handleViewProfile(member)}>
                                                    <User className="mr-2 h-4 w-4" />
                                                    View Profile
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                {member.role !== 'owner' && (
                                                    <DropdownMenuItem
                                                        className="text-red-600"
                                                        onClick={() => handleRemoveStaff(member.id)}
                                                    >
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        Remove Staff
                                                    </DropdownMenuItem>
                                                )}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Staff Profile Dialog */}
            <Dialog open={isProfileOpen} onOpenChange={setIsProfileOpen}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Staff Profile</DialogTitle>
                        <DialogDescription>Manage details, salary, and attendance for {selectedStaff?.email}</DialogDescription>
                    </DialogHeader>

                    <Tabs defaultValue="salary" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="salary">Salary & Payments</TabsTrigger>
                            <TabsTrigger value="attendance">Attendance</TabsTrigger>
                        </TabsList>

                        <TabsContent value="salary" className="space-y-4 mt-4">
                            <div className="flex gap-2 items-end border p-4 rounded-lg bg-muted/20">
                                <div className="space-y-2 flex-1">
                                    <Label>Amount</Label>
                                    <Input
                                        type="number"
                                        placeholder="0.00"
                                        value={paymentAmount}
                                        onChange={(e) => setPaymentAmount(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2 w-40">
                                    <Label>Type</Label>
                                    <Select value={paymentType} onValueChange={setPaymentType}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="salary">Salary</SelectItem>
                                            <SelectItem value="bonus">Bonus</SelectItem>
                                            <SelectItem value="advance">Advance</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <Button onClick={handleRecordPayment} disabled={isPending} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                                    <IndianRupee className="mr-2 h-4 w-4" />
                                    Pay
                                </Button>
                            </div>

                            <Card>
                                <CardContent className="p-0">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Date</TableHead>
                                                <TableHead>Type</TableHead>
                                                <TableHead>Amount</TableHead>
                                                <TableHead>Status</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {payments.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No payments recorded</TableCell>
                                                </TableRow>
                                            ) : (
                                                payments.map((payment) => (
                                                    <TableRow key={payment.id}>
                                                        <TableCell>{format(new Date(payment.payment_date), 'MMM d, yyyy')}</TableCell>
                                                        <TableCell className="capitalize">{payment.payment_type}</TableCell>
                                                        <TableCell>{formatCurrency(payment.amount)}</TableCell>
                                                        <TableCell><Badge className="bg-green-500 capitalize">{payment.status}</Badge></TableCell>
                                                    </TableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="attendance" className="space-y-4 mt-4">
                            <div className="flex justify-between items-center">
                                <h3 className="text-lg font-semibold">Today's Attendance</h3>
                                <div className="flex gap-2">
                                    <Button size="sm" variant="outline" onClick={() => handleMarkAttendance('absent')} disabled={isPending}>Mark Absent</Button>
                                    <Button size="sm" variant="outline" onClick={() => handleMarkAttendance('half_day')} disabled={isPending}>Half Day</Button>
                                    <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground" onClick={() => handleMarkAttendance('present')} disabled={isPending}>Mark Present</Button>
                                </div>
                            </div>

                            <Card>
                                <CardContent className="p-0">
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
                                                    <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">No attendance records</TableCell>
                                                </TableRow>
                                            ) : (
                                                attendance.map((record) => (
                                                    <TableRow key={record.id}>
                                                        <TableCell>{format(new Date(record.date), 'MMM d, yyyy')}</TableCell>
                                                        <TableCell>
                                                            <Badge variant={record.status === 'present' ? 'default' : record.status === 'absent' ? 'destructive' : 'secondary'} className="capitalize">
                                                                {record.status.replace('_', ' ')}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell>{record.notes || '-'}</TableCell>
                                                    </TableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </DialogContent>
            </Dialog>
        </MotionWrapper>
    );
}
