'use client';

import { useState, useTransition, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
    ArrowLeft, Plus, Edit, Trash2, Phone, MessageCircle, ArrowDownRight, ArrowUpRight,
    Paperclip, FileText, X, Loader2, MapPin, Mail, Calendar, CreditCard
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
                        // Attempt to create bucket if it doesn't exist? No, usually generic error.
                        // Assuming bucket 'khata-docs' exists. If not, this fails.
                        console.error('Upload error', uploadError);
                        throw new Error('Failed to upload document. Please try again or remove the file.');
                    }

                    docPath = fileName;
                    docType = file.type;
                    docName = file.name;
                }

                // 2. Add Transaction via V2 RPC
                // Determine transaction type if not set
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
        // Implement V2 delete or generic delete
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
        // Update Logic based on source table
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
        <MotionWrapper className="space-y-6 pb-24">
            {/* Header */}
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.push(`/shop/${shopId}/khata`)}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold">{entity.name}</h1>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            {entity.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {entity.phone}</span>}
                            <Badge variant="outline" className="text-xs">{entity.entity_type}</Badge>
                        </div>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setIsEditEntityOpen(true)} className="gap-2">
                        <Edit className="h-4 w-4" /> Edit
                    </Button>
                </div>
            </div>

            {/* Edit Dialog */}
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

            <div className="grid gap-6 md:grid-cols-3">
                {/* Balance Card */}
                <Card className={cn(
                    "border-0 shadow-xl overflow-hidden text-white md:col-span-1",
                    entity.current_balance > 0 ? "bg-gradient-to-br from-emerald-500 to-emerald-600" :
                        entity.current_balance < 0 ? "bg-gradient-to-br from-red-500 to-red-600" :
                            "bg-gradient-to-br from-slate-500 to-slate-600"
                )}>
                    <CardContent className="p-6 text-center flex flex-col items-center justify-center h-full min-h-[180px]">
                        <p className="opacity-90 text-sm mb-1">Current Balance</p>
                        <h2 className="text-4xl font-bold mb-3">{formatCurrency(Math.abs(entity.current_balance))}</h2>
                        <Badge className="bg-white/20 hover:bg-white/30 text-white border-0 mb-4">
                            {entity.current_balance > 0 ? 'To Collect' : entity.current_balance < 0 ? 'To Pay' : 'Settled'}
                        </Badge>

                        <div className="flex gap-2 w-full mt-auto">
                            <Button variant="secondary" className="w-full bg-white/20 hover:bg-white/30 text-white border-0" onClick={sendWhatsApp} disabled={!entity.phone}>
                                <MessageCircle className="h-4 w-4 mr-2" /> Remind
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Contact Info Card */}
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle className="text-lg">Contact Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                                    <Phone className="h-3 w-3" /> Phone
                                </div>
                                <p className="font-medium">{entity.phone || 'N/A'}</p>
                            </div>
                            <div className="space-y-1">
                                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                                    <Mail className="h-3 w-3" /> Email
                                </div>
                                <p className="font-medium">{entity.email || 'N/A'}</p>
                            </div>
                            <div className="space-y-1 sm:col-span-2">
                                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                                    <MapPin className="h-3 w-3" /> Address
                                </div>
                                <p className="font-medium">{entity.address || 'N/A'}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Transactions Section */}
            <Card className="glass-card">
                <div className="p-4 border-b flex items-center justify-between">
                    <div>
                        <h3 className="font-bold text-lg">Transaction History</h3>
                        <p className="text-xs text-muted-foreground">Recent ledger entries</p>
                    </div>
                    <Dialog open={isAddTransactionOpen} onOpenChange={setIsAddTransactionOpen}>
                        <DialogTrigger asChild>
                            <Button className="gap-2">
                                <Plus className="h-4 w-4" /> <span className="hidden sm:inline">Add Transaction</span>
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
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
                                                ? "border-emerald-500 bg-emerald-50 text-emerald-700"
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
                                                ? "border-red-500 bg-red-50 text-red-700"
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
                    {/* Mobile View - Cards */}
                    <div className="md:hidden space-y-3 p-4">
                        {transactionsWithBalance.length === 0 ? (
                            <div className="text-center py-10 text-muted-foreground">No transactions yet</div>
                        ) : (
                            transactionsWithBalance.map(t => (
                                <Card key={t.id} className="overflow-hidden border border-border/50">
                                    <CardContent className="p-0 flex">
                                        <div className={cn(
                                            "w-1.5 shrink-0",
                                            t.entry_type === 'DEBIT' ? "bg-emerald-500" : "bg-red-500"
                                        )} />
                                        <div className="p-3 flex-1">
                                            <div className="flex justify-between items-start mb-1">
                                                <div>
                                                    <div className="font-bold text-base flex items-center gap-2">
                                                        <span className={t.entry_type === 'DEBIT' ? "text-emerald-700" : "text-red-700"}>
                                                            {t.entry_type === 'DEBIT' ? '+' : '-'}{formatCurrency(t.amount)}
                                                        </span>
                                                        {t.transaction_type && <Badge variant="outline" className="text-[10px] h-4 px-1">{t.transaction_type}</Badge>}
                                                    </div>
                                                    <p className="text-xs text-muted-foreground">{format(new Date(t.transaction_date), 'dd MMM, yyyy')}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[10px] font-mono text-muted-foreground">Bal: {formatCurrency(Math.abs(t.balance_after || 0))}</p>
                                                    <Button variant="ghost" size="icon" className="h-6 w-6 -mr-2 text-muted-foreground/50 hover:text-red-500" onClick={() => handleDeleteTransaction(t.id)}>
                                                        <Trash2 className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            </div>
                                            {t.description && <p className="text-sm text-foreground/80 bg-muted/30 p-1.5 rounded-md mt-1">{t.description}</p>}

                                            {/* Documents */}
                                            {t.documents && t.documents.length > 0 && (
                                                <div className="flex gap-2 mt-2 flex-wrap">
                                                    {t.documents.map(doc => (
                                                        <a
                                                            key={doc.id}
                                                            href={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/khata-docs/${doc.storage_path}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="flex items-center gap-1.5 bg-blue-50 text-blue-700 px-2 py-1 rounded text-[10px] font-medium hover:bg-blue-100 transition-colors"
                                                        >
                                                            <Paperclip className="h-3 w-3" />
                                                            {doc.file_name}
                                                        </a>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </div>

                    {/* Desktop View - Table */}
                    <div className="hidden md:block overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-muted/50">
                                <TableRow className="hover:bg-transparent">
                                    <TableHead>Date</TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead className="text-right">Debit (+)</TableHead>
                                    <TableHead className="text-right">Credit (-)</TableHead>
                                    <TableHead className="text-right">Balance</TableHead>
                                    <TableHead></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {transactionsWithBalance.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                            No transactions found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    transactionsWithBalance.map((t) => (
                                        <TableRow key={t.id} className="group">
                                            <TableCell className="w-[120px]">
                                                {format(new Date(t.transaction_date), 'dd MMM, yyyy')}
                                            </TableCell>
                                            <TableCell>
                                                <div className="max-w-[300px] truncate" title={t.description || ''}>
                                                    {t.description || '-'}
                                                </div>
                                                {/* Documents */}
                                                {t.documents && t.documents.length > 0 && (
                                                    <div className="flex gap-1 mt-1">
                                                        {t.documents.map(doc => (
                                                            <Paperclip key={doc.id} className="h-3 w-3 text-blue-500" />
                                                        ))}
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {t.transaction_type && <Badge variant="outline" className="text-[10px]">{t.transaction_type}</Badge>}
                                            </TableCell>
                                            <TableCell className="text-right font-medium text-emerald-600">
                                                {t.entry_type === 'DEBIT' ? formatCurrency(t.amount) : '-'}
                                            </TableCell>
                                            <TableCell className="text-right font-medium text-red-600">
                                                {t.entry_type === 'CREDIT' ? formatCurrency(t.amount) : '-'}
                                            </TableCell>
                                            <TableCell className="text-right font-mono text-muted-foreground">
                                                {formatCurrency(Math.abs(t.balance_after || 0))}
                                            </TableCell>
                                            <TableCell className="text-right w-[50px]">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
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
                </div>
            </Card>
        </MotionWrapper>
    );
}
