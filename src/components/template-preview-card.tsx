"use client";

import React from 'react';
import InvoicePdfTemplate from '@/components/invoice-pdf-template';
import { Invoice, InvoiceItem } from '@/lib/definitions';

const dummyInvoice: Invoice = {
    id: 'preview',
    invoiceNumber: 'INV-001',
    customerSnapshot: {
        name: 'John Doe',
        phone: '9876543210',
        address: '123 Main St, City',
        state: 'State',
        pincode: '123456'
    },
    // totalAmount removed as it's not in Invoice type
    grandTotal: 55000,
    subtotal: 50000,
    createdBy: 'preview',
    status: 'paid',
    // items removed
    createdAt: new Date().toISOString(),
    // userId removed
    invoiceDate: new Date().toISOString(),
    discount: 0,
    cgstAmount: 1.5,
    sgstAmount: 1.5,
    // paymentMode removed
    shopId: 'preview',
};

const dummyItems: InvoiceItem[] = [
    {
        id: '1',
        description: 'Gold Ring',
        purity: '22K',
        grossWeight: 5.5,
        netWeight: 5.0,
        stoneWeight: 0,
        stoneAmount: 0,
        wastagePercent: 0,
        rate: 5000,
        makingRate: 0,
        making: 500,
    },
    {
        id: '2',
        description: 'Silver Chain',
        purity: '92.5',
        grossWeight: 10.5,
        netWeight: 10.0,
        stoneWeight: 0,
        stoneAmount: 0,
        wastagePercent: 0,
        rate: 70,
        makingRate: 0,
        making: 20,
    }
];

const dummySettings = {
    shopName: 'Saambh Jewellers',
    address: 'Jewellery Market, City',
    phoneNumber: '9876543210',
    email: 'info@saambh.com',
    gstNumber: '22AAAAA0000A1Z5',
    templateId: 'classic',
};

interface TemplatePreviewCardProps {
    templateId: string;
}

export function TemplatePreviewCard({ templateId }: TemplatePreviewCardProps) {
    // Adjust settings to use the requested template
    const settings = { ...dummySettings, templateId };

    return (
        <div className="w-[210mm] h-[297mm] bg-white shadow-sm">
            <InvoicePdfTemplate
                invoice={dummyInvoice}
                items={dummyItems}
                settings={settings}
            />
        </div>
    );
}
