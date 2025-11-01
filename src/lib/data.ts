import type { Invoice } from './definitions';

// In-memory store for invoices
let invoices: Invoice[] = [
  {
    id: '1',
    invoiceNumber: 'INV-2024-001',
    customerName: 'Anjali Sharma',
    customerAddress: '123, Diamond Street, Mumbai, 400001',
    customerPhone: '9876543210',
    invoiceDate: '2024-07-15',
    items: [
      { id: 'item-1', description: '22K Gold Chain', weight: 10.5, rate: 6500, makingCharges: 5000 },
      { id: 'item-2', description: 'Solitaire Diamond Ring 1.5ct', weight: 2.1, rate: 50000, makingCharges: 15000 },
    ],
    discount: 2500,
    tax: 3,
  },
  {
    id: '2',
    invoiceNumber: 'INV-2024-002',
    customerName: 'Rohan Mehta',
    customerAddress: '456, Pearl Avenue, Delhi, 110001',
    customerPhone: '9988776655',
    invoiceDate: '2024-07-20',
    items: [
      { id: 'item-1', description: 'Silver Anklets (Pair)', weight: 50, rate: 120, makingCharges: 2000 },
    ],
    discount: 500,
    tax: 3,
  },
];

const ARTIFICIAL_DELAY = 100;

export async function getInvoices(): Promise<Invoice[]> {
  await new Promise(resolve => setTimeout(resolve, ARTIFICIAL_DELAY));
  return invoices;
}

export async function getInvoiceById(id: string): Promise<Invoice | undefined> {
  await new Promise(resolve => setTimeout(resolve, ARTIFICIAL_DELAY));
  return invoices.find(invoice => invoice.id === id);
}

export async function getNextInvoiceNumber(): Promise<string> {
    await new Promise(resolve => setTimeout(resolve, ARTIFICIAL_DELAY));
    if (invoices.length === 0) {
        return 'INV-2024-001';
    }
    const latestInvoiceNumber = invoices
        .map(inv => parseInt(inv.invoiceNumber.split('-')[2]))
        .reduce((max, current) => Math.max(max, current), 0);
    const nextNumber = latestInvoiceNumber + 1;
    return `INV-2024-${String(nextNumber).padStart(3, '0')}`;
}

export async function saveInvoice(invoiceData: Omit<Invoice, 'id' | 'invoiceNumber'> & { id?: string }): Promise<Invoice> {
    await new Promise(resolve => setTimeout(resolve, ARTIFICIAL_DELAY));

    if (invoiceData.id) {
        // Update existing invoice
        const index = invoices.findIndex(inv => inv.id === invoiceData.id);
        if (index !== -1) {
            invoices[index] = { ...invoices[index], ...invoiceData, id: invoiceData.id };
            return invoices[index];
        }
        throw new Error("Invoice not found for update");
    } else {
        // Create new invoice
        const newInvoice: Invoice = {
            id: String(Date.now()),
            invoiceNumber: await getNextInvoiceNumber(),
            ...invoiceData,
        };
        invoices.push(newInvoice);
        return newInvoice;
    }
}
