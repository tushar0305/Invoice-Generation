'use server';

import { z } from 'zod';
import { saveInvoice, getInvoiceById, deleteInvoice as deleteInvoiceFromDb } from '@/lib/data';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { generateInvoiceItemDescription } from '@/ai/flows/generate-invoice-item-description';
import type { Invoice } from './definitions';

const InvoiceFormSchema = z.object({
  id: z.string().optional(),
  customerName: z.string().min(2, "Customer name must be at least 2 characters."),
  customerAddress: z.string().min(5, "Customer address must be at least 5 characters."),
  customerPhone: z.string().min(10, "A valid 10-digit phone number is required.").max(15),
  invoiceDate: z.string().refine((date) => !isNaN(Date.parse(date)), { message: "Invalid date format." }),
  items: z.array(z.object({
    id: z.string(),
    description: z.string().min(1, "Description is required."),
    weight: z.coerce.number().positive("Weight must be a positive number."),
    rate: z.coerce.number().min(0, "Rate must be a non-negative number."),
    makingCharges: z.coerce.number().min(0, "Making charges must be non-negative."),
  })).min(1, "At least one item is required."),
  discount: z.coerce.number().min(0, "Discount must be a non-negative number."),
  tax: z.coerce.number().min(0).max(100, "Tax must be between 0 and 100."),
  status: z.enum(['paid', 'due']),
});

type UpsertInvoiceData = Omit<Invoice, 'invoiceNumber'>;

export async function upsertInvoice(data: UpsertInvoiceData) {
  const validatedFields = InvoiceFormSchema.safeParse(data);

  if (!validatedFields.success) {
    console.error('Validation errors:', validatedFields.error.flatten().fieldErrors);
    throw new Error('Invalid invoice data.');
  }

  try {
    await saveInvoice(validatedFields.data);
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to save invoice.');
  }

  // No longer redirecting from server action, page will handle it.
}

export async function deleteInvoice(invoiceId: string) {
  if (!invoiceId) {
    throw new Error('Invoice ID is required for deletion.');
  }
  try {
    await deleteInvoiceFromDb(invoiceId);
    // Revalidation is handled in the data function
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to delete invoice.');
  }
  // Redirect to the invoices list after deletion
  redirect('/dashboard/invoices');
}


export async function generateDescriptionAction(keywords: string): Promise<{description?: string, error?: string}> {
  if (!keywords) {
    return { error: 'Keywords are required.' };
  }
  try {
    const result = await generateInvoiceItemDescription({ keywords });
    return { description: result.description };
  } catch (error) {
    console.error('AI description generation failed:', error);
    return { error: 'Failed to generate description from AI.' };
  }
}

export async function updateInvoiceStatus(invoiceId: string, status: 'paid' | 'due') {
  try {
    const invoice = await getInvoiceById(invoiceId);
    if (!invoice) {
      throw new Error('Invoice not found');
    }
    await saveInvoice({ ...invoice, status });
    revalidatePath('/dashboard/invoices');
    revalidatePath(`/dashboard/invoices/${invoiceId}/view`);
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to update invoice status.');
  }
}