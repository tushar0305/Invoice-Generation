"use client";

import React from 'react';
import type { Invoice, InvoiceItem, UserSettings } from '@/lib/definitions';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

type Props = {
  invoice: Invoice;
  items: InvoiceItem[];
  settings?: Partial<UserSettings> | null;
};

type TemplateProps = Props & {
  calculations: {
    subtotal: number;
    totalBeforeTax: number;
    cgstRate: number;
    sgstRate: number;
    cgst: number;
    sgst: number;
    totalAmount: number;
    roundOff: number;
    finalAmount: number;
    safeItems: InvoiceItem[];
  };
  shopDetails: {
    name: string;
    address: string;
    state: string;
    pincode: string;
    phone: string;
    email: string;
    gst: string;
    pan: string;
  };
};

function f2(n: number) {
  return (Number(n) || 0).toFixed(2);
}

function toWords(num: number): string {
  const a = [
    '', 'one ', 'two ', 'three ', 'four ', 'five ', 'six ', 'seven ', 'eight ', 'nine ', 'ten ',
    'eleven ', 'twelve ', 'thirteen ', 'fourteen ', 'fifteen ', 'sixteen ', 'seventeen ', 'eighteen ', 'nineteen '
  ];
  const b = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
  function inWords(n: number): string {
    if (n < 20) return a[n];
    const digit = n % 10;
    return b[Math.floor(n / 10)] + (digit ? '-' : '') + a[digit];
  }
  if (num === 0) return 'zero';
  let str = '';
  let n = Math.floor(num);
  const crores = Math.floor(n / 10000000);
  if (crores > 0) { str += inWords(crores) + ' crore '; n %= 10000000; }
  const lakhs = Math.floor(n / 100000);
  if (lakhs > 0) { str += inWords(lakhs) + ' lakh '; n %= 100000; }
  const thousands = Math.floor(n / 1000);
  if (thousands > 0) { str += inWords(thousands) + ' thousand '; n %= 1000; }
  const hundreds = Math.floor(n / 100);
  if (hundreds > 0) { str += inWords(hundreds) + ' hundred '; n %= 100; }
  if (n > 0) { str += inWords(n); }
  return str.trim().replace(/\s+/g, ' ').split(' ').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

// --- Classic Template (Original) ---
const ClassicTemplate = ({ invoice, items, settings, calculations, shopDetails }: TemplateProps) => {
  return (
    <div className="mx-auto w-full max-w-[210mm] bg-white text-[#111] text-[10px] leading-[1.5] p-4 font-sans border border-gray-200">
      {/* Header */}
      <div className="flex items-start justify-between pb-3">
        <div className="pr-4 min-w-[60%]">
          <div className="text-[22px] font-extrabold uppercase tracking-[0.3px] text-[#111]">{shopDetails.name}</div>
          <div className="mt-1 space-y-[2px] text-[#444]">
            <p>{shopDetails.address}</p>
            {shopDetails.state && <p>{shopDetails.state} {shopDetails.pincode && `- ${shopDetails.pincode}`}</p>}
            {shopDetails.phone && <p><span className="font-semibold">Phone:</span> {shopDetails.phone}</p>}
            {shopDetails.email && <p><span className="font-semibold">Email:</span> {shopDetails.email}</p>}
          </div>
        </div>
        <div className="text-right">
          <div className="text-[22px] font-extrabold uppercase text-[#D4AF37]">Tax Invoice</div>
          <div className="space-y-1 mt-1">
            <div><span className="font-semibold">Invoice No:</span> {invoice.invoiceNumber}</div>
            <div><span className="font-semibold">Date:</span> {format(new Date(invoice.invoiceDate), 'dd MMM, yyyy')}</div>
            <div><span className="font-semibold">GSTIN:</span> {shopDetails.gst || '—'}</div>
            <div><span className="font-semibold">PAN:</span> {shopDetails.pan || '—'}</div>
          </div>
        </div>
      </div>

      <div className="my-3 h-[1px] w-full border-t border-[#D4AF37]" />

      {/* Customer */}
      <div className="mb-3">
        <div className="text-[12px] font-bold uppercase text-[#800000]">Bill To</div>
        <div className="mt-1 space-y-[2px]">
          <p className="font-semibold">{invoice.customerName}</p>
          {invoice.customerAddress && <p>{invoice.customerAddress}</p>}
          {invoice.customerState && <p>{invoice.customerState}</p>}
          {invoice.customerPincode && <p>{invoice.customerPincode}</p>}
          {invoice.customerPhone && <p><span className="font-semibold">Phone:</span> {invoice.customerPhone}</p>}
        </div>
      </div>

      {/* Items table */}
      <table className="table w-full table-auto border-collapse" style={{ tableLayout: 'auto', width: '100%' }}>
        <thead>
          <tr>
            <th className="border border-gray-300 bg-gray-100 px-2 py-2 text-left text-[10px] font-bold uppercase tracking-wide" style={{ width: '5%' }}>#</th>
            <th className="border border-gray-300 bg-gray-100 px-2 py-2 text-left text-[10px] font-bold uppercase tracking-wide" style={{ width: '25%' }}>Description</th>
            <th className="border border-gray-300 bg-gray-100 px-2 py-2 text-left text-[10px] font-bold uppercase tracking-wide" style={{ width: '10%' }}>Purity</th>
            <th className="border border-gray-300 bg-gray-100 px-2 py-2 text-right text-[10px] font-bold uppercase tracking-wide" style={{ width: '12.5%' }}>Gross Wt</th>
            <th className="border border-gray-300 bg-gray-100 px-2 py-2 text-right text-[10px] font-bold uppercase tracking-wide" style={{ width: '12.5%' }}>Net Wt</th>
            <th className="border border-gray-300 bg-gray-100 px-2 py-2 text-right text-[10px] font-bold uppercase tracking-wide" style={{ width: '10%' }}>Rate</th>
            <th className="border border-gray-300 bg-gray-100 px-2 py-2 text-right text-[10px] font-bold uppercase tracking-wide" style={{ width: '10%' }}>Making</th>
            <th className="border border-gray-300 bg-gray-100 px-2 py-2 text-right text-[10px] font-bold uppercase tracking-wide" style={{ width: '15%' }}>Amount</th>
          </tr>
        </thead>
        <tbody>
          {calculations.safeItems.map((item, idx) => {
            const makingTotal = item.netWeight * item.making;
            const lineTotal = item.netWeight * item.rate + makingTotal;
            return (
              <tr key={item.id}>
                <td className="border border-gray-300 px-2 py-2 align-top">{idx + 1}</td>
                <td className="border border-gray-300 px-2 py-2 align-top">{item.description}</td>
                <td className="border border-gray-300 px-2 py-2 align-top">{item.purity}</td>
                <td className="border border-gray-300 px-2 py-2 text-right align-top">{f2(item.grossWeight)}</td>
                <td className="border border-gray-300 px-2 py-2 text-right align-top">{f2(item.netWeight)}</td>
                <td className="border border-gray-300 px-2 py-2 text-right align-top">₹ {f2(item.rate)}</td>
                <td className="border border-gray-300 px-2 py-2 text-right align-top">₹ {f2(makingTotal)}</td>
                <td className="border border-gray-300 px-2 py-2 text-right align-top">₹ {f2(lineTotal)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Summary */}
      <div className="mt-3 flex justify-end">
        <div className="w-full max-w-[350px]">
          <div className="flex items-center justify-between border-b border-gray-200 px-2 py-2">
            <span>Subtotal:</span>
            <span>₹ {f2(calculations.subtotal)}</span>
          </div>
          {invoice.discount > 0 && (
            <div className="flex items-center justify-between border-b border-gray-200 px-2 py-2">
              <span>Discount:</span>
              <span>-₹ {f2(invoice.discount)}</span>
            </div>
          )}
          <div className="flex items-center justify-between border-b border-gray-200 px-2 py-2">
            <span>CGST ({f2(calculations.cgstRate)}%):</span>
            <span>₹ {f2(calculations.cgst)}</span>
          </div>
          <div className="flex items-center justify-between border-b border-gray-200 px-2 py-2">
            <span>SGST ({f2(calculations.sgstRate)}%):</span>
            <span>₹ {f2(calculations.sgst)}</span>
          </div>
          {calculations.roundOff !== 0 && (
            <div className="flex items-center justify-between border-gray-200 px-2 py-2">
              <span>Round Off:</span>
              <span>₹ {f2(calculations.roundOff)}</span>
            </div>
          )}
          <div className="mt-1 flex items-center justify-between border-t-2 border-[#D4AF37] px-2 py-3 text-[16px] font-extrabold text-[#800000]">
            <span>Grand Total:</span>
            <span>₹ {f2(calculations.finalAmount)}</span>
          </div>
        </div>
      </div>

      {/* Words */}
      <div className="my-4 border-y border-dashed border-gray-300 px-3 py-3 text-[12px] italic">
        <p><span className="font-semibold not-italic">Amount in Words:</span> {toWords(calculations.finalAmount)} Rupees Only</p>
      </div>

      {/* Footer */}
      <div className="mt-10 flex items-end justify-between">
        <div className="text-[9px] text-gray-600">
          <h4 className="m-0 mb-1 font-semibold text-gray-900">Terms &amp; Conditions</h4>
          <p className="m-0">1. Goods once sold will not be taken back.</p>
          <p className="m-0">2. Subject to local jurisdiction.</p>
        </div>
        <div className="text-center">
          <div className="h-[0px]" />
          <p className="m-0 text-[11px]">Authorized Signatory</p>
        </div>
      </div>
    </div>
  );
};

// --- Modern Template ---
const ModernTemplate = ({ invoice, items, settings, calculations, shopDetails }: TemplateProps) => {
  return (
    <div className="mx-auto w-full max-w-[210mm] bg-white text-slate-800 text-[10px] leading-[1.5] p-6 font-sans">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">{shopDetails.name}</h1>
          <div className="text-slate-500 space-y-1">
            <p>{shopDetails.address}</p>
            {shopDetails.state && <p>{shopDetails.state} {shopDetails.pincode}</p>}
            {shopDetails.phone && <p>{shopDetails.phone}</p>}
            {shopDetails.email && <p>{shopDetails.email}</p>}
          </div>
        </div>
        <div className="text-right">
          <div className="bg-slate-100 px-4 py-2 rounded-lg mb-4 inline-block">
            <h2 className="text-xl font-bold text-slate-900">INVOICE</h2>
          </div>
          <div className="text-slate-600 space-y-1">
            <p><span className="font-medium text-slate-900">Invoice #:</span> {invoice.invoiceNumber}</p>
            <p><span className="font-medium text-slate-900">Date:</span> {format(new Date(invoice.invoiceDate), 'dd MMM, yyyy')}</p>
            {shopDetails.gst && <p><span className="font-medium text-slate-900">GSTIN:</span> {shopDetails.gst}</p>}
          </div>
        </div>
      </div>

      {/* Bill To */}
      <div className="bg-slate-50 rounded-xl p-4 mb-8">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">Bill To</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="font-bold text-lg text-slate-900">{invoice.customerName}</p>
            <p className="text-slate-600">{invoice.customerAddress}</p>
            <p className="text-slate-600">{invoice.customerState} {invoice.customerPincode}</p>
          </div>
          <div className="text-right">
            {invoice.customerPhone && <p className="text-slate-600">Phone: {invoice.customerPhone}</p>}
          </div>
        </div>
      </div>

      {/* Table */}
      <table className="w-full mb-8">
        <thead>
          <tr className="border-b-2 border-slate-100">
            <th className="py-3 text-left font-bold text-slate-900">Item Description</th>
            <th className="py-3 text-center font-bold text-slate-900">Purity</th>
            <th className="py-3 text-right font-bold text-slate-900">Net Wt</th>
            <th className="py-3 text-right font-bold text-slate-900">Rate</th>
            <th className="py-3 text-right font-bold text-slate-900">Making</th>
            <th className="py-3 text-right font-bold text-slate-900">Amount</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {calculations.safeItems.map((item) => {
            const makingTotal = item.netWeight * item.making;
            const lineTotal = item.netWeight * item.rate + makingTotal;
            return (
              <tr key={item.id}>
                <td className="py-3 text-slate-700">
                  <p className="font-medium text-slate-900">{item.description}</p>
                </td>
                <td className="py-3 text-center text-slate-600">{item.purity}</td>
                <td className="py-3 text-right text-slate-600">{f2(item.netWeight)} g</td>
                <td className="py-3 text-right text-slate-600">₹{f2(item.rate)}</td>
                <td className="py-3 text-right text-slate-600">₹{f2(makingTotal)}</td>
                <td className="py-3 text-right font-medium text-slate-900">₹{f2(lineTotal)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Totals */}
      <div className="flex justify-end mb-12">
        <div className="w-64 space-y-2">
          <div className="flex justify-between text-slate-600">
            <span>Subtotal</span>
            <span>₹{f2(calculations.subtotal)}</span>
          </div>
          {invoice.discount > 0 && (
            <div className="flex justify-between text-slate-600">
              <span>Discount</span>
              <span>-₹{f2(invoice.discount)}</span>
            </div>
          )}
          <div className="flex justify-between text-slate-600">
            <span>Tax (CGST+SGST)</span>
            <span>₹{f2(calculations.cgst + calculations.sgst)}</span>
          </div>
          <div className="border-t-2 border-slate-900 pt-2 flex justify-between font-bold text-lg text-slate-900">
            <span>Total</span>
            <span>₹{f2(calculations.finalAmount)}</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-slate-100 pt-6 flex justify-between items-end">
        <div className="text-slate-400 text-[9px]">
          <p>Terms & Conditions apply.</p>
          <p>Thank you for your business.</p>
        </div>
        <div className="text-center">
          <div className="h-12 border-b border-slate-300 w-32 mb-2"></div>
          <p className="text-xs font-medium text-slate-500">Authorized Signature</p>
        </div>
      </div>
    </div>
  );
};

// --- Minimal Template ---
const MinimalTemplate = ({ invoice, items, settings, calculations, shopDetails }: TemplateProps) => {
  return (
    <div className="mx-auto w-full max-w-[210mm] bg-white text-black text-[11px] leading-relaxed p-8 font-mono">
      {/* Header */}
      <div className="text-center mb-8 border-b-2 border-black pb-6">
        <h1 className="text-2xl font-bold uppercase tracking-widest mb-2">{shopDetails.name}</h1>
        <p>{shopDetails.address}</p>
        <p>{shopDetails.phone} | {shopDetails.email}</p>
        {shopDetails.gst && <p>GSTIN: {shopDetails.gst}</p>}
      </div>

      {/* Info Grid */}
      <div className="flex justify-between mb-8">
        <div>
          <p className="font-bold uppercase mb-1">Billed To:</p>
          <p>{invoice.customerName}</p>
          <p>{invoice.customerAddress}</p>
          <p>{invoice.customerPhone}</p>
        </div>
        <div className="text-right">
          <p><span className="font-bold">INVOICE NO:</span> {invoice.invoiceNumber}</p>
          <p><span className="font-bold">DATE:</span> {format(new Date(invoice.invoiceDate), 'dd-MM-yyyy')}</p>
        </div>
      </div>

      {/* Items */}
      <table className="w-full mb-8 border-collapse">
        <thead>
          <tr className="border-b border-black">
            <th className="py-2 text-left">ITEM</th>
            <th className="py-2 text-right">NET WT</th>
            <th className="py-2 text-right">RATE</th>
            <th className="py-2 text-right">MAKING</th>
            <th className="py-2 text-right">TOTAL</th>
          </tr>
        </thead>
        <tbody>
          {calculations.safeItems.map((item) => {
            const makingTotal = item.netWeight * item.making;
            const lineTotal = item.netWeight * item.rate + makingTotal;
            return (
              <tr key={item.id} className="border-b border-gray-100">
                <td className="py-2">{item.description} <span className="text-[9px] text-gray-500">({item.purity})</span></td>
                <td className="py-2 text-right">{f2(item.netWeight)}</td>
                <td className="py-2 text-right">{f2(item.rate)}</td>
                <td className="py-2 text-right">{f2(makingTotal)}</td>
                <td className="py-2 text-right">{f2(lineTotal)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Totals */}
      <div className="flex justify-end mb-12">
        <div className="w-1/2">
          <div className="flex justify-between py-1">
            <span>SUBTOTAL</span>
            <span>{f2(calculations.subtotal)}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-black">
            <span>TAXES</span>
            <span>{f2(calculations.cgst + calculations.sgst)}</span>
          </div>
          <div className="flex justify-between py-2 font-bold text-lg">
            <span>TOTAL</span>
            <span>{f2(calculations.finalAmount)}</span>
          </div>
          <div className="text-right text-[10px] italic mt-1">
            ({toWords(calculations.finalAmount)} Rupees Only)
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-[10px] uppercase tracking-wider">
        <p>Thank you.</p>
      </div>
    </div>
  );
};

export default function InvoicePdfTemplate({ invoice, items, settings }: Props) {
  const safeItems = items ?? [];

  const subtotal = safeItems.reduce(
    (acc, item) => acc + item.netWeight * item.rate + item.netWeight * item.making,
    0,
  );
  const totalBeforeTax = subtotal - (invoice.discount || 0);
  const cgstRate = invoice.cgst ?? ((invoice.tax || 0) / 2);
  const sgstRate = invoice.sgst ?? ((invoice.tax || 0) / 2);
  const cgst = totalBeforeTax * (cgstRate / 100);
  const sgst = totalBeforeTax * (sgstRate / 100);
  const totalAmount = totalBeforeTax + cgst + sgst;
  const roundOff = Math.round(totalAmount) - totalAmount;
  const finalAmount = Math.round(totalAmount);

  const calculations = {
    subtotal,
    totalBeforeTax,
    cgstRate,
    sgstRate,
    cgst,
    sgst,
    totalAmount,
    roundOff,
    finalAmount,
    safeItems,
  };

  const shopDetails = {
    name: settings?.shopName || 'Jewellers Store',
    address: settings?.address || 'Address Not Set',
    state: settings?.state || '',
    pincode: settings?.pincode || '',
    phone: settings?.phoneNumber || '',
    email: settings?.email || '',
    gst: settings?.gstNumber || '',
    pan: settings?.panNumber || '',
  };

  const templateId = settings?.templateId || 'classic';

  switch (templateId) {
    case 'modern':
      return <ModernTemplate invoice={invoice} items={items} settings={settings} calculations={calculations} shopDetails={shopDetails} />;
    case 'minimal':
      return <MinimalTemplate invoice={invoice} items={items} settings={settings} calculations={calculations} shopDetails={shopDetails} />;
    default:
      return <ClassicTemplate invoice={invoice} items={items} settings={settings} calculations={calculations} shopDetails={shopDetails} />;
  }
}
