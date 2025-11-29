'use client';

import { useState, useEffect, useTransition } from 'react';
import { useActiveShop } from '@/hooks/use-active-shop';
import { supabase } from '@/supabase/client';
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
import { Loader2, UserPlus, Trash2, Shield, Eye, EyeOff, MoreHorizontal, Calendar, IndianRupee, User, Mail } from 'lucide-react';
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { inviteStaffAction, removeStaffAction, recordPaymentAction, markAttendanceAction, getStaffPayments, getStaffAttendance } from '@/app/actions/staff-actions';
import { formatCurrency } from '@/lib/utils';

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

export default function StaffPage() {
    const { activeShop, permissions, userRole, isLoading: shopLoading } = useActiveShop();
    const { toast } = useToast();
    const [staff, setStaff] = useState<StaffMember[]>([]);
    const [invitations, setInvitations] = useState<Invitation[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isPending, startTransition] = useTransition();
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

    const loadData = async () => {
        if (!activeShop?.id) return;

        try {
            setIsLoading(true);

            // Fetch Staff
            const { data: staffData, error: staffError } = await supabase
                .from('user_shop_roles')
                .select('*')
                .eq('shop_id', activeShop.id)
                .order('created_at', { ascending: true });

            if (staffError) throw staffError;

            // Fetch Invitations
            const { data: inviteData, error: inviteError } = await supabase
                .from('shop_invitations')
                .select('*')
                .eq('shop_id', activeShop.id)
                .eq('status', 'pending');

            if (inviteError && inviteError.code !== '42P01') { // Ignore if table doesn't exist yet (during migration)
                console.error('Error fetching invitations:', inviteError);
            }

            const mappedStaff: StaffMember[] = staffData.map((r: any) => ({
                id: r.id,
                user_id: r.user_id,
                role: r.role,
                email: r.user_id === userRole?.userId ? 'You' : `User ${r.user_id.slice(0, 8)}...`, // We need a way to get emails, maybe via a view or RPC
                joined_at: r.accepted_at || r.created_at,
                is_active: r.is_active,
            }));

            setStaff(mappedStaff);
            setInvitations(inviteData || []);
        } catch (error) {
            console.error('Error loading data:', error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to load staff list',
            });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [activeShop?.id]);

    const loadProfileData = async (staffId: string) => {
        if (!activeShop?.id) return;
        try {
            const [paymentsData, attendanceData] = await Promise.all([
                getStaffPayments(activeShop.id, staffId),
                getStaffAttendance(activeShop.id, staffId)
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
        if (!activeShop?.id) return;
        if (!email) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please enter an email' });
            return;
        }

        startTransition(async () => {
            const result = await inviteStaffAction({
                email,
                role,
                shopId: activeShop.id,
            });

            if (result.success) {
                toast({ title: 'Success', description: 'Invitation sent successfully' });
                setIsCreateOpen(false);
                setEmail('');
                loadData();
            } else {
                toast({ variant: 'destructive', title: 'Error', description: result.error });
            }
        });
    };

    const handleRemoveStaff = async (staffId: string) => {
        if (!activeShop?.id) return;
        if (!confirm('Are you sure you want to remove this staff member?')) return;

        startTransition(async () => {
            const result = await removeStaffAction(staffId, activeShop.id);
            if (result.success) {
                toast({ title: 'Success', description: 'Staff member removed' });
                loadData();
            } else {
                toast({ variant: 'destructive', title: 'Error', description: result.error });
            }
        });
    };

    const handleRecordPayment = async () => {
        if (!activeShop?.id || !selectedStaff) return;
        if (!paymentAmount) return;

        startTransition(async () => {
            const result = await recordPaymentAction({
                shopId: activeShop.id,
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
        if (!activeShop?.id || !selectedStaff) return;

        startTransition(async () => {
            const result = await markAttendanceAction({
                shopId: activeShop.id,
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

    if (shopLoading || (isLoading && !staff.length)) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!permissions.canInviteStaff) {
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
        <MotionWrapper className="space-y-6 p-6 pb-24 md:pb-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight font-heading text-foreground">Staff Management</h1>
                    <p className="text-muted-foreground mt-1">Manage your team members and their permissions.</p>
                </div>

                {permissions.canInviteStaff && (
                    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-gold-500 hover:bg-gold-600 text-white shadow-gold-sm">
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
                )}
            </div>

            {/* Pending Invitations */}
            {invitations.length > 0 && (
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-muted-foreground">Pending Invitations</h3>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {invitations.map((invite) => (
                            <Card key={invite.id} className="glass-card border-l-4 border-l-amber-500">
                                <CardContent className="p-4 flex justify-between items-center">
                                    <div>
                                        <div className="font-medium">{invite.email}</div>
                                        <div className="text-xs text-muted-foreground capitalize">{invite.role} • {format(new Date(invite.created_at), 'MMM d')}</div>
                                    </div>
                                    <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50">Pending</Badge>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            )}

            <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
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
                        {staff.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-32 text-center">
                                    <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                                        <UserPlus className="h-8 w-8 opacity-50" />
                                        <p>No staff members found</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            staff.map((member) => (
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
                                <Button onClick={handleRecordPayment} disabled={isPending} className="bg-green-600 hover:bg-green-700 text-white">
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
                                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => handleMarkAttendance('present')} disabled={isPending}>Mark Present</Button>
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
