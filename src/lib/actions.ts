'use server';

import { generateInvoiceItemDescription } from '@/ai/flows/generate-invoice-item-description';

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
