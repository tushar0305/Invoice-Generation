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
  userId: string; // a reference to the user who owns this invoice
  invoiceNumber: string; // user-facing id
  customerName: string;
  customerAddress: string;
  customerPhone: string;
  invoiceDate: string; // YYYY-MM-DD
  discount: number; // as a currency value
  tax: number; // as a percentage, used to derive CGST/SGST
  status: 'paid' | 'due';
  grandTotal: number; // Denormalized for performance
  createdAt?: any;
  updatedAt?: any;
};
