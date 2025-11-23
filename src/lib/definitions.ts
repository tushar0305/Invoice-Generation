export type InvoiceItem = {
  id: string;
  description: string;
  purity: string;
  grossWeight: number;
  netWeight: number;
  rate: number;
  making: number;
};

export type Invoice = {
  id: string; // db id
  userId: string; // DEPRECATED: kept for backward compatibility, use createdBy
  shopId: string; // Shop this invoice belongs to
  createdBy: string; // User who created this invoice
  createdByName?: string; // Name of the user who created this invoice
  updatedBy?: string; // User who last updated this invoice
  invoiceNumber: string; // user-facing id
  customerName: string;
  customerAddress: string;
  customerState?: string;
  customerPincode?: string;
  customerPhone: string;
  invoiceDate: string; // YYYY-MM-DD
  discount: number; // as a currency value
  sgst: number; // as a percentage
  cgst: number; // as a percentage
  tax?: number; // DEPRECATED: kept for backward compatibility, use sgst and cgst instead
  status: 'paid' | 'due';
  grandTotal: number; // Denormalized for performance
  createdAt?: any;
  updatedAt?: any;
};

export type UserSettings = {
  id: string;
  userId: string;
  cgstRate: number;
  sgstRate: number;
  shopName?: string; // Display name of the shop
  gstNumber?: string; // GST identification number
  panNumber?: string; // PAN number
  address?: string; // Shop address / location
  state?: string;   // State / Region
  pincode?: string; // Postal code / PIN
  phoneNumber?: string; // Contact phone number
  email?: string; // Contact email (defaults to auth email, not editable in UI)
  logoUrl?: string; // Shop logo URL from Supabase storage
  templateId?: string; // Invoice template ID (classic, modern, minimal)
  migratedToShopId?: string; // DEPRECATED: Reference to migrated shop ID
};

export type StockItem = {
  id: string; // Document ID
  userId: string; // DEPRECATED: kept for backward compatibility
  shopId: string; // Shop this stock belongs to
  createdBy: string; // User who created this stock item
  updatedBy?: string; // User who last updated this stock item
  name: string; // Item name (e.g., "Gold Ring", "Silver Bracelet")
  description?: string; // Additional description
  purity: string; // Purity (e.g., "22K", "92.5", "999")
  basePrice: number; // Base price per unit
  baseWeight?: number; // Base weight if applicable (e.g., 1 gram, 1 piece)
  makingChargePerGram: number; // Making charge per gram
  quantity: number; // Current stock quantity
  unit: string; // Unit of measurement (e.g., "gram", "piece", "ml")
  category?: string; // Category for organization (e.g., "Gold", "Silver", "Bronze")
  isActive: boolean; // Whether this item is available for invoices
  createdAt?: any;
  updatedAt?: any;
};

// ============================================
// RBAC and Multi-Shop Types
// ============================================

export type UserRole = 'owner' | 'manager' | 'staff';

export type Shop = {
  id: string;
  shopName: string;
  gstNumber?: string;
  panNumber?: string;
  address?: string;
  state?: string;
  pincode?: string;
  phoneNumber?: string;
  email?: string;
  logoUrl?: string;
  templateId?: string;
  cgstRate: number;
  sgstRate: number;
  isActive: boolean;
  createdBy: string;
  createdAt?: string;
  updatedAt?: string;
};

export type UserShopRole = {
  id: string;
  userId: string;
  shopId: string;
  role: UserRole;
  inviteCode?: string; // 6-digit code for invitation
  invitedBy?: string;
  invitedAt?: string;
  acceptedAt?: string; // NULL if invitation pending
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type UserPreferences = {
  userId: string;
  lastActiveShopId?: string;
  theme: 'light' | 'dark';
  language: string;
  createdAt?: string;
  updatedAt?: string;
};

// Permission helper type
export type Permission = {
  canCreateInvoices: boolean;
  canEditAllInvoices: boolean; // false for staff (only own)
  canDeleteInvoices: boolean;
  canExportInvoices: boolean;
  canManageStock: boolean; // false for staff
  canViewStock: boolean;
  canEditSettings: boolean; // owner only
  canInviteStaff: boolean; // owner only
  canViewAnalytics: boolean;
  canCreateShop: boolean; // owner only
};

