import { z } from 'zod';

// Helper: Sanitize string input (remove potential XSS)
const sanitizeString = (str: string) => {
    return str
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
};

// Phone number validation (Indian format)
const phoneRegex = /^[6-9]\d{9}$/;

// ========================================
// CUSTOMER VALIDATION
// ========================================

export const CustomerSchema = z.object({
    name: z
        .string()
        .min(1, 'Name is required')
        .max(255, 'Name is too long')
        .regex(/^[a-zA-Z\s.'-]+$/, 'Name contains invalid characters')
        .transform(sanitizeString),

    phone: z
        .string()
        .regex(phoneRegex, 'Invalid phone number (10 digits starting with 6-9)')
        .optional()
        .or(z.literal('')),

    email: z
        .string()
        .email('Invalid email address')
        .max(255)
        .optional()
        .or(z.literal('')),

    address: z
        .string()
        .max(500, 'Address is too long')
        .optional()
        .or(z.literal(''))
        .transform((val) => val ? sanitizeString(val) : val),

    gstNumber: z
        .string()
        .regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'Invalid GST number')
        .optional()
        .or(z.literal('')),
});

export type CustomerInput = z.infer<typeof CustomerSchema>;

// ========================================
// INVOICE ITEM VALIDATION
// ========================================

export const InvoiceItemSchema = z.object({
    description: z
        .string()
        .min(1, 'Description is required')
        .max(500, 'Description is too long')
        .transform(sanitizeString),

    quantity: z
        .number()
        .positive('Quantity must be positive')
        .max(10000, 'Quantity is too large')
        .int('Quantity must be a whole number'),

    rate: z
        .number()
        .nonnegative('Rate must be non-negative')
        .max(10000000, 'Rate is too large'),

    purity: z
        .number()
        .min(0)
        .max(100)
        .optional(),

    weight: z
        .number()
        .positive()
        .max(100000)
        .optional(),
});

export type InvoiceItemInput = z.infer<typeof InvoiceItemSchema>;

// ========================================
// INVOICE VALIDATION
// ========================================

export const InvoiceSchema = z.object({
    customerId: z.string().uuid('Invalid customer ID'),

    customerName: z
        .string()
        .min(1, 'Customer name is required')
        .max(255)
        .regex(/^[a-zA-Z\s.'-]+$/, 'Name contains invalid characters')
        .transform(sanitizeString),

    customerPhone: z
        .string()
        .regex(phoneRegex, 'Invalid phone number')
        .optional()
        .or(z.literal('')),

    items: z
        .array(InvoiceItemSchema)
        .min(1, 'At least one item is required')
        .max(100, 'Too many items'),

    discount: z
        .number()
        .min(0, 'Discount cannot be negative')
        .max(100, 'Discount cannot exceed 100%')
        .optional()
        .default(0),

    notes: z
        .string()
        .max(1000, 'Notes are too long')
        .optional()
        .or(z.literal(''))
        .transform((val) => val ? sanitizeString(val) : val),
});

export type InvoiceInput = z.infer<typeof InvoiceSchema>;

// ========================================
// STOCK ITEM VALIDATION
// ========================================

export const StockItemSchema = z.object({
    name: z
        .string()
        .min(1, 'Item name is required')
        .max(255, 'Name is too long')
        .transform(sanitizeString),

    category: z
        .enum(['gold', 'silver', 'diamond', 'platinum', 'other'])
        .default('gold'),

    weight: z
        .number()
        .positive('Weight must be positive')
        .max(100000, 'Weight is too large'),

    purity: z
        .number()
        .min(0, 'Purity cannot be negative')
        .max(100, 'Purity cannot exceed 100'),

    quantity: z
        .number()
        .int('Quantity must be a whole number')
        .nonnegative('Quantity cannot be negative')
        .max(10000, 'Quantity is too large'),

    price: z
        .number()
        .nonnegative('Price cannot be negative')
        .max(100000000, 'Price is too large'),

    description: z
        .string()
        .max(500, 'Description is too long')
        .optional()
        .or(z.literal(''))
        .transform((val) => val ? sanitizeString(val) : val),
});

export type StockItemInput = z.infer<typeof StockItemSchema>;

// ========================================
// SHOP VALIDATION
// ========================================

export const ShopSchema = z.object({
    name: z
        .string()
        .min(1, 'Shop name is required')
        .max(255, 'Shop name is too long')
        .regex(/^[a-zA-Z0-9\s.'-]+$/, 'Shop name contains invalid characters')
        .transform(sanitizeString),

    address: z
        .string()
        .min(1, 'Address is required')
        .max(500, 'Address is too long')
        .transform(sanitizeString),

    phone: z
        .string()
        .regex(phoneRegex, 'Invalid phone number'),

    gstNumber: z
        .string()
        .regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'Invalid GST number')
        .optional()
        .or(z.literal('')),

    email: z
        .string()
        .email('Invalid email address')
        .max(255)
        .optional()
        .or(z.literal('')),
});

export type ShopInput = z.infer<typeof ShopSchema>;
