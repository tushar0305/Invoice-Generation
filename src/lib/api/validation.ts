import { z } from 'zod';
import { APIError } from './utils';

/**
 * Validates data against a Zod schema
 * Throws APIError with validation details on failure
 */
export function validate<T>(schema: z.ZodSchema<T>, data: unknown): T {
    const result = schema.safeParse(data);

    if (!result.success) {
        const errors = result.error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
        }));

        throw new APIError(
            `Validation failed: ${errors.map(e => `${e.field}: ${e.message}`).join(', ')}`,
            400,
            'VALIDATION_ERROR'
        );
    }

    return result.data;
}

// ============================================
// Reusable Schemas for Common Data Types
// ============================================

export const UUIDSchema = z.string().uuid();

export const ShopIdSchema = z.object({
    shopId: UUIDSchema,
});

export const PaginationSchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
});

// ============================================
// Loan-specific Schemas
// ============================================

export const PaymentSchema = z.object({
    amount: z.number().positive('Amount must be positive'),
    paymentType: z.enum(['principal', 'interest', 'full_settlement']),
    paymentMethod: z.enum(['cash', 'upi', 'bank_transfer']),
    notes: z.string().max(500).optional(),
});

export const CloseLoanSchema = z.object({
    settlementAmount: z.number().positive().optional(),
    settlementNotes: z.string().max(1000).optional(),
    collateralConfirmed: z.boolean().refine(val => val === true, {
        message: 'Collateral return must be confirmed',
    }),
});

export const CreateLoanSchema = z.object({
    shopId: UUIDSchema,
    customerId: UUIDSchema,
    loanNumber: z.string().min(1).max(50),
    principalAmount: z.number().positive(),
    interestRate: z.number().min(0).max(100),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    collateral: z.array(z.object({
        itemName: z.string().min(1),
        itemType: z.enum(['gold', 'silver', 'diamond', 'other']),
        grossWeight: z.number().positive(),
        netWeight: z.number().positive(),
        purity: z.string().optional(),
        estimatedValue: z.number().positive().optional(),
    })).min(1, 'At least one collateral item required'),
});

// ============================================
// Invoice-specific Schemas
// ============================================

export const InvoiceItemSchema = z.object({
    id: z.string().optional(), // Form may send this, but it's not required for DB
    description: z.string().min(1),
    purity: z.string(),
    grossWeight: z.number().nonnegative(),
    netWeight: z.number().nonnegative(),
    rate: z.number().nonnegative(),
    making: z.number().nonnegative(),
});

export const CreateInvoiceSchema = z.object({
    shopId: UUIDSchema,
    customerId: UUIDSchema.optional(),
    customerName: z.string().min(1),
    customerPhone: z.string().optional(),
    customerEmail: z.string().email().optional().or(z.literal('')),
    customerAddress: z.string().optional(),
    customerState: z.string().optional(),
    customerPincode: z.string().optional(),
    items: z.array(InvoiceItemSchema).min(1, 'At least one item required'),
    discount: z.number().nonnegative().default(0),
    notes: z.string().max(1000).optional(),
    status: z.enum(['paid', 'due']).default('due'),
    loyaltyPointsRedeemed: z.number().nonnegative().optional(),
    loyaltyPointsEarned: z.number().nonnegative().optional(),
    loyaltyDiscountAmount: z.number().nonnegative().optional(),
});

// ============================================
// Khata-specific Schemas
// ============================================

export const KhataTransactionSchema = z.object({
    customerId: UUIDSchema,
    shopId: UUIDSchema,
    type: z.enum(['given', 'received']),
    amount: z.number().positive(),
    description: z.string().max(500).optional(),
    dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

// ============================================
// Customer-specific Schemas
// ============================================

export const CreateCustomerSchema = z.object({
    shopId: UUIDSchema,
    name: z.string().min(1).max(100),
    email: z.string().email().optional().or(z.literal('')),
    phone: z.string().min(10, 'Phone must have at least 10 digits').max(15).optional(),
    address: z.string().max(500).optional(),
    gstNumber: z.string().max(15).optional(),
    state: z.string().max(100).optional(),
    pincode: z.string().max(10).optional(),
    openingBalance: z.number().nonnegative().optional(),
});

export const UpdateCustomerSchema = CreateCustomerSchema.partial().omit({ shopId: true });

// ============================================
// Stock-specific Schemas
// ============================================

export const StockItemSchema = z.object({
    shopId: UUIDSchema,
    name: z.string().min(1),
    description: z.string().optional(),
    purity: z.string().min(1),
    basePrice: z.number().nonnegative(),
    baseWeight: z.number().nonnegative().optional(),
    makingChargePerGram: z.number().nonnegative(),
    quantity: z.number().nonnegative(),
    unit: z.string().min(1),
    category: z.string().optional(),
    isActive: z.boolean().default(true),
});

export const UpdateStockItemSchema = StockItemSchema.partial().omit({ shopId: true });
