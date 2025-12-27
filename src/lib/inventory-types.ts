// Inventory Item Types - Unique Product Tagging System

export type MetalType = 'GOLD' | 'SILVER' | 'DIAMOND' | 'PLATINUM';
export type Purity = '24K' | '22K' | '18K' | '14K' | '916' | '999' | 'Silver' | '925';
export type MakingChargeType = 'PER_GRAM' | 'FIXED' | 'PERCENT';
export type ItemStatus = 'IN_STOCK' | 'RESERVED' | 'SOLD' | 'EXCHANGED' | 'LOANED' | 'MELTED' | 'DAMAGED';
export type LocationType = 'SHOWCASE' | 'VAULT' | 'SENT_FOR_REPAIR' | 'OTHER';
export type SourceType = 'VENDOR_PURCHASE' | 'CUSTOMER_EXCHANGE' | 'MELT_REMAKE' | 'GIFT_RECEIVED';

export interface InventoryItem {
    id: string;
    tag_id: string;
    qr_data: string | null;
    shop_id: string;

    // Classification
    metal_type: MetalType;
    purity: Purity | string;
    category: string | null;
    sub_category?: string | null;
    collection?: string | null;
    huid?: string | null;
    vendor_id?: string | null;
    batch_id?: string | null;
    hsn_code: string | null;

    // Physical Properties
    gross_weight: number;
    net_weight: number;
    stone_weight: number;
    wastage_percent: number;

    // Pricing
    making_charge_type: MakingChargeType;
    making_charge_value: number;
    stone_value: number;

    // Lifecycle
    status: ItemStatus;

    // Disposition
    sold_invoice_id: string | null;
    sold_at: string | null;

    // Description
    name: string | null;
    description?: string | null;

    // Storage location (e.g., showcase, vault)
    location?: string | null;

    // Audit
    created_at: string;
    updated_at: string;
    created_by: string | null;
    updated_by: string | null;
}

export interface InventoryStatusHistory {
    id: string;
    item_id: string;
    old_status: ItemStatus | null;
    new_status: ItemStatus;
    old_location: string | null;
    new_location: string | null;
    reason: string | null;
    reference_id: string | null;
    reference_type: 'INVOICE' | 'LOAN' | 'EXCHANGE' | null;
    created_at: string;
    created_by: string | null;
}

export interface CreateInventoryItemPayload {
    shop_id: string;
    name?: string;  // Optional - auto-generated from category + tag_id
    metal_type: MetalType;
    purity: string;

    category?: string;
    sub_category?: string;
    collection?: string;
    huid?: string;
    vendor_id?: string;
    batch_id?: string;
    hsn_code?: string;
    gross_weight: number;
    net_weight: number;
    stone_weight?: number;
    wastage_percent?: number;
    making_charge_type?: MakingChargeType;
    making_charge_value?: number;
    stone_value?: number;
}

export interface UpdateInventoryItemPayload extends Partial<CreateInventoryItemPayload> {
    status?: ItemStatus;
}

// QR Code configuration
export const QR_CONFIG = {
    // Minimal size for small jewelry tags (rings, earrings)
    SMALL_SIZE: 64,   // 64x64 pixels ≈ 8-10mm when printed at 150 DPI
    // Normal size for medium items
    MEDIUM_SIZE: 96,  // 96x96 pixels ≈ 15mm
    // Large size for necklaces, heavy items
    LARGE_SIZE: 128,  // 128x128 pixels ≈ 20mm
    // Error correction level (L = 7%, M = 15%, Q = 25%, H = 30%)
    // Use L for smaller codes (less data overhead)
    ERROR_CORRECTION: 'L',
} as const;

// Category Hierarchies
// Category Hierarchies with Sub-Categories
export const INVENTORY_CATEGORIES: Record<MetalType, Record<string, string[]>> = {
    GOLD: {
        'Ring': ['Ladies', 'Gents', 'Couple', 'Baby', 'Engagement'],
        'Chain': ['Rope', 'Box', 'Lotus', 'Machine', 'Hollow'],
        'Necklace': ['Choker', 'Long', 'Bridal', 'Light Weight'],
        'Bangle': ['Patla', 'Kada', 'Chudi', 'Bombay'],
        'Bracelet': ['Ladies', 'Gents', 'Kids'],
        'Earring': ['Studs', 'Jhumka', 'Bali', 'Drops'],
        'Pendant': ['Gents', 'Ladies', 'God', 'Alphabet'],
        'Mangalsutra': ['Short', 'Long', 'Pendant Only'],
        'Nose Pin': ['Press', 'Screw'],
        'Coin': ['1g', '2g', '5g', '8g', '10g', '20g'],
        'Bar': [],
        'Other': []
    },
    SILVER: {
        'Payal': ['Bombay', 'Agra', 'Fancy', 'Light Weight'],
        'Ring': ['Ladies', 'Gents', 'Bichiya'],
        'Chain': ['Gents', 'Ladies'],
        'Bracelet': ['Gents', 'Ladies'],
        'Utensils': ['Glass', 'Bowl', 'Plate', 'Spoon', 'Set'],
        'Idol': ['Ganesh', 'Lakshmi', 'Radha Krishna'],
        'Coin': ['5g', '10g', '20g', '50g', '100g'],
        'Bar': [],
        'Other': []
    },
    DIAMOND: {
        'Ring': ['Solitaire', 'Cluster', 'Band'],
        'Necklace': ['Choker', 'Set'],
        'Earring': ['Studs', 'Drops'],
        'Pendant': [],
        'Bracelet': [],
        'Bangle': [],
        'Nose Pin': [],
        'Other': []
    },
    PLATINUM: {
        'Ring': ['Couple Bands', 'Solitaire'],
        'Chain': [],
        'Bracelets': [],
        'Other': []
    }
};

export const ALL_CATEGORIES = Array.from(new Set(
    Object.values(INVENTORY_CATEGORIES).flatMap(cat => Object.keys(cat))
));

export const METAL_TYPES: MetalType[] = ['GOLD', 'SILVER', 'DIAMOND', 'PLATINUM'];

// Audit Types
export interface InventoryAudit {
    id: string;
    shop_id: string;
    status: 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
    started_at: string;
    completed_at?: string;
    total_items_snapshot: number;
    verified_items_count: number;
    missing_items_count: number;
    notes?: string;
}

export interface InventoryAuditItem {
    id: string;
    audit_id: string;
    inventory_item_id: string;
    status: 'VERIFIED' | 'MISSING' | 'EXTRA';
    scanned_at: string;
}

export const PURITY_OPTIONS: Record<MetalType, string[]> = {
    GOLD: ['24K', '22K', '18K', '14K'],
    SILVER: ['999', '925', 'Silver'],
    DIAMOND: ['22K', '18K', '14K'], // Mount purity
    PLATINUM: ['950', '900', '850'],
};

export const STATUS_LABELS: Record<ItemStatus, { label: string; color: string }> = {
    IN_STOCK: { label: 'In Stock', color: 'green' },
    RESERVED: { label: 'Reserved', color: 'yellow' },
    SOLD: { label: 'Sold', color: 'blue' },
    EXCHANGED: { label: 'Exchanged', color: 'purple' },
    LOANED: { label: 'Gold Loan', color: 'orange' },
    MELTED: { label: 'Melted', color: 'gray' },
    DAMAGED: { label: 'Damaged', color: 'red' },
};
