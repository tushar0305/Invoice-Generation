'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, notFound, useSearchParams } from 'next/navigation';
import type { Invoice, InvoiceItem } from '@/lib/definitions';
import { supabase } from '@/supabase/client';
import { Loader2 } from 'lucide-react';
import InvoicePdfTemplate from '@/components/invoice-pdf-template';
import { format } from 'date-fns';

const DEFAULT_SHOP = {
    shopName: 'Jewellers Store',
    address: 'Address Not Set',
    gstNumber: 'GST Not Set',
    panNumber: 'PAN Not Set',
    phoneNumber: '',
    email: '',
    state: '',
    pincode: '',
};

function toWords(num: number): string {
    const a = ['', 'one ', 'two ', 'three ', 'four ', 'five ', 'six ', 'seven ', 'eight ', 'nine ', 'ten ', 'eleven ', 'twelve ', 'thirteen ', 'fourteen ', 'fifteen ', 'sixteen ', 'seventeen ', 'eighteen ', 'nineteen '];
    const b = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
    function inWords(n: number): string {
        if (n < 20) return a[n];
        const digit = n % 10;
        return b[Math.floor(n / 10)] + (digit ? '-' : '') + a[digit];
    }
    if (num === 0) return 'zero';
    let str = '';
    const crores = Math.floor(num / 10000000);
    if (crores > 0) { str += inWords(crores) + ' crore '; num %= 10000000; }
    const lakhs = Math.floor(num / 100000);
    if (lakhs > 0) { str += inWords(lakhs) + ' lakh '; num %= 100000; }
    const thousands = Math.floor(num / 1000);
    if (thousands > 0) { str += inWords(thousands) + ' thousand '; num %= 1000; }
    const hundreds = Math.floor(num / 100);
    if (hundreds > 0) { str += inWords(hundreds) + ' hundred '; num %= 100; }
    if (num > 0) { str += inWords(num); }
    return str.trim().replace(/\s+/g, ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function f2(n: number) {
    return (Number(n) || 0).toFixed(2);
}

export function PrintInvoiceClient() {
    const searchParams = useSearchParams();
    const id = searchParams.get('id') as string;
    const params = useParams(); // Keep for compatibility if needed, but id comes from searchParams
    const search = searchParams; // Alias for existing code usage
    const printTriggered = useRef(false);
    const [invoice, setInvoice] = useState<Invoice | null>(null);
    const [items, setItems] = useState<InvoiceItem[] | null>(null);
    const [loading, setLoading] = useState(true);
    const [settings, setSettings] = useState<any | null>(null);

    useEffect(() => {
        let cancelled = false;
        async function load() {
            setLoading(true);

            // Fetch invoice first to get user_id
            const { data: inv, error: invErr } = await supabase
                .from('invoices')
                .select('*')
                .eq('id', id)
                .single();

            if (invErr || !inv) {
                setInvoice(null);
                setItems(null);
                setLoading(false);
                return;
            }

            // Fetch shop details using shop_id from invoice
            const { data: shopDetails, error: settingsErr } = await supabase
                .from('shops')
                .select('*')
                .eq('id', inv.shop_id)
                .single();

            if (!cancelled) {
                if (settingsErr) {
                    console.error('Error fetching shop settings:', settingsErr);
                    setSettings(null);
                } else if (shopDetails) {
                    setSettings({
                        id: shopDetails.id,
                        userId: inv.user_id,
                        cgstRate: Number(shopDetails.cgst_rate) || 0,
                        sgstRate: Number(shopDetails.sgst_rate) || 0,
                        shopName: shopDetails.shop_name || 'Jewellers Store',
                        gstNumber: shopDetails.gst_number || '',
                        panNumber: shopDetails.pan_number || '',
                        address: shopDetails.address || '',
                        state: shopDetails.state || '',
                        pincode: shopDetails.pincode || '',
                        phoneNumber: shopDetails.phone_number || '',
                        email: shopDetails.email || '',
                        logoUrl: shopDetails.logo_url,
                    } as any);
                }

                // Map invoice data
                const mappedInv: Invoice = {
                    id: inv.id,
                    shopId: inv.shop_id,
                    invoiceNumber: inv.invoice_number,
                    customerId: inv.customer_id,
                    customerSnapshot: inv.customer_snapshot,
                    invoiceDate: inv.invoice_date,
                    status: inv.status,
                    subtotal: Number(inv.subtotal) || 0,
                    discount: Number(inv.discount) || 0,
                    cgstAmount: Number(inv.cgst_amount) || 0,
                    sgstAmount: Number(inv.sgst_amount) || 0,
                    grandTotal: Number(inv.grand_total) || 0,
                    notes: inv.notes,
                    createdByName: inv.created_by_name,
                    createdBy: inv.created_by,
                    createdAt: inv.created_at,
                    updatedAt: inv.updated_at,
                };
                setInvoice(mappedInv);

                // Fetch invoice items
                const { data: its, error: itErr } = await supabase
                    .from('invoice_items')
                    .select('*')
                    .eq('invoice_id', id)
                    .order('id');
                if (itErr) {
                    console.error('Error fetching invoice items:', itErr);
                    setItems([]);
                } else {
                    const mappedItems: InvoiceItem[] = (its ?? []).map((r: any) => ({
                        id: r.id,
                        description: r.description,
                        purity: r.purity,
                        grossWeight: Number(r.gross_weight) || 0,
                        netWeight: Number(r.net_weight) || 0,
                        stoneWeight: Number(r.stone_weight) || 0,
                        stoneAmount: Number(r.stone_amount) || 0,
                        wastagePercent: Number(r.wastage_percent) || 0,
                        rate: Number(r.rate) || 0,
                        makingRate: Number(r.making_rate) || 0,
                        making: Number(r.making) || 0,
                    }));
                    setItems(mappedItems);
                }
            }

            setLoading(false);
        }
        load();
        return () => { cancelled = true; };
    }, [id]);

    const isLoading = loading;

    useEffect(() => {
        if (!isLoading && invoice && items && !printTriggered.current) {
            // Skip auto print when embedding this page inside an iframe for PDF capture
            const isEmbed = search?.get('embed') === '1';
            if (isEmbed) return;
            printTriggered.current = true;
            setTimeout(() => window.print(), 500);
        }
    }, [isLoading, invoice, items, search]);

    useEffect(() => {
        if (process.env.NODE_ENV === 'development') {
            console.log('Invoice ID:', id);
        }
    }, [id]);

    if (isLoading) {
        return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }
    if (!invoice) {
        return (
            <div id="print-root" className="invoice-container flex h-screen items-center justify-center">
                <div className="text-center">
                    <p className="text-sm text-muted-foreground">Invoice not found or you don't have access.</p>
                </div>
            </div>
        );
    }
    // Ensure items is a list for rendering
    const safeItems = items ?? [];

    // Making charge now applied per net gram basis
    const subtotal = safeItems.reduce((acc, item) => acc + (item.netWeight * item.rate) + (item.netWeight * item.making), 0);
    const totalBeforeTax = subtotal - invoice.discount;
    // Use new sgst/cgst fields, fallback to tax/2 for backward compatibility
    // Use settings for tax rates
    const cgstRate = settings?.cgstRate || 0;
    const sgstRate = settings?.sgstRate || 0;
    const cgst = totalBeforeTax * (cgstRate / 100);
    const sgst = totalBeforeTax * (sgstRate / 100);
    const totalAmount = totalBeforeTax + cgst + sgst;
    const roundOff = Math.round(totalAmount) - totalAmount;
    const finalAmount = Math.round(totalAmount);

    // Merge settings with defaults
    const shopProfile = {
        name: settings?.shopName || DEFAULT_SHOP.shopName,
        address: settings?.address || DEFAULT_SHOP.address,
        state: settings?.state || DEFAULT_SHOP.state,
        pincode: settings?.pincode || DEFAULT_SHOP.pincode,
        gst: settings?.gstNumber || DEFAULT_SHOP.gstNumber,
        pan: settings?.panNumber || DEFAULT_SHOP.panNumber,
        phone: settings?.phoneNumber || DEFAULT_SHOP.phoneNumber,
        email: settings?.email || DEFAULT_SHOP.email,
    };

    return (
        <div id="print-root" className="invoice-container">
            <InvoicePdfTemplate invoice={invoice} items={safeItems} settings={settings} />
        </div>
    );
}
