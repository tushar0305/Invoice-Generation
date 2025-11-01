export type InvoiceItem = {
  id: string;
  description: string;
  weight: number;
  rate: number;
  makingCharges: number;
};

export type Invoice = {
  id: string; // db id
  invoiceNumber: string; // user-facing id
  customerName: string;
  customerAddress: string;
  customerPhone: string;
  invoiceDate: string; // YYYY-MM-DD
  items: InvoiceItem[];
  discount: number; // as a currency value
  tax: number; // as a percentage
  status: 'paid' | 'due';
};
