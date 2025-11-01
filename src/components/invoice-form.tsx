'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useFieldArray, useForm } from 'react-hook-form';
import { z } from 'zod';
import { format } from 'date-fns';
import { CalendarIcon, Loader2, PlusCircle, Sparkles, Trash2, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
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
import type { Invoice, InvoiceItem } from '@/lib/definitions';
import { cn, formatCurrency } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useUser } from '@/firebase';
import { getFirestore, doc, writeBatch, collection, getDocs, query, where, serverTimestamp } from 'firebase/firestore';


const formSchema = z.object({
  customerName: z.string().min(2, 'Customer name is required'),
  customerAddress: z.string().min(5, 'Customer address is required'),
  customerPhone: z.string().min(10, 'A valid phone number is required'),
  invoiceDate: z.date({ required_error: 'Invoice date is required' }),
  items: z.array(z.object({
      id: z.string(),
      description: z.string().min(1, 'Description is required'),
      weight: z.coerce.number().positive('Weight must be positive'),
      rate: z.coerce.number().min(0, 'Rate is required'),
      makingCharges: z.coerce.number().min(0, 'Making charges are required'),
    })).min(1, 'At least one item is required'),
  discount: z.coerce.number().min(0, 'Discount cannot be negative'),
  tax: z.coerce.number().min(0).max(100, 'Tax should be a percentage'),
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


export function InvoiceForm({ invoice }: InvoiceFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [aiLoading, setAiLoading] = useState(false);
  const [aiKeywords, setAiKeywords] = useState('');
  const [aiTargetIndex, setAiTargetIndex] = useState<number | null>(null);
  const { user } = useUser();
  const firestore = getFirestore();

  const defaultValues: Partial<InvoiceFormValues> = invoice
    ? {
        ...invoice,
        invoiceDate: new Date(invoice.invoiceDate),
        items: invoice.items.map(item => ({...item}))
      }
    : {
        customerName: '',
        customerAddress: '',
        customerPhone: '',
        invoiceDate: new Date(),
        items: [{ id: uuidv4(), description: '', weight: 0, rate: 0, makingCharges: 0 }],
        discount: 0,
        tax: 3,
        status: 'due',
      };

  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
    mode: 'onChange',
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  const watchedItems = form.watch('items');
  const watchedDiscount = form.watch('discount');
  const watchedTax = form.watch('tax');

  const calculateTotals = () => {
    const subtotal = watchedItems.reduce((acc, item) => {
      const itemTotal = (item.weight || 0) * (item.rate || 0) + (item.makingCharges || 0);
      return acc + itemTotal;
    }, 0);
    const discountAmount = watchedDiscount || 0;
    const subtotalAfterDiscount = subtotal - discountAmount;
    const taxAmount = subtotalAfterDiscount * ((watchedTax || 0) / 100);
    const grandTotal = subtotalAfterDiscount + taxAmount;
    return { subtotal, discountAmount, taxAmount, grandTotal };
  };
  
  const { subtotal, grandTotal } = calculateTotals();

  async function onSubmit(data: InvoiceFormValues) {
    if (!user) {
        toast({ variant: 'destructive', title: 'Authentication Error', description: 'You must be logged in to save an invoice.'});
        return;
    }

    startTransition(async () => {
      try {
        const invoiceId = invoice?.id ?? doc(collection(firestore, 'invoices')).id;
        const invoiceRef = doc(firestore, 'invoices', invoiceId);
        
        const { items, ...invoiceMainData } = data;

        const batch = writeBatch(firestore);

        if (invoice) { // This is an UPDATE
            const invoicePayload = {
                ...invoiceMainData,
                invoiceDate: format(data.invoiceDate, 'yyyy-MM-dd'),
                updatedAt: serverTimestamp(),
            };
            batch.update(invoiceRef, invoicePayload);
        } else { // This is a CREATE
            const invoiceNumber = await getNextInvoiceNumber(firestore, user.uid);
            const invoicePayload = {
                ...invoiceMainData,
                id: invoiceId,
                userId: user.uid,
                invoiceNumber: invoiceNumber,
                invoiceDate: format(data.invoiceDate, 'yyyy-MM-dd'),
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            };
            batch.set(invoiceRef, invoicePayload);
        }

        // For both create and update, we sync the subcollection of items.
        // First, we could delete old items if this is an update, but for simplicity, we'll just overwrite.
        items.forEach((item) => {
            const itemRef = doc(firestore, `invoices/${invoiceId}/invoiceItems`, item.id);
            batch.set(itemRef, item);
        });
        
        await batch.commit();
        
        toast({
          title: `Invoice ${invoice ? 'updated' : 'created'} successfully!`,
          description: `Redirecting to view invoice...`,
        });
        router.push(`/dashboard/invoices/${invoiceId}/view`);
        router.refresh();

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
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-2/5">Description</TableHead>
                      <TableHead>Weight</TableHead>
                      <TableHead>Rate</TableHead>
                      <TableHead>Making</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fields.map((field, index) => {
                      const item = watchedItems[index];
                      const itemTotal = (item.weight || 0) * (item.rate || 0) + (item.makingCharges || 0);
                      return (
                        <TableRow key={field.id}>
                          <TableCell>
                            <FormField control={form.control} name={`items.${index}.description`} render={({ field }) => (
                              <FormItem>
                                <div className="flex items-center gap-1">
                                  <Textarea placeholder="Item description" {...field} className="min-h-0 h-10"/>
                                  <Dialog onOpenChange={(open) => !open && setAiTargetIndex(null)}>
                                    <DialogTrigger asChild>
                                      <Button type="button" variant="ghost" size="icon" className="shrink-0 text-accent" onClick={() => setAiTargetIndex(index)}>
                                        <Sparkles className="h-4 w-4" />
                                      </Button>
                                    </DialogTrigger>
                                  </Dialog>
                                </div>
                                <FormMessage />
                              </FormItem>
                            )} />
                          </TableCell>
                          <TableCell>
                            <FormField control={form.control} name={`items.${index}.weight`} render={({ field }) => (
                              <FormItem><FormControl><Input type="number" placeholder="g / ct" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                          </TableCell>
                          <TableCell>
                            <FormField control={form.control} name={`items.${index}.rate`} render={({ field }) => (
                              <FormItem><FormControl><Input type="number" placeholder="Rate" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                          </TableCell>
                           <TableCell>
                            <FormField control={form.control} name={`items.${index}.makingCharges`} render={({ field }) => (
                              <FormItem><FormControl><Input type="number" placeholder="Charges" {...field} /></FormControl><FormMessage /></FormItem>
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
                <Button type="button" variant="outline" size="sm" className="mt-4" onClick={() => append({ id: uuidv4(), description: '', weight: 0, rate: 0, makingCharges: 0 })}>
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
                  <FormField control={form.control} name="tax" render={({ field }) => (
                      <FormItem>
                          <div className="flex items-center justify-between">
                            <FormLabel>Tax (GST %) </FormLabel>
                            <FormControl><Input type="number" className="w-32 text-right" {...field} /></FormControl>
                          </div>
                          <FormMessage />
                      </FormItem>
                  )} />
              </CardContent>
              <CardFooter className="flex justify-between font-bold text-lg bg-muted/50 py-4">
                <span>Grand Total</span>
                <span>{formatCurrency(grandTotal)}</span>
              </CardFooter>
            </Card>
            
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {invoice ? 'Update' : 'Create'} Invoice
            </Button>
          </div>
        </div>
      </form>
      {aiTargetIndex !== null && (
        <Dialog open={aiTargetIndex !== null} onOpenChange={(open) => !open && setAiTargetIndex(null)}>
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
      )}
    </Form>
  );
}
