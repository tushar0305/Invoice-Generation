'use server';

/**
 * @fileOverview Generates descriptions for invoice items based on input keywords using an AI tool.
 *
 * - generateInvoiceItemDescription - A function that handles the generation of invoice item descriptions.
 * - GenerateInvoiceItemDescriptionInput - The input type for the generateInvoiceItemDescription function.
 * - GenerateInvoiceItemDescriptionOutput - The return type for the generateInvoiceItemDescription function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateInvoiceItemDescriptionInputSchema = z.object({
  keywords: z
    .string()
    .describe('Keywords to use to generate invoice item description.'),
});
export type GenerateInvoiceItemDescriptionInput = z.infer<
  typeof GenerateInvoiceItemDescriptionInputSchema
>;

const GenerateInvoiceItemDescriptionOutputSchema = z.object({
  description: z
    .string()
    .describe('The generated description for the invoice item.'),
});
export type GenerateInvoiceItemDescriptionOutput = z.infer<
  typeof GenerateInvoiceItemDescriptionOutputSchema
>;

export async function generateInvoiceItemDescription(
  input: GenerateInvoiceItemDescriptionInput
): Promise<GenerateInvoiceItemDescriptionOutput> {
  return generateInvoiceItemDescriptionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateInvoiceItemDescriptionPrompt',
  input: {schema: GenerateInvoiceItemDescriptionInputSchema},
  output: {schema: GenerateInvoiceItemDescriptionOutputSchema},
  prompt: `You are an expert at generating invoice item descriptions based on keywords.

  Generate an invoice item description based on the following keywords: {{{keywords}}}`,
});

const generateInvoiceItemDescriptionFlow = ai.defineFlow(
  {
    name: 'generateInvoiceItemDescriptionFlow',
    inputSchema: GenerateInvoiceItemDescriptionInputSchema,
    outputSchema: GenerateInvoiceItemDescriptionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
