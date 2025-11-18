"use client";

import React from 'react';
import type { Invoice, InvoiceItem, UserSettings } from '@/lib/definitions';
import { format } from 'date-fns';

type Props = {
  invoice: Invoice;
  items: InvoiceItem[];
  settings?: Partial<UserSettings> | null;
};

function f2(n: number) {
  return (Number(n) || 0).toFixed(2);
}

function toWords(num: number): string {
  const a = [
    '',
    'one ',
    'two ',
    'three ',
    'four ',
    'five ',
    'six ',
    'seven ',
    'eight ',
    'nine ',
    'ten ',
    'eleven ',
    'twelve ',
    'thirteen ',
    'fourteen ',
    'fifteen ',
    'sixteen ',
    'seventeen ',
    'eighteen ',
    'nineteen ',
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
  if (crores > 0) {
    str += inWords(crores) + ' crore ';
    n %= 10000000;
  }
  const lakhs = Math.floor(n / 100000);
  if (lakhs > 0) {
    str += inWords(lakhs) + ' lakh ';
    n %= 100000;
  }
  const thousands = Math.floor(n / 1000);
  if (thousands > 0) {
    str += inWords(thousands) + ' thousand ';
    n %= 1000;
  }
  const hundreds = Math.floor(n / 100);
  if (hundreds > 0) {
    str += inWords(hundreds) + ' hundred ';
    n %= 100;
  }
  if (n > 0) {
    str += inWords(n);
  }
  return str
    .trim()
    .replace(/\s+/g, ' ')
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

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

  const shopName = settings?.shopName || 'Jewellers Store';
  const address = settings?.address || 'Address Not Set';
  const state = settings?.state || '';
  const pincode = settings?.pincode || '';
  const phone = settings?.phoneNumber || '';
  const email = settings?.email || '';
  const gst = settings?.gstNumber || '';
  const pan = settings?.panNumber || '';

  return (
    <div
      className="mx-auto w-full max-w-[210mm] bg-white text-[#111] text-[10px] leading-[1.5] p-4 font-sans"
      style={{ boxSizing: 'border-box', width: '100%', maxWidth: '210mm' }}
    >
      {/* Header */}
      <div className="flex items-start justify-between pb-3">
        <div className="pr-4 min-w-[60%]">
          <div className="text-[22px] font-extrabold uppercase tracking-[0.3px]">{shopName}</div>
          <div className="mt-1 space-y-[2px] text-[#444]">
            <p>{address}</p>
            {state && (
              <p>
                {state} {pincode && `- ${pincode}`}
              </p>
            )}
            {phone && (
              <p>
                <span className="font-semibold">Phone:</span> {phone}
              </p>
            )}
            {email && (
              <p>
                <span className="font-semibold">Email:</span> {email}
              </p>
            )}
          </div>
        </div>

        <div className="text-right">
          <div className="text-[22px] font-extrabold uppercase">Tax Invoice</div>
          <div className="space-y-1 mt-1">
            <div>
              <span className="font-semibold">Invoice No:</span> {invoice.invoiceNumber}
            </div>
            <div>
              <span className="font-semibold">Date:</span> {format(new Date(invoice.invoiceDate), 'dd MMM, yyyy')}
            </div>
            <div>
              <span className="font-semibold">GSTIN:</span> {gst || '—'}
            </div>
            <div>
              <span className="font-semibold">PAN:</span> {pan || '—'}
            </div>
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
          {invoice.customerPhone && (
            <p>
              <span className="font-semibold">Phone:</span> {invoice.customerPhone}
            </p>
          )}
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
          {safeItems.map((item, idx) => {
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
            <span>₹ {f2(subtotal)}</span>
          </div>
          {invoice.discount > 0 && (
            <div className="flex items-center justify-between border-b border-gray-200 px-2 py-2">
              <span>Discount:</span>
              <span>-₹ {f2(invoice.discount)}</span>
            </div>
          )}
          <div className="flex items-center justify-between border-b border-gray-200 px-2 py-2">
            <span>CGST ({f2(cgstRate)}%):</span>
            <span>₹ {f2(cgst)}</span>
          </div>
          <div className="flex items-center justify-between border-b border-gray-200 px-2 py-2">
            <span>SGST ({f2(sgstRate)}%):</span>
            <span>₹ {f2(sgst)}</span>
          </div>
          {roundOff !== 0 && (
            <div className="flex items-center justify-between border-gray-200 px-2 py-2">
              <span>Round Off:</span>
              <span>₹ {f2(roundOff)}</span>
            </div>
          )}
          <div className="mt-1 flex items-center justify-between border-t-2 border-[#D4AF37] px-2 py-3 text-[16px] font-extrabold text-[#800000]">
            <span>Grand Total:</span>
            <span>₹ {f2(finalAmount)}</span>
          </div>
        </div>
      </div>

      {/* Words */}
      <div className="my-4 border-y border-dashed border-gray-300 px-3 py-3 text-[12px] italic">
        <p>
          <span className="font-semibold not-italic">Amount in Words:</span> {toWords(finalAmount)} Rupees Only
        </p>
      </div>

      {/* Footer */}
      <div className="mt-10 flex items-end justify-between">
        <div className="text-[9px] text-gray-600">
          <h4 className="m-0 mb-1 font-semibold text-gray-900">Terms &amp; Conditions</h4>
          <p className="m-0">Thank you for shopping with us!</p>
        </div>
        <div className="text-center">
          <div className="h-[0px]" />
          <p className="m-0 text-[11px]">Authorized Signatory</p>
        </div>
      </div>
    </div>
  );
}
