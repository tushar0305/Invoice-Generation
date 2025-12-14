"use client";

import React from 'react';
import type { Invoice, InvoiceItem } from '@/lib/definitions';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

type UserSettings = {
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

type Props = {
  invoice: Invoice;
  items: InvoiceItem[];
  settings?: UserSettings | null;
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
          <p className="font-semibold">{invoice.customerSnapshot?.name || 'Unknown'}</p>
          <p className="whitespace-pre-wrap">{invoice.customerSnapshot?.address || ''}</p>
          <p>{[invoice.customerSnapshot?.state, invoice.customerSnapshot?.pincode].filter(Boolean).join(', ')}</p>
          {invoice.customerSnapshot?.phone && <p><span className="font-semibold">Phone:</span> {invoice.customerSnapshot.phone}</p>}
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
            const makingTotal = (item.makingRate * item.netWeight) + item.making;
            const lineTotal = (item.netWeight * item.rate) + makingTotal + item.stoneAmount;
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
            <p className="font-bold text-lg text-slate-900">{invoice.customerSnapshot?.name || 'Unknown'}</p>
            <p className="text-slate-600 whitespace-pre-wrap">{invoice.customerSnapshot?.address || ''}</p>
            <p className="text-slate-600">{[invoice.customerSnapshot?.state, invoice.customerSnapshot?.pincode].filter(Boolean).join(', ')}</p>
          </div>
          <div className="text-right">
            {invoice.customerSnapshot?.phone && <p className="text-slate-600">Phone: {invoice.customerSnapshot.phone}</p>}
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
            const makingTotal = (item.makingRate * item.netWeight) + item.making;
            const lineTotal = (item.netWeight * item.rate) + makingTotal + item.stoneAmount;
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
          <p>{invoice.customerSnapshot?.name || 'Unknown'}</p>
          <p className="whitespace-pre-wrap">{invoice.customerSnapshot?.address || ''}</p>
          <p>{invoice.customerSnapshot?.phone}</p>
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
            const makingTotal = (item.makingRate * item.netWeight) + item.making;
            const lineTotal = (item.netWeight * item.rate) + makingTotal + item.stoneAmount;
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

// --- Elegant Template ---
const ElegantTemplate = ({ invoice, items, settings, calculations, shopDetails }: TemplateProps) => {
  return (
    <div className="mx-auto w-full max-w-[210mm] bg-[#FAFAFA] text-[#1A1A1A] text-[10px] leading-[1.5] p-8 font-serif border border-gray-200 relative">
      {/* Border Frame */}
      <div className="absolute inset-4 border border-[#C5A059] pointer-events-none"></div>
      <div className="absolute inset-[18px] border-[0.5px] border-[#C5A059] pointer-events-none"></div>

      {/* Header */}
      <div className="text-center mt-6 mb-8">
        <h1 className="text-3xl font-bold text-[#1A1A1A] mb-2">{shopDetails.name}</h1>
        <div className="text-[#555] space-y-1 text-[9px]">
          <p>{shopDetails.address}</p>
          {shopDetails.state && <p>{shopDetails.state} {shopDetails.pincode}</p>}
          <p>{shopDetails.phone} | {shopDetails.email}</p>
        </div>

        <div className="flex justify-center my-4">
          <div className="h-[1px] w-24 bg-[#C5A059]"></div>
        </div>

        <h2 className="text-xl italic text-[#C5A059] font-medium">Tax Invoice</h2>
      </div>

      {/* Details */}
      <div className="flex justify-between px-8 mb-8">
        <div>
          <h3 className="font-bold text-[#1A1A1A] mb-1">Billed To:</h3>
          <p className="font-bold text-lg">{invoice.customerSnapshot?.name || 'Unknown'}</p>
          <p className="text-[#555] whitespace-pre-wrap">{invoice.customerSnapshot?.address || ''}</p>
          <p className="text-[#555]">{invoice.customerSnapshot?.phone}</p>
        </div>
        <div className="text-right">
          <p><span className="font-bold">Invoice No:</span> {invoice.invoiceNumber}</p>
          <p><span className="font-bold">Date:</span> {format(new Date(invoice.invoiceDate), 'dd MMM, yyyy')}</p>
          {shopDetails.gst && <p><span className="font-bold">GSTIN:</span> {shopDetails.gst}</p>}
        </div>
      </div>

      {/* Table */}
      <div className="px-6 mb-8">
        <table className="w-full">
          <thead>
            <tr className="bg-[#FAFAFA] border-b border-[#C5A059]">
              <th className="py-2 text-left text-[#C5A059] font-bold">Item</th>
              <th className="py-2 text-center text-[#C5A059] font-bold">Purity</th>
              <th className="py-2 text-right text-[#C5A059] font-bold">Net Wt</th>
              <th className="py-2 text-right text-[#C5A059] font-bold">Rate</th>
              <th className="py-2 text-right text-[#C5A059] font-bold">Making</th>
              <th className="py-2 text-right text-[#C5A059] font-bold">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {calculations.safeItems.map((item) => {
              const makingTotal = (item.makingRate * item.netWeight) + item.making;
              const lineTotal = (item.netWeight * item.rate) + makingTotal + item.stoneAmount;
              return (
                <tr key={item.id}>
                  <td className="py-3">{item.description}</td>
                  <td className="py-3 text-center">{item.purity}</td>
                  <td className="py-3 text-right">{f2(item.netWeight)}</td>
                  <td className="py-3 text-right">{f2(item.rate)}</td>
                  <td className="py-3 text-right">{f2(makingTotal)}</td>
                  <td className="py-3 text-right font-medium">{f2(lineTotal)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div className="flex justify-end px-8 mb-12">
        <div className="w-64 space-y-2">
          <div className="flex justify-between text-[#555]">
            <span>Subtotal</span>
            <span>{f2(calculations.subtotal)}</span>
          </div>
          <div className="flex justify-between text-[#555] border-b border-gray-200 pb-2">
            <span>Tax</span>
            <span>{f2(calculations.cgst + calculations.sgst)}</span>
          </div>
          <div className="flex justify-between text-[#C5A059] font-bold text-lg pt-1">
            <span>Grand Total</span>
            <span>{f2(calculations.finalAmount)}</span>
          </div>
          <p className="text-[9px] text-right italic text-[#555] mt-2">
            {toWords(calculations.finalAmount)} Rupees Only
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-[9px] text-[#888] absolute bottom-8 left-0 right-0">
        <p>Thank you for your patronage.</p>
      </div>
    </div>
  );
};

// --- Premium Template ---
const PremiumTemplate = ({ invoice, items, settings, calculations, shopDetails }: TemplateProps) => {
  return (
    <div className="mx-auto w-full max-w-[210mm] min-h-[297mm] bg-white text-slate-800 text-[10px] leading-[1.6] relative overflow-hidden flex flex-col font-serif">
      {/* Watermark */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 opacity-[0.08]">
        {settings?.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={settings.logoUrl}
            alt="Watermark"
            className="w-[80%] max-w-[500px] object-contain"
            style={{ filter: 'grayscale(100%)' }}
          />
        ) : (
          <div className="transform -rotate-45 text-[80px] font-bold text-gray-900 uppercase whitespace-nowrap opacity-50 select-none border-4 border-gray-900 p-8">
            {shopDetails.name}
          </div>
        )}
      </div>

      {/* Decorative Borders */}
      <div className="absolute top-0 left-0 right-0 h-3 bg-gradient-to-r from-[#bf953f] via-[#fcf6ba] to-[#b38728]"></div>
      <div className="absolute bottom-0 left-0 right-0 h-3 bg-gradient-to-r from-[#bf953f] via-[#fcf6ba] to-[#b38728]"></div>

      {/* Content Container (z-index to sit above watermark) */}
      <div className="relative z-10 p-10 flex-grow flex flex-col">

        {/* Header */}
        <div className="flex justify-between items-start mb-10 border-b-2 border-[#b38728] pb-6">
          <div className="w-[60%]">
            {/* Logo if available (Small branding) */}
            {settings?.logoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={settings.logoUrl} alt="Logo" className="h-16 object-contain mb-3" />
            )}
            <h1 className="text-4xl font-bold text-[#805d15] tracking-tight mb-2 uppercase font-serif">{shopDetails.name}</h1>
            <div className="text-slate-600 space-y-1 text-[11px]">
              <p className="font-medium">{shopDetails.address}</p>
              <p>{[shopDetails.state, shopDetails.pincode].filter(Boolean).join(' - ')}</p>
              <p>{shopDetails.phone && `Ph: ${shopDetails.phone}`} {shopDetails.email && `| Email: ${shopDetails.email}`}</p>
            </div>
          </div>
          <div className="text-right w-[35%]">
            <div className="bg-[#fcfbf7] border border-[#eaddcf] p-4 rounded-lg shadow-sm">
              <h2 className="text-2xl font-bold text-[#805d15] uppercase tracking-wider mb-3 text-center border-b border-[#eaddcf] pb-2">Tax Invoice</h2>
              <div className="space-y-1.5 text-[11px]">
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-700">Invoice No:</span>
                  <span className="font-bold text-slate-900">{invoice.invoiceNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-700">Date:</span>
                  <span className="font-bold text-slate-900">{format(new Date(invoice.invoiceDate), 'dd MMM, yyyy')}</span>
                </div>
                {shopDetails.gst && (
                  <div className="flex justify-between">
                    <span className="font-semibold text-slate-700">GSTIN:</span>
                    <span className="font-medium">{shopDetails.gst}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Billed To */}
        <div className="mb-8 flex gap-8">
          <div className="flex-1">
            <h3 className="text-xs font-bold text-[#805d15] uppercase tracking-wider mb-2 border-b border-[#eaddcf] inline-block pb-1">Billed To</h3>
            <div className="pl-2 border-l-2 border-[#eaddcf]">
              <p className="font-bold text-lg text-slate-900">{invoice.customerSnapshot?.name || 'Unknown'}</p>
              <p className="text-slate-600 whitespace-pre-wrap">{invoice.customerSnapshot?.address || ''}</p>
              {invoice.customerSnapshot?.phone && <p className="text-slate-600 font-medium mt-1">Ph: {invoice.customerSnapshot.phone}</p>}
            </div>
          </div>
          {/* Optional: Add Shipping Address or other details here if needed */}
        </div>

        {/* Table */}
        <div className="mb-8">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[#fcfbf7] border-y-2 border-[#b38728]">
                <th className="py-3 px-3 text-left font-bold text-[#805d15] uppercase w-[5%]">#</th>
                <th className="py-3 px-3 text-left font-bold text-[#805d15] uppercase w-[35%]">Description</th>
                <th className="py-3 px-3 text-center font-bold text-[#805d15] uppercase w-[10%]">Purity</th>
                <th className="py-3 px-3 text-right font-bold text-[#805d15] uppercase w-[12%]">Net Wt</th>
                <th className="py-3 px-3 text-right font-bold text-[#805d15] uppercase w-[12%]">Rate</th>
                <th className="py-3 px-3 text-right font-bold text-[#805d15] uppercase w-[12%]">Making</th>
                <th className="py-3 px-3 text-right font-bold text-[#805d15] uppercase w-[14%]">Total</th>
              </tr>
            </thead>
            <tbody>
              {calculations.safeItems.map((item, idx) => {
                const makingTotal = item.netWeight * item.making;
                const lineTotal = item.netWeight * item.rate + makingTotal;
                return (
                  <tr key={item.id} className="border-b border-[#eaddcf] hover:bg-[#fffdf5]">
                    <td className="py-3 px-3 text-slate-500">{idx + 1}</td>
                    <td className="py-3 px-3 font-medium text-slate-800">{item.description}</td>
                    <td className="py-3 px-3 text-center text-slate-600">{item.purity}</td>
                    <td className="py-3 px-3 text-right text-slate-600">{f2(item.netWeight)} <span className="text-[8px]">g</span></td>
                    <td className="py-3 px-3 text-right text-slate-600">₹{f2(item.rate)}</td>
                    <td className="py-3 px-3 text-right text-slate-600">₹{f2(makingTotal)}</td>
                    <td className="py-3 px-3 text-right font-bold text-slate-900">₹{f2(lineTotal)}</td>
                  </tr>
                );
              })}
              {/* Empty rows filler if needed for layout height */}
            </tbody>
          </table>
        </div>

        {/* Totals Section */}
        <div className="flex justify-end mb-12">
          <div className="w-[300px]">
            <div className="space-y-2 text-[11px]">
              <div className="flex justify-between px-2">
                <span className="text-slate-600">Subtotal</span>
                <span className="font-medium text-slate-900">₹ {f2(calculations.subtotal)}</span>
              </div>
              {invoice.discount > 0 && (
                <div className="flex justify-between px-2 text-emerald-700">
                  <span>Discount</span>
                  <span>- ₹ {f2(invoice.discount)}</span>
                </div>
              )}
              <div className="flex justify-between px-2">
                <span className="text-slate-600">CGST ({f2(calculations.cgstRate)}%)</span>
                <span className="font-medium text-slate-900">₹ {f2(calculations.cgst)}</span>
              </div>
              <div className="flex justify-between px-2">
                <span className="text-slate-600">SGST ({f2(calculations.sgstRate)}%)</span>
                <span className="font-medium text-slate-900">₹ {f2(calculations.sgst)}</span>
              </div>

              {calculations.roundOff !== 0 && (
                <div className="flex justify-between px-2 text-slate-500 italic">
                  <span>Round Off</span>
                  <span>{calculations.roundOff > 0 ? '+' : ''} ₹ {f2(calculations.roundOff)}</span>
                </div>
              )}
            </div>

            <div className="mt-4 bg-[#fcfbf7] border-y-2 border-[#b38728] p-3">
              <div className="flex justify-between items-center">
                <span className="font-bold text-[#805d15] text-lg uppercase">Total</span>
                <span className="font-bold text-[#805d15] text-xl">₹ {f2(calculations.finalAmount)}</span>
              </div>
            </div>
            <div className="mt-2 text-right text-[10px] italic text-slate-500">
              Amount in Words: <span className="font-medium text-slate-700">{toWords(calculations.finalAmount)} Rupees Only</span>
            </div>
          </div>
        </div>

        {/* Footer Terms */}
        <div className="mt-auto flex items-end justify-between pt-6 border-t border-[#eaddcf]">
          <div className="text-[9px] text-slate-500 max-w-[60%]">
            <h4 className="font-bold text-[#805d15] uppercase mb-1">Terms & Conditions</h4>
            <ul className="list-disc pl-3 space-y-0.5">
              <li>Goods once sold will not be taken back.</li>
              <li>Subject to local jurisdiction.</li>
              <li>E. & O.E.</li>
            </ul>
          </div>
          <div className="text-center">
            <div className="h-16 w-32 border-b border-slate-400 mb-2"></div>
            <p className="font-bold text-[#805d15] text-[10px] uppercase">Authorized Signatory</p>
          </div>
        </div>

      </div>
    </div>
  );
};

const BoldTemplate = ({ invoice, items, settings, calculations, shopDetails }: TemplateProps) => {
  return (
    <div className="mx-auto w-full max-w-[210mm] bg-white text-black text-[10px] leading-[1.5] font-sans">
      {/* Header Block */}
      <div className="bg-black text-white p-8 flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold tracking-tighter">{shopDetails.name}</h1>
        </div>
        <div className="text-right">
          <h2 className="text-xl font-bold text-[#888]">INVOICE</h2>
        </div>
      </div>

      <div className="p-8">
        {/* Info */}
        <div className="mb-8 text-[#333]">
          <p>{shopDetails.address}</p>
          <p>{shopDetails.phone}</p>
        </div>

        {/* Customer Block */}
        <div className="bg-[#FFD700] p-6 rounded-none mb-8 flex justify-between items-start">
          <div>
            <p className="text-xs font-bold mb-2">BILL TO:</p>
            <p className="text-xl font-bold">{invoice.customerSnapshot?.name || 'Unknown'}</p>
            <p className="text-sm whitespace-pre-wrap">{invoice.customerSnapshot?.address || ''}</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-bold mb-1">DETAILS:</p>
            <p className="font-mono">NO: {invoice.invoiceNumber}</p>
            <p className="font-mono">DATE: {format(new Date(invoice.invoiceDate), 'dd-MM-yyyy')}</p>
          </div>
        </div>

        {/* Table */}
        <table className="w-full mb-8">
          <thead>
            <tr className="bg-black text-white">
              <th className="py-3 px-4 text-left font-bold">DESCRIPTION</th>
              <th className="py-3 px-4 text-center font-bold">PURITY</th>
              <th className="py-3 px-4 text-right font-bold">NET WT</th>
              <th className="py-3 px-4 text-right font-bold">RATE</th>
              <th className="py-3 px-4 text-right font-bold">AMOUNT</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {calculations.safeItems.map((item, i) => {
              const makingTotal = item.netWeight * item.making;
              const lineTotal = item.netWeight * item.rate + makingTotal;
              return (
                <tr key={item.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="py-3 px-4 font-medium">{item.description.toUpperCase()}</td>
                  <td className="py-3 px-4 text-center">{item.purity}</td>
                  <td className="py-3 px-4 text-right">{f2(item.netWeight)}</td>
                  <td className="py-3 px-4 text-right">{f2(item.rate)}</td>
                  <td className="py-3 px-4 text-right font-bold">{f2(lineTotal)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Totals */}
        <div className="flex justify-end">
          <div className="w-1/2 border-t-4 border-black pt-4">
            <div className="flex justify-between mb-2 font-medium">
              <span>SUBTOTAL</span>
              <span>{f2(calculations.subtotal)}</span>
            </div>
            <div className="flex justify-between mb-4 font-medium">
              <span>TAXES</span>
              <span>{f2(calculations.cgst + calculations.sgst)}</span>
            </div>
            <div className="flex justify-between text-2xl font-black bg-black text-white p-4">
              <span>TOTAL</span>
              <span>{f2(calculations.finalAmount)}</span>
            </div>
          </div>
        </div>
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
  const cgstRate = settings?.cgstRate || 0;
  const sgstRate = settings?.sgstRate || 0;
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
    case 'elegant':
      return <ElegantTemplate invoice={invoice} items={items} settings={settings} calculations={calculations} shopDetails={shopDetails} />;
    case 'bold':
      return <BoldTemplate invoice={invoice} items={items} settings={settings} calculations={calculations} shopDetails={shopDetails} />;
    case 'premium':
      return <PremiumTemplate invoice={invoice} items={items} settings={settings} calculations={calculations} shopDetails={shopDetails} />;
    default:
      return <ClassicTemplate invoice={invoice} items={items} settings={settings} calculations={calculations} shopDetails={shopDetails} />;
  }
}
