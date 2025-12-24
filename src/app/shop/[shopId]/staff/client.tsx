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
import { Loader2, UserPlus, Trash2, Shield, MoreHorizontal, Briefcase } from 'lucide-react';
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createStaffAction, removeStaffAction } from '@/app/actions/staff-actions';
import { cn } from '@/lib/utils';
import { useActiveShop } from '@/hooks/use-active-shop';
import { motion } from 'framer-motion';
import { StaffHeader } from '@/components/staff/staff-header';

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
    
    // Form State
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<'manager' | 'staff'>('staff');

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
        <div className="min-h-screen bg-background pb-24 md:pb-8 transition-colors duration-300">
            <StaffHeader 
                shopName="My Shop" 
                stats={{
                    totalStaff: initialStaff.length,
                    activeNow: initialStaff.filter(s => s.is_active).length
                }}
                onAddStaff={() => setIsCreateOpen(true)}
            />

            <div className="max-w-5xl mx-auto px-4 md:px-8 -mt-8 relative z-10 space-y-8">
                
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
                                            {permissions?.canInviteStaff && (
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

                <Card className="border-none shadow-xl bg-card/50 backdrop-blur-xl">
                    <CardHeader>
                        <CardTitle>Team Members</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent border-border/50">
                                    <TableHead>Name</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Joined</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {initialStaff.map((member) => (
                                    <TableRow 
                                        key={member.id} 
                                        className="hover:bg-muted/30 border-border/50 transition-colors cursor-pointer"
                                        onClick={() => router.push(`/shop/${shopId}/staff/${member.user_id}`)}
                                    >
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-3">
                                                <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                                                    {member.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-foreground">{member.name}</p>
                                                    <p className="text-xs text-muted-foreground">{member.email}</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={cn("capitalize font-medium border-0", getRoleBadgeColor(member.role))}>
                                                {member.role}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <div className={cn("h-2 w-2 rounded-full", member.is_active ? "bg-emerald-500" : "bg-rose-500")} />
                                                <span className="text-sm text-muted-foreground">{member.is_active ? 'Active' : 'Inactive'}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground text-sm">
                                            {format(new Date(member.joined_at), 'MMM d, yyyy')}
                                        </TableCell>
                                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                                            {permissions.canInviteStaff && member.user_id !== currentUserId && (
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-40">
                                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem 
                                                            className="text-rose-600 focus:text-rose-600 cursor-pointer"
                                                            onClick={() => handleRemoveStaff(member.id)}
                                                        >
                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                            Remove
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>

            {/* Create Staff Dialog */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Add Team Member</DialogTitle>
                        <DialogDescription>
                            Create an account for your staff member. They can use these credentials to login.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Full Name</Label>
                            <Input
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="John Doe"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="john@example.com"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="text"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Set a password (min 6 chars)"
                            />
                            <p className="text-xs text-muted-foreground">
                                You set this password for them.
                            </p>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="role">Role</Label>
                            <Select value={role} onValueChange={(v: any) => setRole(v)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a role" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="manager">Manager</SelectItem>
                                    <SelectItem value="staff">Staff</SelectItem>
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
    );
}
