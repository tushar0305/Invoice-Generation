
import { z } from "zod";

export const customerSchema = z.object({
    id: z.string().optional(), // If selecting existing
    name: z.string().min(2, "Name must be at least 2 characters"),
    phone: z.string().min(10, "Phone number must be valid"),
    address: z.string().optional(),
    photo_url: z.string().optional(),
    isNew: z.boolean().default(false),
});

export const collateralItemSchema = z.object({
    id: z.string().optional(),
    item_name: z.string().min(2, "Item name is required"),
    item_type: z.enum(["gold", "silver", "diamond", "other"]),
    purity: z.string().min(1, "Purity is required"),
    gross_weight: z.number().positive("Weight must be positive"),
    net_weight: z.number().min(0, "Net weight cannot be negative"),
    estimated_value: z.number().min(0),
    description: z.string().optional(),
    photo_urls: z.array(z.string()).default([]),
});

export const documentSchema = z.object({
    id: z.string(),
    name: z.string(),
    type: z.string(), // identity, address, etc.
    file: z.any().optional(), // File object
    previewUrl: z.string().optional()
});

export const loanTermsSchema = z.object({
    loan_number: z.string().min(1, "Loan number is required"),
    start_date: z.date(),
    principal_amount: z.number().positive("Principal amount must be positive"),
    interest_rate: z.number().min(0, "Interest rate cannot be negative"),
});

export const loanWizardSchema = z.object({
    customer: customerSchema,
    collateral: z.array(collateralItemSchema).min(1, "At least one collateral item is required"),
    documents: z.array(documentSchema).default([]),
    terms: loanTermsSchema,
});

export type LoanWizardValues = z.infer<typeof loanWizardSchema>;
export type CustomerValues = z.infer<typeof customerSchema>;
export type CollateralItemValues = z.infer<typeof collateralItemSchema>;
export type DocumentValues = z.infer<typeof documentSchema>;
export type LoanTermsValues = z.infer<typeof loanTermsSchema>;
