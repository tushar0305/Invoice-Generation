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
import { Loader2, UserPlus, Trash2, Shield, Eye, EyeOff, MoreHorizontal, Calendar, IndianRupee, User } from 'lucide-react';
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
    const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
    const [isProfileOpen, setIsProfileOpen] = useState(false);

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

    const handleViewProfile = (member: StaffMember) => {
        setSelectedStaff(member);
        setIsProfileOpen(true);
    };

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
                                Add Staff Member
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                                <DialogTitle>Add New Staff Member</DialogTitle>
                                <DialogDescription>
                                    Create a new account for your staff member. They will receive an email with login details.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="name">Full Name</Label>
                                    <Input id="name" placeholder="John Doe" value={name} onChange={(e) => setName(e.target.value)} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input id="email" type="email" placeholder="john@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="password">Password</Label>
                                    <div className="relative">
                                        <Input 
                                            id="password" 
                                            type={showPassword ? "text" : "password"} 
                                            value={password} 
                                            onChange={(e) => setPassword(e.target.value)} 
                                        />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                            onClick={() => setShowPassword(!showPassword)}
                                        >
                                            {showPassword ? (
                                                <EyeOff className="h-4 w-4 text-muted-foreground" />
                                            ) : (
                                                <Eye className="h-4 w-4 text-muted-foreground" />
                                            )}
                                        </Button>
                                    </div>
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
                                <Button onClick={handleCreateStaff} disabled={isSubmitting}>
                                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Create Account
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                )}
            </div>

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
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
                                    <div className="flex items-center justify-center gap-2 text-muted-foreground">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Loading staff...
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : staff.length === 0 ? (
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
                                                <DropdownMenuItem>
                                                    <Shield className="mr-2 h-4 w-4" />
                                                    Change Role
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                {member.role !== 'owner' && (
                                                    <DropdownMenuItem 
                                                        className="text-red-600"
                                                        onClick={() => removeStaff(member.id)}
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
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Staff Profile</DialogTitle>
                        <DialogDescription>Manage details, salary, and attendance for {selectedStaff?.email}</DialogDescription>
                    </DialogHeader>
                    
                    <Tabs defaultValue="details" className="w-full">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="details">Details</TabsTrigger>
                            <TabsTrigger value="salary">Salary & Payments</TabsTrigger>
                            <TabsTrigger value="attendance">Attendance</TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="details" className="space-y-4 mt-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Full Name</Label>
                                    <Input defaultValue="Staff Member" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Phone Number</Label>
                                    <Input placeholder="+91 98765 43210" />
                                </div>
                                <div className="space-y-2 col-span-2">
                                    <Label>Address</Label>
                                    <Input placeholder="123, Market Street, City" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Designation</Label>
                                    <Input placeholder="Sales Executive" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Joining Date</Label>
                                    <Input type="date" />
                                </div>
                            </div>
                            <div className="flex justify-end">
                                <Button>Save Changes</Button>
                            </div>
                        </TabsContent>

                        <TabsContent value="salary" className="space-y-4 mt-4">
                            <div className="flex justify-between items-center">
                                <h3 className="text-lg font-semibold">Salary History</h3>
                                <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white">
                                    <IndianRupee className="mr-2 h-4 w-4" />
                                    Record Payment
                                </Button>
                            </div>
                            
                            <Card>
                                <CardContent className="p-0">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Month</TableHead>
                                                <TableHead>Amount</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead>Date</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            <TableRow>
                                                <TableCell>October 2023</TableCell>
                                                <TableCell>₹15,000</TableCell>
                                                <TableCell><Badge className="bg-green-500">Paid</Badge></TableCell>
                                                <TableCell>Nov 1, 2023</TableCell>
                                            </TableRow>
                                            <TableRow>
                                                <TableCell>November 2023</TableCell>
                                                <TableCell>₹15,000</TableCell>
                                                <TableCell><Badge variant="outline" className="text-yellow-600 border-yellow-600">Pending</Badge></TableCell>
                                                <TableCell>-</TableCell>
                                            </TableRow>
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="attendance" className="space-y-4 mt-4">
                            <div className="flex justify-between items-center">
                                <h3 className="text-lg font-semibold">Attendance Log</h3>
                                <div className="flex gap-2">
                                    <Button size="sm" variant="outline">Mark Absent</Button>
                                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">Mark Present</Button>
                                </div>
                            </div>
                            <div className="rounded-md border p-4 text-center text-muted-foreground">
                                <Calendar className="mx-auto h-8 w-8 mb-2 opacity-50" />
                                <p>Attendance calendar view coming soon</p>
                            </div>
                        </TabsContent>
                    </Tabs>
                </DialogContent>
            </Dialog>
        </MotionWrapper>
    );
}
