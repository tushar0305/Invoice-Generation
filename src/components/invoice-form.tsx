'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useFieldArray, useForm } from 'react-hook-form';
import { z } from 'zod';
import { format } from 'date-fns';
import { CalendarIcon, Loader2, PlusCircle, Sparkles, Trash2, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useTransition, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { generateDescriptionAction } from '@/lib/actions';
import type { Invoice, InvoiceItem, UserSettings } from '@/lib/definitions';
import { cn, formatCurrency } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useUser, useDoc, useMemoFirebase } from '@/firebase';
import { getFirestore, doc, writeBatch, collection, getDocs, query, where, serverTimestamp, setDoc } from 'firebase/firestore';


const formSchema = z.object({
  customerName: z.string().min(2, 'Customer name is required'),
  customerAddress: z.string().min(5, 'Customer address is required'),
  customerPhone: z.string().min(10, 'A valid phone number is required'),
  invoiceDate: z.date({ required_error: 'Invoice date is required' }),
  items: z.array(z.object({
      id: z.string(),
      description: z.string().min(1, 'Description is required'),
      purity: z.enum(["10", "12", "14", "18", "20", "22", "24"], { required_error: 'Purity is required.' }),
      grossWeight: z.coerce.number().positive('Gross Wt. must be positive'),
      netWeight: z.coerce.number().positive('Net Wt. must be positive'),
      rate: z.coerce.number().min(0, 'Rate is required'),
      making: z.coerce.number().min(0, 'Making charges are required'),
    })).min(1, 'At least one item is required'),
  discount: z.coerce.number().min(0, 'Discount cannot be negative'),
  sgst: z.coerce.number().min(0).max(100, 'SGST should be a percentage'),
  cgst: z.coerce.number().min(0).max(100, 'CGST should be a percentage'),
  status: z.enum(['paid', 'due']),
});

type InvoiceFormValues = z.infer<typeof formSchema>;

interface InvoiceFormProps {
  invoice?: Invoice & { items: InvoiceItem[] };
}

async function getNextInvoiceNumber(firestore: any, userId: string): Promise<string> {
    const invoicesColRef = collection(firestore, 'invoices');
    const q = query(invoicesColRef, where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    let latestInvoiceNumber = 0;
    querySnapshot.forEach(doc => {
      const docData = doc.data();
      if(docData.invoiceNumber) {
        const numPart = parseInt(docData.invoiceNumber.split('-')[2]);
        if(numPart > latestInvoiceNumber) {
            latestInvoiceNumber = numPart;
        }
      }
    });

    const nextNumber = latestInvoiceNumber + 1;
    return `INV-2024-${String(nextNumber).padStart(3, '0')}`;
}

const calculateTotals = (items: InvoiceFormValues['items'], discount: number, sgst: number, cgst: number) => {
    const subtotal = items.reduce((acc, item) => {
      const itemTotal = (Number(item.netWeight) || 0) * (Number(item.rate) || 0) + (Number(item.making) || 0);
      return acc + itemTotal;
    }, 0);
    const totalBeforeTax = subtotal - (discount || 0);
    const sgstAmount = totalBeforeTax * ((sgst || 0) / 100);
    const cgstAmount = totalBeforeTax * ((cgst || 0) / 100);
    const grandTotal = totalBeforeTax + sgstAmount + cgstAmount;
    return { subtotal, grandTotal };
};

export function InvoiceForm({ invoice }: InvoiceFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [aiLoading, setAiLoading] = useState(false);
  const [aiKeywords, setAiKeywords] = useState('');
  const [aiTargetIndex, setAiTargetIndex] = useState<number | null>(null);
  const { user } = useUser();
  const firestore = getFirestore();

  const settingsRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(firestore, 'userSettings', user.uid);
  }, [firestore, user]);

  const { data: settings, isLoading: settingsLoading } = useDoc<UserSettings>(settingsRef);

  const defaultValues: Partial<InvoiceFormValues> = invoice
    ? {
        ...invoice,
        invoiceDate: new Date(invoice.invoiceDate),
        items: invoice.items.map(item => ({...item, purity: item.purity as InvoiceFormValues['items'][number]['purity']})),
        sgst: (invoice as any).sgst ?? 1.5,
        cgst: (invoice as any).cgst ?? 1.5,
      }
    : {
        customerName: '',
        customerAddress: '',
        customerPhone: '',
        invoiceDate: new Date(),
        items: [{ id: uuidv4(), description: '', purity: '22', grossWeight: 0, netWeight: 0, rate: 0, making: 0 }],
        discount: 0,
        sgst: 1.5,
        cgst: 1.5,
        status: 'due',
      };

  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
    mode: 'onChange',
  });

   useEffect(() => {
    if (settings && !invoice) { // Only set defaults for new invoices
      form.setValue('sgst', settings.sgstRate ?? 1.5);
      form.setValue('cgst', settings.cgstRate ?? 1.5);
    }
  }, [settings, invoice, form]);

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  const watchedItems = form.watch('items');
  const watchedDiscount = form.watch('discount');
  const watchedSgst = form.watch('sgst');
  const watchedCgst = form.watch('cgst');

  const { subtotal, grandTotal } = calculateTotals(watchedItems, watchedDiscount, watchedSgst, watchedCgst);

  async function onSubmit(data: InvoiceFormValues) {
    if (!user) {
        toast({ variant: 'destructive', title: 'Authentication Error', description: 'You must be logged in to save an invoice.'});
        return;
    }

    startTransition(async () => {
      try {
        const batch = writeBatch(firestore);
        const invoiceId = invoice?.id ?? doc(collection(firestore, 'invoices')).id;
        const invoiceRef = doc(firestore, 'invoices', invoiceId);
        
        const { items, ...invoiceMainData } = data;

        const { grandTotal: finalGrandTotal } = calculateTotals(items, data.discount, data.sgst, data.cgst);
        
        const invoicePayload = {
            ...invoiceMainData,
            invoiceDate: format(data.invoiceDate, 'yyyy-MM-dd'),
            grandTotal: finalGrandTotal,
        };

    if (invoice) { // This is an UPDATE
             batch.update(invoiceRef, {
                ...invoicePayload,
                updatedAt: serverTimestamp(),
            });

      // For existing invoices, fetch current items to handle deletions
      const currentItemsSnapshot = await getDocs(collection(firestore, `invoices/${invoiceId}/invoiceItems`));
      const currentItemIds = new Set(currentItemsSnapshot.docs.map(doc => doc.id));
      const newItemIds = new Set(items.map(item => item.id));

      // Delete items that were removed
      currentItemIds.forEach(id => {
        if (!newItemIds.has(id)) {
          const itemRef = doc(firestore, `invoices/${invoiceId}/invoiceItems`, id);
          batch.delete(itemRef);
        }
      });
        } else { // This is a CREATE
            const invoiceNumber = await getNextInvoiceNumber(firestore, user.uid);
            // Create the parent invoice FIRST so security rules for subcollection writes pass.
            await setDoc(invoiceRef, {
                ...invoicePayload,
                id: invoiceId,
                userId: user.uid,
                invoiceNumber: invoiceNumber,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });

            // Now create items in a separate batch after parent exists
            const itemsBatch = writeBatch(firestore);
            items.forEach((item) => {
                const itemRef = doc(firestore, `invoices/${invoiceId}/invoiceItems`, item.id);
                itemsBatch.set(itemRef, {
                  ...item,
                  grossWeight: Number(item.grossWeight) || 0,
                  netWeight: Number(item.netWeight) || 0,
                  rate: Number(item.rate) || 0,
                  making: Number(item.making) || 0,
                });
            });
            await itemsBatch.commit();
        }

        // For UPDATE flow, set/update all items in the same batch
        if (invoice) {
          items.forEach((item) => {
              const itemRef = doc(firestore, `invoices/${invoiceId}/invoiceItems`, item.id);
              batch.set(itemRef, {
                ...item,
                // Ensure all numeric fields are stored as numbers
                grossWeight: Number(item.grossWeight) || 0,
                netWeight: Number(item.netWeight) || 0,
                rate: Number(item.rate) || 0,
                making: Number(item.making) || 0,
              });
          });
        }
        
        // Commit only for UPDATE path; CREATE already committed above
        if (invoice) {
          await batch.commit();
        }
        
        toast({
          title: `Invoice ${invoice ? 'updated' : 'created'} successfully!`,
          description: `Redirecting to view invoice...`,
        });
        
        router.push(`/dashboard/invoices/${invoiceId}/view`);

      } catch (error) {
        console.error("Failed to save invoice:", error);
        toast({
          variant: 'destructive',
          title: 'An error occurred',
          description: 'Failed to save the invoice. Please try again.',
        });
      }
    });
  }

  const handleGenerateDescription = async () => {
    if (aiTargetIndex === null || !aiKeywords) return;
    setAiLoading(true);
    const result = await generateDescriptionAction(aiKeywords);
    if (result.description) {
      form.setValue(`items.${aiTargetIndex}.description`, result.description, { shouldValidate: true });
      setAiTargetIndex(null);
      setAiKeywords('');
    } else {
      toast({ variant: 'destructive', title: 'AI Error', description: result.error });
    }
    setAiLoading(false);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="flex items-center gap-4">
          <Button type="button" variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </div>
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Customer Details</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <FormField control={form.control} name="customerName" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer Name</FormLabel>
                    <FormControl><Input placeholder="e.g., Anjali Sharma" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="customerPhone" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl><Input placeholder="e.g., 9876543210" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="customerAddress" render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Address</FormLabel>
                    <FormControl><Textarea placeholder="Full customer address" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Invoice Items</CardTitle>
                </CardHeader>
                <CardContent>
                    {/* Desktop Table */}
                    <div className="hidden md:block">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="min-w-[250px]">Description</TableHead>
                                    <TableHead>Purity</TableHead>
                                    <TableHead>Gross Wt</TableHead>
                                    <TableHead>Net Wt</TableHead>
                                    <TableHead>Rate</TableHead>
                                    <TableHead>Making</TableHead>
                                    <TableHead className="text-right">Amount</TableHead>
                                    <TableHead className="w-12"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {fields.map((field, index) => {
                                    const item = watchedItems[index];
                                    const itemTotal = (Number(item.netWeight) || 0) * (Number(item.rate) || 0) + (Number(item.making) || 0);
                                    return (
                                        <TableRow key={field.id}>
                                            <TableCell>
                                                <FormField control={form.control} name={`items.${index}.description`} render={({ field }) => (
                                                <FormItem>
                                                    <div className="flex items-center gap-1">
                                                    <Textarea placeholder="Item description" {...field} className="min-h-0 h-10 min-w-[200px] md:min-w-[250px]"/>
                                                    <Dialog onOpenChange={(open) => !open && setAiTargetIndex(null)}>
                                                        <DialogTrigger asChild>
                                                        <Button type="button" variant="ghost" size="icon" className="shrink-0 text-accent" onClick={() => setAiTargetIndex(index)}>
                                                            <Sparkles className="h-4 w-4" />
                                                        </Button>
                                                        </DialogTrigger>
                                                        <DialogContent>
                                                            <DialogHeader>
                                                                <DialogTitle>Generate Item Description</DialogTitle>
                                                            </DialogHeader>
                                                            <div className="space-y-4">
                                                                <p>Enter keywords to generate a description for your jewellery item.</p>
                                                                <Input 
                                                                placeholder="e.g., gold ring 22k diamond"
                                                                value={aiKeywords}
                                                                onChange={(e) => setAiKeywords(e.target.value)}
                                                                />
                                                                <Button onClick={handleGenerateDescription} disabled={aiLoading || !aiKeywords} className="w-full">
                                                                {aiLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                                                                Generate with AI
                                                                </Button>
                                                            </div>
                                                        </DialogContent>
                                                    </Dialog>
                                                    </div>
                                                    <FormMessage />
                                                </FormItem>
                                                )} />
                                            </TableCell>
                                             <TableCell>
                                                <FormField control={form.control} name={`items.${index}.purity`} render={({ field }) => (
                                                <FormItem>
                                                  <FormControl>
                                                    <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                                                      <SelectTrigger className="min-w-[70px] md:min-w-[90px]">
                                                        <SelectValue placeholder="Purity" />
                                                      </SelectTrigger>
                                                      <SelectContent>
                                                        <SelectItem value="10">10</SelectItem>
                                                        <SelectItem value="12">12</SelectItem>
                                                        <SelectItem value="14">14</SelectItem>
                                                        <SelectItem value="18">18</SelectItem>
                                                        <SelectItem value="20">20</SelectItem>
                                                        <SelectItem value="22">22</SelectItem>
                                                        <SelectItem value="24">24</SelectItem>
                                                      </SelectContent>
                                                    </Select>
                                                  </FormControl>
                                                  <FormMessage />
                                                </FormItem>
                                                )} />
                                            </TableCell>
                                            <TableCell>
                                                <FormField control={form.control} name={`items.${index}.grossWeight`} render={({ field }) => (
                                                <FormItem><FormControl><Input type="number" placeholder="g" {...field} className="min-w-[70px] md:min-w-[90px]" /></FormControl><FormMessage /></FormItem>
                                                )} />
                                            </TableCell>
                                            <TableCell>
                                                <FormField control={form.control} name={`items.${index}.netWeight`} render={({ field }) => (
                                                <FormItem><FormControl><Input type="number" placeholder="g" {...field} className="min-w-[70px] md:min-w-[90px]" /></FormControl><FormMessage /></FormItem>
                                                )} />
                                            </TableCell>
                                            <TableCell>
                                                <FormField control={form.control} name={`items.${index}.rate`} render={({ field }) => (
                                                <FormItem><FormControl><Input type="number" placeholder="Rate" {...field} className="min-w-[70px] md:min-w-[90px]" /></FormControl><FormMessage /></FormItem>
                                                )} />
                                            </TableCell>
                                            <TableCell>
                                                <FormField control={form.control} name={`items.${index}.making`} render={({ field }) => (
                                                <FormItem><FormControl><Input type="number" placeholder="Charges" {...field} className="min-w-[70px] md:min-w-[90px]" /></FormControl><FormMessage /></FormItem>
                                                )} />
                                            </TableCell>
                                            <TableCell className="text-right font-medium">{formatCurrency(itemTotal)}</TableCell>
                                            <TableCell>
                                                <Button type="button" variant="ghost" size="icon" onClick={() => fields.length > 1 && remove(index)} disabled={fields.length <= 1}>
                                                <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Mobile Cards */}
                     <div className="md:hidden space-y-4">
                        {fields.map((field, index) => {
                             const item = watchedItems[index];
                             const itemTotal = (Number(item.netWeight) || 0) * (Number(item.rate) || 0) + (Number(item.making) || 0);
                             return (
                                <div key={field.id} className="border rounded-lg p-4 space-y-4">
                                    <FormField control={form.control} name={`items.${index}.description`} render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Description</FormLabel>
                                            <div className="flex items-center gap-1">
                                                <FormControl>
                                                    <Textarea placeholder="Item description" {...field} />
                                                </FormControl>
                                                <Dialog onOpenChange={(open) => !open && setAiTargetIndex(null)}>
                                                    <DialogTrigger asChild>
                                                    <Button type="button" variant="ghost" size="icon" className="shrink-0 text-accent" onClick={() => setAiTargetIndex(index)}>
                                                        <Sparkles className="h-4 w-4" />
                                                    </Button>
                                                    </DialogTrigger>
                                                    <DialogContent>
                                                        <DialogHeader>
                                                            <DialogTitle>Generate Item Description</DialogTitle>
                                                        </DialogHeader>
                                                        <div className="space-y-4">
                                                            <p>Enter keywords to generate a description for your jewellery item.</p>
                                                            <Input 
                                                            placeholder="e.g., gold ring 22k diamond"
                                                            value={aiKeywords}
                                                            onChange={(e) => setAiKeywords(e.target.value)}
                                                            />
                                                            <Button onClick={handleGenerateDescription} disabled={aiLoading || !aiKeywords} className="w-full">
                                                            {aiLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                                                            Generate with AI
                                                            </Button>
                                                        </div>
                                                    </DialogContent>
                                                </Dialog>
                                            </div>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <FormField control={form.control} name={`items.${index}.purity`} render={({ field }) => (
                                            <FormItem>
                                              <FormLabel>Purity</FormLabel>
                                              <FormControl>
                                                <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                                                  <SelectTrigger>
                                                    <SelectValue placeholder="Purity" />
                                                  </SelectTrigger>
                                                  <SelectContent>
                                                    <SelectItem value="10">10</SelectItem>
                                                    <SelectItem value="12">12</SelectItem>
                                                    <SelectItem value="14">14</SelectItem>
                                                    <SelectItem value="18">18</SelectItem>
                                                    <SelectItem value="20">20</SelectItem>
                                                    <SelectItem value="22">22</SelectItem>
                                                    <SelectItem value="24">24</SelectItem>
                                                  </SelectContent>
                                                </Select>
                                              </FormControl>
                                              <FormMessage />
                                            </FormItem>
                                        )} />
                                        <FormField control={form.control} name={`items.${index}.grossWeight`} render={({ field }) => (
                                            <FormItem><FormLabel>Gross Wt</FormLabel><FormControl><Input type="number" placeholder="g" {...field} /></FormControl><FormMessage /></FormItem>
                                        )} />
                                        <FormField control={form.control} name={`items.${index}.netWeight`} render={({ field }) => (
                                            <FormItem><FormLabel>Net Wt</FormLabel><FormControl><Input type="number" placeholder="g" {...field} /></FormControl><FormMessage /></FormItem>
                                        )} />
                                        <FormField control={form.control} name={`items.${index}.rate`} render={({ field }) => (
                                            <FormItem><FormLabel>Rate</FormLabel><FormControl><Input type="number" placeholder="Rate" {...field} /></FormControl><FormMessage /></FormItem>
                                        )} />
                                        <FormField control={form.control} name={`items.${index}.making`} render={({ field }) => (
                                            <FormItem><FormLabel>Making Charges</FormLabel><FormControl><Input type="number" placeholder="Charges" {...field} /></FormControl><FormMessage /></FormItem>
                                        )} />
                                    </div>
                                    <div className="flex justify-between items-center pt-2 border-t">
                                        <span className="font-medium">Amount: {formatCurrency(itemTotal)}</span>
                                        <Button type="button" variant="ghost" size="icon" onClick={() => fields.length > 1 && remove(index)} disabled={fields.length <= 1}>
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </div>
                                </div>
                            )
                        })}
                    </div>


                    <Button type="button" variant="outline" size="sm" className="mt-4" onClick={() => append({ id: uuidv4(), description: '', purity: '22', grossWeight: 0, netWeight: 0, rate: 0, making: 0 })}>
                        <PlusCircle className="mr-2 h-4 w-4" /> Add Item
                    </Button>
                </CardContent>
            </Card>

          </div>

          <div className="lg:col-span-1 space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Invoice Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField control={form.control} name="invoiceDate" render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Invoice Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button variant="outline" className={cn('w-full pl-3 text-left font-normal', !field.value && 'text-muted-foreground')}>
                            {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="paid">Paid</SelectItem>
                          <SelectItem value="due">Due</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                 <div className="flex justify-between"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
                  <FormField control={form.control} name="discount" render={({ field }) => (
                      <FormItem>
                          <div className="flex items-center justify-between">
                              <FormLabel>Discount</FormLabel>
                              <FormControl><Input type="number" className="w-32 text-right" {...field} /></FormControl>
                          </div>
                           <FormMessage />
                      </FormItem>
                  )} />
                  <div className="flex gap-4">
                    <FormField control={form.control} name="sgst" render={({ field }) => (
                        <FormItem className="flex-1">
                            <div className="flex items-center justify-between">
                              <FormLabel>SGST (%)</FormLabel>
                              <FormControl><Input type="number" className="w-20 text-right" {...field} /></FormControl>
                            </div>
                            <FormMessage />
                        </FormItem>
                    )} />
                    <FormField control={form.control} name="cgst" render={({ field }) => (
                        <FormItem className="flex-1">
                            <div className="flex items-center justify-between">
                              <FormLabel>CGST (%)</FormLabel>
                              <FormControl><Input type="number" className="w-20 text-right" {...field} /></FormControl>
                            </div>
                            <FormMessage />
                        </FormItem>
                    )} />
                  </div>
              </CardContent>
              <CardFooter className="flex justify-between font-bold text-lg bg-muted/50 py-4">
                <span>Grand Total</span>
                <span>{formatCurrency(grandTotal)}</span>
              </CardFooter>
            </Card>
            
            <Button type="submit" className="w-full" disabled={isPending || settingsLoading}>
              {(isPending || settingsLoading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {invoice ? 'Update' : 'Create'} Invoice
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}
