export type InvoiceItem = {
  id: string;
  description: string;
  purity: string;
  grossWeight: number;
  netWeight: number;
  rate: number;
  making: number;
  amount?: number; // Calculated field
};

export type Invoice = {
  id: string;
  shopId: string;
  invoiceNumber: string;
  customerId?: string;

  // Snapshot Data (Preserves history)
  customerSnapshot: {
    name: string;
    address?: string;
    state?: string;
    pincode?: string;
    phone?: string;
    gstNumber?: string;
    email?: string;
  };

  invoiceDate: string; // YYYY-MM-DD
  status: 'paid' | 'due' | 'cancelled';

  // Financials
  subtotal: number;
  discount: number;
  cgstAmount: number;
  sgstAmount: number;
  grandTotal: number;

  notes?: string;
  createdByName?: string;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type StockItem = {
  id: string;
  shopId: string;
  name: string;
  description?: string;
  purity: string;
  basePrice: number;
  makingChargePerGram: number;
  quantity: number;
  unit: string;
  category?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
};

// ============================================
// Unified Customer & Ledger Types
// ============================================

export type Customer = {
  id: string;
  shopId: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  state?: string;
  pincode?: string;
  gstNumber?: string;

  loyaltyPoints: number;
  totalSpent: number;

  notes?: string;
  tags?: string[];
  createdAt?: string;
  updatedAt?: string;
};

export type LedgerTransaction = {
  id: string;
  shopId: string;
  customerId: string;
  invoiceId?: string;

  transactionType: 'INVOICE' | 'PAYMENT' | 'ADJUSTMENT';
  amount: number;
  entryType: 'DEBIT' | 'CREDIT'; // DEBIT: Customer owes more, CREDIT: Customer pays

  description?: string;
  transactionDate: string; // YYYY-MM-DD
  createdAt: string;
  createdBy?: string;
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
  invitedBy?: string;
  invitedAt?: string;
  acceptedAt?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type UserPreferences = {
  userId: string;
  lastActiveShopId?: string;
  theme: 'light' | 'dark' | 'system';
  language: string;
  notificationsEnabled: boolean;
  currency: string;
  onboardingCompleted?: boolean;
  onboardingStep?: number;
  createdAt?: string;
  updatedAt?: string;
};

// Onboarding state tracking
export type OnboardingState = {
  step: number; // 0 = not started, 1 = basic info, 2 = business details, 3 = branding
  completed: boolean;
  shopId?: string;
  data: Partial<ShopSetupData>;
};

export type ShopSetupData = {
  // Step 1: Basic Info
  shopName: string;
  phoneNumber: string;
  email: string;

  // Step 2: Business Details
  address: string;
  state: string;
  pincode: string;
  gstNumber?: string;
  panNumber?: string;

  // Step 3: Branding
  logoUrl?: string;
  cgstRate: number;
  sgstRate: number;
  templateId: string;
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

export type UserSettings = {
  id?: string;
  userId?: string;
  shopName?: string;
  address?: string;
  state?: string;
  pincode?: string;
  phoneNumber?: string;
  email?: string;
  gstNumber?: string;
  panNumber?: string;
  logoUrl?: string;
  cgstRate?: number;
  sgstRate?: number;
  templateId?: string;
};
