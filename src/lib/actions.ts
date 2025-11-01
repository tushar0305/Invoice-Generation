'use server';

import { z } from 'zod';
import { saveInvoice } from '@/lib/data';
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

  revalidatePath('/dashboard');
  redirect('/dashboard');
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
