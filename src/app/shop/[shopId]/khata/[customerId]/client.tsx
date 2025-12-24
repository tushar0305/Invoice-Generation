'use client';

import { useState, useTransition, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
    ArrowLeft, Plus, Edit, Trash2, Phone, MessageCircle, ArrowDownRight, ArrowUpRight,
    Paperclip, FileText, X, Loader2, MapPin, Mail, Calendar, CreditCard, User, Crown
} from 'lucide-react';
import { MotionWrapper } from '@/components/ui/motion-wrapper';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/supabase/client';
import type { UnifiedParty, LedgerTransaction, TransactionType } from '@/lib/ledger-types';
import { cn, formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';

type CustomerLedgerClientProps = {
    entity: UnifiedParty;
    transactions: LedgerTransaction[];
    shopId: string;
    userId: string;
};

const ENTITY_LABELS: Record<string, { given: string, received: string }> = {
    CUSTOMER: { given: 'Sale / Given', received: 'Payment / Received' },
    SUPPLIER: { given: 'Payment Sent', received: 'Purchase / Bill' },
    KARIGAR: { given: 'Payment Sent', received: 'Work / Labor' },
    PARTNER: { given: 'Withdrawal', received: 'Deposit / Profit' },
    OTHER: { given: 'Given', received: 'Got' },
};

export function CustomerLedgerClient({
    entity,
    transactions: initialTransactions,
    shopId,
    userId,
}: CustomerLedgerClientProps) {
    const router = useRouter();
    const { toast } = useToast();
    const [isPending, startTransition] = useTransition();

    const [isAddTransactionOpen, setIsAddTransactionOpen] = useState(false);
    const [isEditEntityOpen, setIsEditEntityOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [newTransaction, setNewTransaction] = useState({
        entry_type: 'DEBIT' as 'DEBIT' | 'CREDIT',  // DEBIT = You Gave / They Took. CREDIT = You Got / They Gave.
        amount: '',
        transaction_type: '' as TransactionType | '',
        description: '',
        transaction_date: format(new Date(), 'yyyy-MM-dd'),
        file: null as File | null
    });

    const [editEntity, setEditEntity] = useState({
        name: entity.name,
        phone: entity.phone || '',
        address: entity.address || '',
    });

    // Compute running balance
    let runningBalance = 0;
    // We reverse to calculate from oldest to newest
    const transactionsWithBalance = [...initialTransactions].reverse().map(trans => {
        if (trans.entry_type === 'DEBIT') runningBalance += trans.amount;
        else runningBalance -= trans.amount;
        return { ...trans, balance_after: runningBalance };
    }).reverse(); // Reverse back to newest first

    const handleAddTransaction = async () => {
        const amount = parseFloat(newTransaction.amount);
        if (!amount || amount <= 0) {
            toast({ variant: 'destructive', title: 'Invalid Amount', description: 'Please enter a valid amount' });
            return;
        }

        startTransition(async () => {
            try {
                let docPath = null;
                let docType = null;
                let docName = null;

                // 1. Upload File if present
                if (newTransaction.file) {
                    const file = newTransaction.file;
                    const fileExt = file.name.split('.').pop();
                    const fileName = `${shopId}/${entity.id}/${Date.now()}.${fileExt}`;

                    const { error: uploadError } = await supabase.storage
                        .from('khata-docs')
                        .upload(fileName, file);

                    if (uploadError) {
                        console.error('Upload error', uploadError);
                        throw new Error('Failed to upload document. Please try again or remove the file.');
                    }

                    docPath = fileName;
                    docType = file.type;
                    docName = file.name;
                }

                // 2. Add Transaction via V2 RPC
                let txType = newTransaction.transaction_type;
                if (!txType) {
                    if (entity.entity_type === 'CUSTOMER') {
                        txType = newTransaction.entry_type === 'DEBIT' ? 'SALE' : 'PAYMENT';
                    } else if (entity.entity_type === 'SUPPLIER') {
                        txType = newTransaction.entry_type === 'CREDIT' ? 'PURCHASE' : 'PAYMENT';
                    } else {
                        txType = newTransaction.entry_type === 'DEBIT' ? 'ODHARA' : 'JAMA';
                    }
                }

                const { error } = await supabase.rpc('add_ledger_entry_v2', {
                    p_shop_id: shopId,
                    p_khatabook_contact_id: entity.id,
                    p_transaction_type: txType,
                    p_amount: amount,
                    p_entry_type: newTransaction.entry_type,
                    p_description: newTransaction.description.trim() || null,
                    p_transaction_date: new Date(newTransaction.transaction_date),
                    p_file_path: docPath,
                    p_file_type: docType,
                    p_file_name: docName
                });

                if (error) throw error;

                toast({ title: 'Transaction Added', description: 'Entry recorded successfully' });
                setIsAddTransactionOpen(false);
                setNewTransaction({
                    entry_type: 'CREDIT',
                    amount: '',
                    transaction_type: '',
                    description: '',
                    transaction_date: format(new Date(), 'yyyy-MM-dd'),
                    file: null
                });
                router.refresh();

            } catch (error: any) {
                toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to add transaction' });
            }
        });
    };

    const handleDeleteTransaction = async (transactionId: string) => {
        if (!confirm('Are you sure you want to delete this transaction?')) return;
        startTransition(async () => {
            const { error } = await supabase.from('ledger_transactions').update({ deleted_at: new Date().toISOString() }).eq('id', transactionId);
            if (error) {
                toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete' });
            } else {
                toast({ title: 'Deleted', description: 'Transaction removed' });
                router.refresh();
            }
        });
    };

    const handleUpdateEntity = async () => {
        if (!editEntity.name) return;
        startTransition(async () => {
            const { error } = await supabase
                .from('khatabook_contacts')
                .update({
                    name: editEntity.name,
                    phone: editEntity.phone || null,
                    address: editEntity.address || null
                })
                .eq('id', entity.id);

            if (error) {
                toast({ variant: 'destructive', title: 'Error', description: error.message });
            } else {
                toast({ title: 'Updated', description: 'Details updated successfully' });
                setIsEditEntityOpen(false);
                router.refresh();
            }
        });
    };

    const handleDeleteEntity = async () => {
        if (!confirm('Are you sure you want to delete this contact?')) return;
        startTransition(async () => {
            const { error } = await supabase.from('khatabook_contacts').update({ deleted_at: new Date().toISOString() }).eq('id', entity.id);
            if (error) toast({ variant: 'destructive', title: 'Error', description: error.message });
            else {
                toast({ title: 'Deleted', description: 'Contact deleted successfully' });
                router.push(`/shop/${shopId}/khata`);
            }
        });
    };

    const sendWhatsApp = () => {
        if (!entity.phone) return;
        const balance = Math.abs(entity.current_balance);
        const typeStr = entity.current_balance > 0 ? 'receivable (You owe me)' : 'payable (I owe you)';
        const text = `Hi ${entity.name}, your current balance with us is ₹${balance} - ${typeStr}.`;
        window.open(`https://wa.me/${entity.phone.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`, '_blank');
    };

    const labels = ENTITY_LABELS[entity.entity_type] || ENTITY_LABELS.OTHER;

    return (
        <div className="min-h-screen bg-background pb-24 transition-colors duration-300">
            {/* --- HEADER SECTION (Strictly Matches Catalogue Premium Header) --- */}
            <div className="relative overflow-hidden pb-12">
                {/* Gradient Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/10 to-background" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/30 via-transparent to-transparent" />

                {/* Floating Orbs */}
                <div className="absolute top-0 right-0 w-72 h-72 bg-primary/20 rounded-full blur-3xl -translate-y-1/3 translate-x-1/4 animate-pulse" />
                <div className="absolute bottom-0 left-0 w-56 h-56 bg-primary/15 rounded-full blur-2xl translate-y-1/3 -translate-x-1/4" />
                
                {/* Glass Container */}
                <div className="relative max-w-7xl mx-auto px-4 md:px-8 py-10 md:py-16">
                    <div className="backdrop-blur-xl bg-white/60 dark:bg-gray-900/60 rounded-3xl border border-white/40 dark:border-white/10 shadow-2xl shadow-primary/10 p-6 md:p-10">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                            {/* Back + Brand Info */}
                            <div className="space-y-3 max-w-full md:max-w-2xl w-full">
                                <Button variant="ghost" size="sm" onClick={() => router.push(`/shop/${shopId}/khata`)} className="-ml-2 text-muted-foreground hover:text-foreground mb-2">
                                    <ArrowLeft className="h-4 w-4 mr-1" /> Back to List
                                </Button>

                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/10 backdrop-blur-md text-xs font-medium text-primary">
                                    <User className="h-3 w-3" />
                                    <span>{entity.entity_type || 'Customer'} Ledger</span>
                                </div>

                                <div className="flex flex-col sm:flex-row sm:items-baseline sm:gap-4">
                                    <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-foreground via-foreground to-primary bg-clip-text text-transparent break-words line-clamp-2">
                                        {entity.name}
                                    </h1>
                                    {entity.phone && <span className="text-lg text-muted-foreground font-mono">{entity.phone}</span>}
                                </div>
                            </div>

                            {/* Header Actions */}
                            <div className="flex gap-2 w-full md:w-auto">
                                <Button variant="outline" onClick={() => setIsEditEntityOpen(true)} className="flex-1 md:flex-none bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-border shadow-sm hover:bg-white/80 dark:hover:bg-gray-800/80">
                                    <Edit className="h-4 w-4 mr-2" /> Edit Details
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Edit Dialog (Hidden) */}
            <Dialog open={isEditEntityOpen} onOpenChange={setIsEditEntityOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Edit Details</DialogTitle></DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2"><Label>Name</Label><Input value={editEntity.name} onChange={e => setEditEntity({ ...editEntity, name: e.target.value })} /></div>
                        <div className="space-y-2"><Label>Phone</Label><Input value={editEntity.phone} onChange={e => setEditEntity({ ...editEntity, phone: e.target.value })} /></div>
                        <div className="space-y-2"><Label>Address</Label><Input value={editEntity.address} onChange={e => setEditEntity({ ...editEntity, address: e.target.value })} /></div>
                    </div>
                    <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:justify-between w-full">
                        <Button variant="destructive" onClick={handleDeleteEntity} disabled={isPending} type="button" className="w-full sm:w-auto">
                            <Trash2 className="h-4 w-4 mr-2" /> Delete
                        </Button>
                        <div className="flex gap-2 w-full sm:w-auto">
                            <Button variant="outline" onClick={() => setIsEditEntityOpen(false)} className="flex-1 sm:flex-none">Cancel</Button>
                            <Button onClick={handleUpdateEntity} disabled={isPending} className="flex-1 sm:flex-none">Save</Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* --- MAIN CONTENT (Overlapping) --- */}
            <div className="max-w-7xl mx-auto px-4 md:px-8 -mt-8 relative z-20 space-y-8">

                {/* Stats Grid - Bento Style */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Balance Card - Hero */}
                    <Card className={cn(
                        "md:col-span-1 border-0 shadow-lg shadow-black/10 overflow-hidden relative group",
                        entity.current_balance >= 0
                            ? "bg-gradient-to-br from-emerald-500 to-emerald-600 dark:from-emerald-600 dark:to-emerald-700 text-white"
                            : "bg-gradient-to-br from-red-500 to-red-600 dark:from-red-600 dark:to-red-700 text-white"
                    )}>
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <CreditCard className="h-24 w-24 text-white" />
                        </div>
                        <CardContent className="p-6 md:p-8 flex flex-col justify-between h-full min-h-[200px]">
                            <div>
                                <p className="text-sm font-medium opacity-90 mb-1">Current Balance</p>
                                <h2 className="text-4xl font-bold tracking-tight mb-3 tabular-nums">{formatCurrency(Math.abs(entity.current_balance))}</h2>
                                <Badge className="bg-white/20 text-white hover:bg-white/30 border-0 backdrop-blur-sm">
                                    {entity.current_balance >= 0 ? 'To Receive' : 'To Pay'}
                                </Badge>
                            </div>
                            <Button variant="secondary" className="w-full mt-6 bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-sm shadow-sm" onClick={sendWhatsApp} disabled={!entity.phone}>
                                <MessageCircle className="h-4 w-4 mr-2" />
                                Send Reminder
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Contact Info - Glassy */}
                    <Card className="md:col-span-2 border-border/50 shadow-lg shadow-black/5 bg-card/60 backdrop-blur-xl">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <User className="h-5 w-5 text-primary" />
                                Contact Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-6 sm:grid-cols-2">
                                <div className="space-y-1 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                                    <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium uppercase tracking-wider">
                                        <Phone className="h-3 w-3" /> Phone
                                    </div>
                                    <p className="font-medium text-lg">{entity.phone || 'N/A'}</p>
                                </div>
                                <div className="space-y-1 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                                    <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium uppercase tracking-wider">
                                        <Mail className="h-3 w-3" /> Email
                                    </div>
                                    <p className="font-medium text-lg">{entity.email || 'N/A'}</p>
                                </div>
                                <div className="space-y-1 sm:col-span-2 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                                    <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium uppercase tracking-wider">
                                        <MapPin className="h-3 w-3" /> Address
                                    </div>
                                    <p className="font-medium text-lg">{entity.address || 'N/A'}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Transactions Section */}
                <Card className="border-border/50 shadow-xl shadow-black/5 bg-card/60 backdrop-blur-xl overflow-hidden">
                    <div className="p-4 md:p-6 border-b border-border/30 bg-muted/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div>
                            <h3 className="font-bold text-lg flex items-center gap-2">
                                <Calendar className="h-5 w-5 text-primary" />
                                Transaction History
                            </h3>
                            <p className="text-sm text-muted-foreground">Recent ledger entries</p>
                        </div>

                        <Dialog open={isAddTransactionOpen} onOpenChange={setIsAddTransactionOpen}>
                            <DialogTrigger asChild>
                                <Button className="w-full md:w-auto rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:shadow-xl hover:-translate-y-0.5 transition-all">
                                    <Plus className="h-4 w-4 mr-2" /> Add Transaction
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-md rounded-2xl">
                                <DialogHeader>
                                    <DialogTitle>New Transaction</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                    {/* Type Toggle */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            onClick={() => setNewTransaction({ ...newTransaction, entry_type: 'DEBIT' })}
                                            className={cn(
                                                "p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-1",
                                                newTransaction.entry_type === 'DEBIT'
                                                    ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400"
                                                    : "border-border hover:bg-muted"
                                            )}
                                        >
                                            <ArrowDownRight className="h-5 w-5" />
                                            <span className="font-bold text-sm">YOU GAVE</span>
                                            <span className="text-[10px] opacity-70">{labels.given}</span>
                                        </button>
                                        <button
                                            onClick={() => setNewTransaction({ ...newTransaction, entry_type: 'CREDIT' })}
                                            className={cn(
                                                "p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-1",
                                                newTransaction.entry_type === 'CREDIT'
                                                    ? "border-red-500 bg-red-50 text-red-700 dark:bg-red-500/20 dark:text-red-400"
                                                    : "border-border hover:bg-muted"
                                            )}
                                        >
                                            <ArrowUpRight className="h-5 w-5" />
                                            <span className="font-bold text-sm">YOU GOT</span>
                                            <span className="text-[10px] opacity-70">{labels.received}</span>
                                        </button>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Amount</Label>
                                        <Input
                                            type="number"
                                            value={newTransaction.amount}
                                            onChange={e => setNewTransaction({ ...newTransaction, amount: e.target.value })}
                                            className="text-2xl font-bold h-12"
                                            placeholder="0.00"
                                            autoFocus
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Description</Label>
                                        <Textarea
                                            value={newTransaction.description}
                                            onChange={e => setNewTransaction({ ...newTransaction, description: e.target.value })}
                                            placeholder="Item details, bill no, etc."
                                            rows={2}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Date</Label>
                                        <Input
                                            type="date"
                                            value={newTransaction.transaction_date}
                                            onChange={e => setNewTransaction({ ...newTransaction, transaction_date: e.target.value })}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Attachment (Optional)</Label>
                                        <div className="flex gap-2 items-center">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                className="gap-2"
                                                onClick={() => fileInputRef.current?.click()}
                                            >
                                                <Paperclip className="h-4 w-4" />
                                                {newTransaction.file ? 'Change File' : 'Attach File'}
                                            </Button>
                                            <span className="text-xs text-muted-foreground truncate max-w-[150px]">
                                                {newTransaction.file?.name}
                                            </span>
                                            {newTransaction.file && (
                                                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setNewTransaction({ ...newTransaction, file: null })}>
                                                    <X className="h-3 w-3" />
                                                </Button>
                                            )}
                                            <input
                                                type="file"
                                                ref={fileInputRef}
                                                className="hidden"
                                                accept="image/*,application/pdf"
                                                onChange={(e) => {
                                                    if (e.target.files?.[0]) {
                                                        setNewTransaction({ ...newTransaction, file: e.target.files[0] });
                                                    }
                                                }}
                                            />
                                        </div>
                                    </div>

                                </div>
                                <DialogFooter>
                                    <Button onClick={handleAddTransaction} disabled={isPending} className="w-full">
                                        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Save Transaction
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>

                    <div className="p-0">
                        {/* Desktop View - Table */}
                        <div className="hidden md:block">
                            <Table>
                                <TableHeader className="bg-muted/50">
                                    <TableRow className="hover:bg-transparent border-border/50">
                                        <TableHead className="w-[120px]">Date</TableHead>
                                        <TableHead>Description</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead className="text-right">Debit (+)</TableHead>
                                        <TableHead className="text-right">Credit (-)</TableHead>
                                        <TableHead className="text-right">Balance</TableHead>
                                        <TableHead className="w-[50px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {transactionsWithBalance.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="text-center py-12 text-muted-foreground text-lg">
                                                No transactions found.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        transactionsWithBalance.map((t) => (
                                            <TableRow key={t.id} className="group cursor-default hover:bg-muted/30 border-border/50 transition-colors">
                                                <TableCell className="font-medium text-muted-foreground">
                                                    {format(new Date(t.transaction_date), 'dd MMM, yyyy')}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="max-w-[300px]" title={t.description || ''}>
                                                        {t.description || '-'}
                                                    </div>
                                                    {t.documents && t.documents.length > 0 && (
                                                        <div className="flex gap-1 mt-1">
                                                            {t.documents.map(doc => (
                                                                <a
                                                                    key={doc.id}
                                                                    href={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/khata-docs/${doc.storage_path}`}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="inline-flex items-center gap-1 text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded hover:bg-blue-100"
                                                                >
                                                                    <Paperclip className="h-3 w-3" />
                                                                    View Doc
                                                                </a>
                                                            ))}
                                                        </div>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {t.transaction_type && <Badge variant="secondary" className="text-[10px] font-mono uppercase bg-muted text-muted-foreground">{t.transaction_type}</Badge>}
                                                </TableCell>
                                                <TableCell className="text-right font-bold text-emerald-600 tabular-nums text-base">
                                                    {t.entry_type === 'DEBIT' ? formatCurrency(t.amount) : <span className="text-muted-foreground/20">-</span>}
                                                </TableCell>
                                                <TableCell className="text-right font-bold text-red-600 tabular-nums text-base">
                                                    {t.entry_type === 'CREDIT' ? formatCurrency(t.amount) : <span className="text-muted-foreground/20">-</span>}
                                                </TableCell>
                                                <TableCell className="text-right font-mono text-muted-foreground font-medium tabular-nums">
                                                    {formatCurrency(Math.abs(t.balance_after || 0))}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
                                                        onClick={() => handleDeleteTransaction(t.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Mobile View - Cards */}
                        <div className="md:hidden space-y-3 p-4 bg-muted/5">
                            {transactionsWithBalance.length === 0 ? (
                                <div className="text-center py-10 text-muted-foreground">No transactions yet</div>
                            ) : (
                                transactionsWithBalance.map(t => (
                                    <div key={t.id} className="relative bg-card rounded-xl border border-border/50 shadow-sm overflow-hidden p-4">
                                        <div className={cn(
                                            "absolute left-0 top-0 bottom-0 w-1.5",
                                            t.entry_type === 'DEBIT' ? "bg-emerald-500" : "bg-red-500"
                                        )} />

                                        <div className="pl-3 flex flex-col gap-2">
                                            {/* Date & Amount Row */}
                                            <div className="flex justify-between items-start">
                                                <div className="flex flex-col">
                                                    <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                                                        {format(new Date(t.transaction_date), 'dd MMM, yyyy')}
                                                    </span>
                                                    {t.transaction_type && <Badge variant="outline" className="text-[9px] w-fit mt-1 px-1.5 h-4 border-dashed">{t.transaction_type}</Badge>}
                                                </div>
                                                <div className="text-right">
                                                    <div className={cn("font-bold text-lg tabular-nums", t.entry_type === 'DEBIT' ? "text-emerald-600" : "text-red-600")}>
                                                        {t.entry_type === 'DEBIT' ? '+' : '-'}{formatCurrency(t.amount)}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Description & Balance Row */}
                                            <div className="flex justify-between items-end pt-2 border-t border-border/30 mt-1">
                                                <div className="flex-1 mr-4">
                                                    <p className="text-sm text-foreground/90 line-clamp-2">
                                                        {t.description || <span className="italic text-muted-foreground">No description</span>}
                                                    </p>
                                                    {t.documents && t.documents.length > 0 && (
                                                        <div className="flex gap-2 mt-2">
                                                            {t.documents.map(doc => (
                                                                <a
                                                                    key={doc.id}
                                                                    href={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/khata-docs/${doc.storage_path}`}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="flex items-center gap-1.5 bg-blue-50 text-blue-700 px-2 py-1 rounded text-[10px] font-medium hover:bg-blue-100 transition-colors"
                                                                >
                                                                    <Paperclip className="h-3 w-3" />
                                                                    Doc
                                                                </a>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[10px] text-muted-foreground uppercase mb-0.5">Balance</p>
                                                    <p className="font-mono text-sm font-medium tabular-nums">{formatCurrency(Math.abs(t.balance_after || 0))}</p>
                                                </div>
                                            </div>

                                            <div className="absolute top-2 right-2">
                                                <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground/30 hover:text-red-500" onClick={() => handleDeleteTransaction(t.id)}>
                                                    <Trash2 className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
}
