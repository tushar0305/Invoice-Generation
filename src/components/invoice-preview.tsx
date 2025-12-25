import React, { useRef, useEffect, useState } from 'react';
import InvoicePdfTemplate from '@/components/invoice-pdf-template';
import { UserSettings, Invoice } from '@/lib/definitions';

interface LiveInvoicePreviewProps {
    data: any;
    settings: UserSettings | null;
    invoiceNumber?: string;
}

export function LiveInvoicePreview({ data, settings, invoiceNumber = "INV-PREVIEW" }: LiveInvoicePreviewProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState(1);

    useEffect(() => {
        const updateScale = () => {
            if (containerRef.current) {
                const parent = containerRef.current.parentElement;
                if (parent) {
                    const availableWidth = parent.clientWidth - 48; // Padding
                    const availableHeight = parent.clientHeight - 48; // Padding
                    
                    // 210mm x 297mm at 96 DPI is approx 794px x 1123px
                    const targetWidth = 794;
                    const targetHeight = 1123;

                    const scaleX = availableWidth / targetWidth;
                    const scaleY = availableHeight / targetHeight;

                    // Fit entirely within the screen (both width and height)
                    // But don't scale UP past 1 (original size)
                    const newScale = Math.min(1, scaleX, scaleY);
                    
                    setScale(newScale);
                }
            }
        };

        // Initial delay to allow layout to settle
        const timer = setTimeout(updateScale, 100);
        window.addEventListener('resize', updateScale);
        
        return () => {
            window.removeEventListener('resize', updateScale);
            clearTimeout(timer);
        };
    }, []);

    // Map form data to Invoice structure
    const invoice: Invoice = {
        id: 'preview',
        shopId: 'preview',
        invoiceNumber: invoiceNumber,
        invoiceDate: data.invoiceDate ? new Date(data.invoiceDate).toISOString() : new Date().toISOString(),
        status: data.status || 'due',
        customerSnapshot: {
            name: data.customerName || 'Customer Name',
            address: data.customerAddress || '',
            state: data.customerState || '',
            pincode: data.customerPincode || '',
            phone: data.customerPhone || '',
            gstNumber: '', 
            email: '',
        },
        subtotal: data.subtotal || 0,
        discount: Number(data.discount) || 0,
        cgstAmount: data.cgstAmount || 0,
        sgstAmount: data.sgstAmount || 0,
        grandTotal: data.grandTotal || 0,
        createdAt: new Date().toISOString(),
    } as Invoice;

    const items = data.items || [];

    return (
        <div className="w-full h-full flex items-center justify-center bg-slate-100/50 overflow-hidden rounded-lg border border-slate-200" ref={containerRef}>
            <div 
                style={{ 
                    transform: `scale(${scale})`, 
                    transformOrigin: 'center center',
                    width: '210mm', // Fixed A4 width
                    height: '297mm', // Fixed A4 height
                }}
                className="bg-white shadow-2xl transition-transform duration-200 ease-out shrink-0 flex flex-col"
            >
                <InvoicePdfTemplate 
                    invoice={invoice} 
                    items={items} 
                    settings={settings} 
                />
            </div>
        </div>
    );
}
