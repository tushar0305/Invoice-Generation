'use client';

import { useState, useEffect } from 'react';
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
import { Loader2, UserPlus, Trash2, Shield, Eye, EyeOff } from 'lucide-react';
import { format } from 'date-fns';
import { MotionWrapper } from '@/components/ui/motion-wrapper';
import { getRoleBadgeColor } from '@/lib/permissions';


type StaffMember = {
    id: string;
    user_id: string;
    role: 'owner' | 'manager' | 'staff';
    email: string;
    joined_at: string;
    is_active: boolean;
};

export default function StaffPage() {
    const { activeShop, permissions, userRole } = useActiveShop();
    const { toast } = useToast();
    const [staff, setStaff] = useState<StaffMember[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form State
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<'manager' | 'staff'>('staff');
    const [showPassword, setShowPassword] = useState(false);

    const loadStaff = async () => {
        if (!activeShop?.id) return;

        try {
            setIsLoading(true);
            const { data, error } = await supabase
                .from('user_shop_roles')
                .select('*')
                .eq('shop_id', activeShop.id)
                .order('created_at', { ascending: true });

            if (error) throw error;

            const mappedStaff: StaffMember[] = data.map((r: any) => ({
                id: r.id,
                user_id: r.user_id,
                role: r.role,
                email: r.user_id === userRole?.userId ? 'You' : `User ${r.user_id.slice(0, 8)}...`, // Placeholder until we have a secure way to fetch emails
                joined_at: r.accepted_at || r.created_at,
                is_active: r.is_active,
            }));

            setStaff(mappedStaff);
        } catch (error) {
            console.error('Error loading staff:', error);
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
        loadStaff();
    }, [activeShop?.id]);

    const handleCreateStaff = async () => {
        if (!activeShop?.id) return;
        if (!email || !password || !name) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please fill in all fields' });
            return;
        }

        try {
            setIsSubmitting(true);

            // Get current session token
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.access_token) {
                toast({ variant: 'destructive', title: 'Error', description: 'Authentication error. Please log in again.' });
                return;
            }

            // Call Edge Function instead of Server Action
            const { data, error } = await supabase.functions.invoke('create-staff-member', {
                body: {
                    email,
                    password,
                    role,
                    shopId: activeShop.id,
                    name
                }
            });

            if (error) {
                throw new Error(error.message || 'Failed to call function');
            }

            if (data?.error) {
                toast({
                    variant: 'destructive',
                    title: 'Error',
                    description: data.error,
                });
            } else {
                toast({
                    title: 'Success',
                    description: 'Staff member created successfully. You can now share the credentials.',
                });
                setIsCreateOpen(false);
                setEmail('');
                setName('');
                setPassword('');
                setRole('staff');
                loadStaff();
            }
        } catch (error: any) {
            console.error('Error creating staff:', error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'An unexpected error occurred',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const removeStaff = async (staffId: string) => {
        if (!confirm('Are you sure you want to remove this staff member? This will delete their account completely.')) return;

        try {
            // Call Edge Function to delete staff member and their auth account
            const { data, error } = await supabase.functions.invoke('delete-staff-member', {
                body: {
                    staffRoleId: staffId,
                    shopId: activeShop?.id
                }
            });

            if (error) {
                throw new Error(error.message || 'Failed to call function');
            }

            if (data?.error) {
                throw new Error(data.error);
            }

            toast({
                title: 'Success',
                description: 'Staff member and their account have been deleted',
            });
            loadStaff();
        } catch (error: any) {
            console.error('Error removing staff:', error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: error.message || 'Failed to remove staff member',
            });
        }
    };

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
        <MotionWrapper className="space-y-6 pb-24">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-heading font-bold text-foreground">Staff Management</h1>
                    <p className="text-muted-foreground">Create accounts for your team and manage their access.</p>
                </div>
                <Dialog open={isCreateOpen} onOpenChange={(open) => {
                    setIsCreateOpen(open);
                    if (!open) {
                        setEmail('');
                        setName('');
                        setPassword('');
                    }
                }}>
                    <DialogTrigger asChild>
                        <Button className="bg-[#D4AF37] hover:bg-[#B8930A] text-white">
                            <UserPlus className="mr-2 h-4 w-4" />
                            Add Staff Member
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add New Staff Member</DialogTitle>
                            <DialogDescription>
                                Create a new account for your staff member. You will need to share these credentials with them.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Full Name</Label>
                                <Input
                                    id="name"
                                    placeholder="e.g. John Doe"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email Address</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="staff@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Create a secure password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                                <p className="text-xs text-muted-foreground">Must be at least 6 characters</p>
                            </div>

                            <div className="space-y-2">
                                <Label>Role</Label>
                                <Select
                                    value={role}
                                    onValueChange={(v: 'manager' | 'staff') => setRole(v)}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="manager">Manager (Full Access except Delete)</SelectItem>
                                        <SelectItem value="staff">Staff (Limited Access)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <Button
                                onClick={handleCreateStaff}
                                disabled={isSubmitting}
                                className="w-full mt-2"
                            >
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Create Account
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="rounded-md border border-border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>User</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Joined</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center">
                                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                                </TableCell>
                            </TableRow>
                        ) : staff.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                    No staff members found. Add someone to get started!
                                </TableCell>
                            </TableRow>
                        ) : (
                            staff.map((member) => (
                                <TableRow key={member.id}>
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-2">
                                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                                                {member.email.charAt(0).toUpperCase()}
                                            </div>
                                            {member.email}
                                            {member.user_id === userRole?.userId && <Badge variant="outline" className="ml-2 text-[10px]">You</Badge>}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge className={getRoleBadgeColor(member.role)}>
                                            {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground text-sm">
                                        {format(new Date(member.joined_at), 'MMM d, yyyy')}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {member.role !== 'owner' && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-destructive hover:text-destructive/80 hover:bg-destructive/10"
                                                onClick={() => removeStaff(member.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        )}
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
