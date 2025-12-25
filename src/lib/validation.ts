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

// ========================================
// INVOICE VALIDATION
// ========================================

export const InvoiceItemSchema = z.object({
  id: z.string().optional(),
  stockId: z.string().optional(),
  description: z.string().min(1, 'Description is required'),
  hsnCode: z.string().optional(),
  metalType: z.string().optional(),
  category: z.string().optional(),
  purity: z.string().default('22K'),

  // Weights (Standardized to numeric)
  grossWeight: z.coerce.number().gt(0, 'Gross weight is required'),
  stoneWeight: z.coerce.number().min(0).default(0),
  netWeight: z.coerce.number().gt(0, 'Net weight is required'),
  wastagePercent: z.coerce.number().min(0).default(0),

  // Value Components
  rate: z.coerce.number().min(1, 'Rate is required'),
  makingRate: z.coerce.number().min(0).default(0), // Per gram
  making: z.number().default(0), // Legacy (calculated or fixed total)
  stoneAmount: z.coerce.number().min(0).default(0),
  tagId: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.netWeight > data.grossWeight) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Net weight cannot exceed gross weight",
      path: ["netWeight"],
    });
  }
});

export const InvoiceSchema = z.object({
  customerName: z.string().min(1, 'Customer name is required'),
  customerAddress: z.string().optional(),
  customerState: z.string().optional(),
  customerPincode: z.string().optional(),
  customerPhone: z.string()
    .min(1, "Phone number is required")
    .regex(/^[6-9]\d{9}$/, "Invalid phone number (10 digits required)"),
  customerEmail: z.preprocess(
    (val) => (val === null || val === undefined) ? '' : String(val),
    z.string().email().or(z.literal('')).optional()
  ),
  invoiceDate: z.date(),
  // Global current rate (₹/g) to apply when item rate is not set
  currentRate: z.coerce.number().min(0).default(0),
  items: z.array(InvoiceItemSchema).min(1, 'At least one item is required'),
  discount: z.coerce.number().min(0).default(0),
  status: z.enum(['paid', 'due']),
  redeemPoints: z.boolean().default(false),
  pointsToRedeem: z.coerce.number().min(0).default(0),
});

export type InvoiceFormValues = z.infer<typeof InvoiceSchema>;
