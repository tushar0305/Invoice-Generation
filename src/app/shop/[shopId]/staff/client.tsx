/**
 * Staff Client Component
 * Handles interactive UI for staff management
 */

'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
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
import { inviteStaffAction, createStaffAction, removeStaffAction, recordPaymentAction, markAttendanceAction, getStaffPayments, getStaffAttendance } from '@/app/actions/staff-actions';
import { formatCurrency } from '@/lib/utils';
import { useActiveShop } from '@/hooks/use-active-shop';

type StaffMember = {
    id: string;
    user_id: string;
    role: 'owner' | 'manager' | 'staff';
    name: string;
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

    // Form State
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [role, setRole] = useState<'manager' | 'staff'>('staff');

    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const handleCreateStaff = async () => {
        if (!name || !email || !password) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please fill all fields' });
            return;
        }

        if (password.length < 6) {
            toast({ variant: 'destructive', title: 'Error', description: 'Password must be at least 6 characters' });
            return;
        }

        startTransition(async () => {
            const result = await createStaffAction({
                name,
                email,
                password,
                role,
                shopId,
            });

            if (result.success) {
                toast({ title: 'Success', description: 'Staff member created successfully' });
                setIsCreateOpen(false);
                setName('');
                setEmail('');
                setPassword('');
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
        <MotionWrapper className="space-y-6 p-4 md:p-6 pb-24 md:pb-6 max-w-[1800px] mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight font-heading text-foreground">Staff Management</h1>
                    <p className="text-sm md:text-base text-muted-foreground mt-1">Manage your team members and their permissions.</p>
                </div>

                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-md w-full md:w-auto">
                            <UserPlus className="mr-2 h-4 w-4" />
                            Create Staff Account
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-[95vw] sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Add New Staff Member</DialogTitle>
                            <DialogDescription>
                                Create an account for your staff member. They can use these credentials to login.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Full Name</Label>
                                <Input
                                    id="name"
                                    type="text"
                                    placeholder="John Doe"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="email">Email Address</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="staff@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="password">Password</Label>
                                <Input
                                    id="password"
                                    type="text"
                                    placeholder="Set a password (min 6 chars)"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                                <p className="text-xs text-muted-foreground">
                                    You set this password for them.
                                </p>
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
                            <Button onClick={handleCreateStaff} disabled={isPending}>
                                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Create Account
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

            {/* Mobile View (Cards) */}
            <div className="md:hidden space-y-4">
                {initialStaff.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground py-8 border rounded-xl bg-card">
                        <UserPlus className="h-8 w-8 opacity-50" />
                        <p>No staff members found</p>
                    </div>
                ) : (
                    initialStaff.map((member) => (
                        <Card key={member.id} className="border border-border shadow-sm bg-card">
                            <CardContent className="p-4 space-y-4">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium text-lg">
                                            {member.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <div className="font-medium text-foreground">{member.name}</div>
                                            <Badge variant="secondary" className={`${getRoleBadgeColor(member.role)} capitalize mt-1`}>
                                                {member.role}
                                            </Badge>
                                        </div>
                                    </div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                            <DropdownMenuItem asChild>
                                                <Link href={`/shop/${shopId}/staff/${member.user_id}`} className="flex items-center cursor-pointer">
                                                    <User className="mr-2 h-4 w-4" />
                                                    View Profile
                                                </Link>
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
                                </div>

                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <div className="text-muted-foreground mb-1">Joined</div>
                                        <div>{format(new Date(member.joined_at), 'MMM d, yyyy')}</div>
                                    </div>
                                    <div>
                                        <div className="text-muted-foreground mb-1">Status</div>
                                        <div className="flex items-center gap-2">
                                            <div className={`h-2 w-2 rounded-full ${member.is_active ? 'bg-emerald-500' : 'bg-red-500'}`} />
                                            <span>{member.is_active ? 'Active' : 'Inactive'}</span>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            {/* Desktop View (Table) */}
            <div className="hidden md:block rounded-xl border border-border bg-card shadow-sm overflow-x-auto">
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
                                                {member.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-medium text-foreground">{member.name}</span>
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
                                                <DropdownMenuItem asChild>
                                                    <Link href={`/shop/${shopId}/staff/${member.user_id}`} className="flex items-center cursor-pointer">
                                                        <User className="mr-2 h-4 w-4" />
                                                        View Profile
                                                    </Link>
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


        </MotionWrapper>
    );
}
