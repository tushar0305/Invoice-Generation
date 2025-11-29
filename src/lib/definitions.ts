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

  // Normalized Link
  customerId?: string;

  // Snapshot Data (Preserves history)
  customerSnapshot?: {
    name: string;
    address?: string;
    state?: string;
    pincode?: string;
    phone?: string;
    gstNumber?: string;
    email?: string;
  };

  // Legacy Columns (Deprecated but kept for now)
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
// Enhanced Customer Types
// ============================================

export type Customer = {
  id: string;
  userId: string;
  shopId: string;
  createdBy?: string;
  updatedBy?: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  gstNumber?: string;
  loyaltyPoints: number;
  totalSpent: number;
  lastVisitAt?: string;
  notes?: string;
  tags?: string[];
  createdAt?: string;
  updatedAt?: string;
};

export type CustomerLoyaltyLog = {
  id: string;
  customerId: string;
  shopId: string;
  invoiceId?: string;
  pointsChange: number;
  reason?: string;
  createdAt: string;
};

export type CustomerLedgerEntry = {
  id: string;
  customerId: string;
  shopId: string;
  invoiceId?: string;
  type: 'credit' | 'debit';
  amount: number;
  description?: string;
  dueDate?: string;
  isCleared: boolean;
  createdAt: string;
  createdBy?: string;
};

// ============================================
// Staff Management Types
// ============================================

export type StaffProfile = {
  id: string;
  userId?: string; // Link to auth user if they have login
  shopId: string;
  fullName: string;
  designation?: string;
  phoneNumber?: string;
  joiningDate?: string;
  salaryType?: 'monthly' | 'daily' | 'commission';
  baseSalary?: number;
  isActive: boolean;
  createdAt: string;
};

export type StaffAttendance = {
  id: string;
  staffId: string;
  shopId: string;
  date: string; // YYYY-MM-DD
  status: 'present' | 'absent' | 'half_day' | 'leave';
  checkInTime?: string;
  checkOutTime?: string;
  notes?: string;
  createdAt: string;
};

export type StaffPayment = {
  id: string;
  staffId: string;
  shopId: string;
  amount: number;
  paymentDate: string; // YYYY-MM-DD
  paymentType: 'salary' | 'advance' | 'bonus' | 'commission';
  description?: string;
  createdBy?: string;
  createdAt: string;
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
  theme: 'light' | 'dark' | 'system';
  language: string;
  notificationsEnabled: boolean;
  currency: string;
  onboardingCompleted?: boolean;
  onboardingStep?: number;
  onboardingCompletedAt?: string;
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

// Backward Compatibility: UserSettings type alias
// Many components still reference UserSettings - this maps to Shop type
export type UserSettings = Shop & {
  userId: string; // Maps to createdBy
  migratedToShopId?: string; // Legacy field
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

