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
import { Loader2, UserPlus, Trash2, Shield, User, MoreHorizontal, IndianRupee, Users, Briefcase } from 'lucide-react';
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
import { inviteStaffAction, createStaffAction, removeStaffAction, recordPaymentAction, markAttendanceAction, getStaffPayments, getStaffAttendance } from '@/app/actions/staff-actions';
import { formatCurrency, cn } from '@/lib/utils';
import { useActiveShop } from '@/hooks/use-active-shop';
import { motion } from 'framer-motion';

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
        <div className="min-h-screen bg-background relative pb-20">
            <MotionWrapper className="space-y-6 p-4 md:p-6 pb-24 md:pb-6 max-w-[1200px] mx-auto">
                {/* Header Card - Simplified to match Invoice Page cleanliness */}
                <div className="bg-card rounded-3xl border border-border shadow-sm p-5 md:p-8 relative overflow-hidden">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
                                <Users className="h-8 w-8 text-primary" />
                                Staff Management
                            </h1>
                            <p className="text-sm text-muted-foreground mt-1">
                                Manage your team members, roles, and permissions.
                            </p>
                        </div>
                        {permissions?.canInviteStaff && (
                            <div className="flex items-center gap-3 w-full md:w-auto">
                                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                                    <DialogTrigger asChild>
                                        <Button
                                            size="lg"
                                            className="flex-1 md:flex-none h-11 bg-primary hover:bg-primary/90 text-primary-foreground shadow-md shadow-primary/20 rounded-xl font-medium"
                                        >
                                            <UserPlus className="mr-2 h-4 w-4" />
                                            Add Staff Member
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="sm:max-w-[425px] rounded-2xl">
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
                                                    className="rounded-lg"
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
                                                    className="rounded-lg"
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
                                                    className="rounded-lg"
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
                                                    <SelectTrigger className="rounded-lg">
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
                                            <Button variant="outline" className="rounded-lg" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                                            <Button className="rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground" onClick={handleCreateStaff} disabled={isPending}>
                                                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                Create Account
                                            </Button>
                                        </div>
                                    </DialogContent>
                                </Dialog>
                            </div>
                        )}
                    </div>
                </div>

                {/* Pending Invitations */}
                {initialInvitations.length > 0 && (
                    <div className="space-y-3">
                        <h3 className="text-sm font-medium text-muted-foreground px-1">Pending Invitations</h3>
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {initialInvitations.map((invite, idx) => (
                                <motion.div
                                    key={invite.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                >
                                    <Card className="border border-border/50 shadow-sm bg-card/60 backdrop-blur-sm relative overflow-hidden group hover:border-primary/20 transition-colors">
                                        <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
                                            <Briefcase className="w-12 h-12 text-primary" />
                                        </div>
                                        <CardContent className="p-4 flex items-center justify-between relative z-10">
                                            <div className="space-y-1">
                                                <p className="font-medium truncate max-w-[180px]" title={invite.email}>{invite.email}</p>
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="outline" className="capitalize text-xs">{invite.role}</Badge>
                                                    <span className="text-xs text-primary bg-primary/10 px-1.5 py-0.5 rounded-full border border-primary/20">Pending</span>
                                                </div>
                                            </div>
                                            {permissions?.canInviteStaff && ( // Assuming currentUserRole is derived from permissions
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => { /* handleRemove(inv.id, 'invite') */ }}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Staff List */}
                <div className="space-y-4">
                    <div className="hidden md:block rounded-2xl border border-border shadow-sm bg-card overflow-hidden">
                        <Table>
                            <TableHeader className="bg-muted/30">
                                <TableRow className="border-b border-border/50 hover:bg-muted/30">
                                    <TableHead className="w-[300px]">Member</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead>Joined</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {initialStaff.map((member) => (
                                    <TableRow
                                        key={member.id}
                                        className="hover:bg-muted/30 border-b border-border/50 cursor-pointer group transition-colors"
                                        onClick={() => router.push(`/shop/${shopId}/staff/${member.user_id}`)}
                                    >
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-3">
                                                {/* Avatar component is missing, using a placeholder div */}
                                                <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm border border-primary/10">
                                                    {member.name.substring(0, 2).toUpperCase()}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-foreground group-hover:text-primary transition-colors">{member.name}</span>
                                                    <span className="text-xs text-muted-foreground">{member.email}</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={cn(getRoleBadgeColor(member.role), "capitalize border-0 shadow-sm bg-muted/50")}>
                                                {member.role}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground text-sm">
                                            {format(new Date(member.joined_at), 'MMM d, yyyy')}
                                        </TableCell>
                                        <TableCell>
                                            <span className={cn("inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium border", member.is_active ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600" : "border-red-500/30 bg-red-500/10 text-red-600")}>
                                                <span className={cn("h-1.5 w-1.5 rounded-full animate-pulse", member.is_active ? "bg-emerald-500" : "bg-red-500")} />
                                                {member.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-[160px] rounded-xl">
                                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem asChild>
                                                        <Link href={`/shop/${shopId}/staff/${member.user_id}`} className="flex items-center cursor-pointer">
                                                            <User className="mr-2 h-4 w-4" />
                                                            View Profile
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    {permissions?.canInviteStaff && member.role !== 'owner' && ( // Assuming currentUserRole is derived from permissions
                                                        <>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem
                                                                className="text-destructive focus:text-destructive"
                                                                onClick={(e) => { e.stopPropagation(); handleRemoveStaff(member.id); }}
                                                            >
                                                                <Trash2 className="mr-2 h-4 w-4" />
                                                                Remove Staff
                                                            </DropdownMenuItem>
                                                        </>
                                                    )}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {initialStaff.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                                            No staff members found. Add someone to your team!
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Mobile Card View */}
                    <div className="grid grid-cols-1 gap-4 md:hidden">
                        {initialStaff.map((member, idx) => (
                            <motion.div
                                key={member.id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: idx * 0.1 }}
                            >
                                <Card
                                    className="border border-border/50 bg-card/60 backdrop-blur-xl shadow-sm active:scale-[0.98] transition-transform"
                                    onClick={() => router.push(`/shop/${shopId}/staff/${member.user_id}`)}
                                >
                                    <div className="p-4 flex flex-col gap-4">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-lg border border-primary/10">
                                                    {member.name.substring(0, 2).toUpperCase()}
                                                </div>
                                                <div>
                                                    <h4 className="font-semibold text-foreground">{member.name}</h4>
                                                    <p className="text-sm text-muted-foreground">{member.email}</p>
                                                    <Badge variant="secondary" className={cn(getRoleBadgeColor(member.role), "mt-1 capitalize border-0 shadow-sm")}>
                                                        {member.role}
                                                    </Badge>
                                                </div>
                                            </div>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                                    <Button variant="ghost" size="icon" className="-mr-2 h-8 w-8 text-muted-foreground">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="rounded-xl">
                                                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); router.push(`/shop/${shopId}/staff/${member.user_id}`); }}>
                                                        View Profile
                                                    </DropdownMenuItem>
                                                    {permissions?.canInviteStaff && member.role !== 'owner' && (
                                                        <DropdownMenuItem
                                                            className="text-destructive"
                                                            onClick={(e) => { e.stopPropagation(); handleRemoveStaff(member.id); }}
                                                        >
                                                            Remove
                                                        </DropdownMenuItem>
                                                    )}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>

                                        <div className="flex items-center justify-between pt-3 border-t border-border/50">
                                            <span className="text-xs text-muted-foreground">Joined {format(new Date(member.joined_at), 'MMM d, yyyy')}</span>
                                            <div className={cn("flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-lg", member.is_active ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-600")}>
                                                <div className={cn("h-1.5 w-1.5 rounded-full", member.is_active ? "bg-emerald-500" : "bg-red-500")} />
                                                {member.is_active ? 'Active' : 'Inactive'}
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            </motion.div>

                        ))}
                        {initialStaff.length === 0 && (
                            <div className="p-8 text-center border-2 border-dashed border-border/50 rounded-2xl bg-card/30">
                                <Users className="h-10 w-10 mx-auto text-muted-foreground opacity-50 mb-3" />
                                <h3 className="font-medium text-foreground">No staff members</h3>
                                <p className="text-sm text-muted-foreground mt-1">Tap the plus button to add your first team member.</p>
                            </div>
                        )}
                    </div>
                </div>
            </MotionWrapper >
        </div >
    );
}
