import * as XLSX from 'xlsx';
import type { Invoice } from './definitions';
import { format } from 'date-fns';

export function exportInvoicesToExcel(invoices: Invoice[], filename: string = 'invoices') {
    // Prepare data for export
    const data = invoices.map(inv => ({
        'Invoice #': inv.invoiceNumber,
        'Date': format(new Date(inv.invoiceDate), 'dd/MM/yyyy'),
        'Customer': inv.customerSnapshot?.name || 'Unknown',
        'Phone': inv.customerSnapshot?.phone || '-',
        'Status': inv.status,
        'Subtotal': inv.grandTotal ? `₹${inv.grandTotal.toLocaleString('en-IN')}` : '-',
        'Discount': inv.discount ? `${inv.discount}%` : '0%',
        'CGST': inv.cgstAmount ? `₹${inv.cgstAmount.toLocaleString('en-IN')}` : '-',
        'SGST': inv.sgstAmount ? `₹${inv.sgstAmount.toLocaleString('en-IN')}` : '-',
        'Grand Total': inv.grandTotal ? `₹${inv.grandTotal.toLocaleString('en-IN')}` : '-',
    }));

    // Create workbook and worksheet
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();

    // Set column widths
    ws['!cols'] = [
        { wch: 12 },  // Invoice #
        { wch: 12 },  // Date
        { wch: 25 },  // Customer
        { wch: 15 },  // Phone
        { wch: 10 },  // Status
        { wch: 15 },  // Subtotal
        { wch: 10 },  // Discount
        { wch: 12 },  // CGST
        { wch: 12 },  // SGST
        { wch: 15 },  // Grand Total
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Invoices');

    // Generate file
    const timestamp = format(new Date(), 'yyyy-MM-dd');
    XLSX.writeFile(wb, `${filename}_${timestamp}.xlsx`);
}

export function exportCustomersToExcel(customers: any[], filename: string = 'customers') {
    const data = customers.map(cust => ({
        'Name': cust.name,
        'Phone': cust.phone || '-',
        'Email': cust.email || '-',
        'Total Invoices': cust.invoiceCount || 0,
        'Total Spent': cust.totalSpent ? `₹${cust.totalSpent.toLocaleString('en-IN')}` : '₹0',
        'Last Purchase': cust.lastPurchase ? format(new Date(cust.lastPurchase), 'dd/MM/yyyy') : '-',
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();

    ws['!cols'] = [
        { wch: 25 },
        { wch: 15 },
        { wch: 25 },
        { wch: 15 },
        { wch: 15 },
        { wch: 15 },
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Customers');

    const timestamp = format(new Date(), 'yyyy-MM-dd');
    XLSX.writeFile(wb, `${filename}_${timestamp}.xlsx`);
}

export function exportStockToExcel(stockItems: any[], filename: string = 'stock') {
    const data = stockItems.map(item => ({
        'Item Name': item.name,
        'Category': item.category,
        'Weight (g)': item.weight,
        'Purity (%)': item.purity,
        'Quantity': item.quantity,
        'Price': `₹${item.price.toLocaleString('en-IN')}`,
        'Total Value': `₹${(item.price * item.quantity).toLocaleString('en-IN')}`,
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();

    ws['!cols'] = [
        { wch: 25 },
        { wch: 12 },
        { wch: 12 },
        { wch: 12 },
        { wch: 10 },
        { wch: 15 },
        { wch: 15 },
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Stock');

    const timestamp = format(new Date(), 'yyyy-MM-dd');
    XLSX.writeFile(wb, `${filename}_${timestamp}.xlsx`);
}
