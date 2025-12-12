"use client";

import React from 'react';
import { format } from 'date-fns';
import { cn, formatCurrency } from '@/lib/utils';
import type { Loan, LoanCollateral, LoanCustomer } from '@/lib/loan-types';

type ShopDetails = {
  name: string;
  address: string;
  phone: string;
  email: string;
  gst?: string;
  state?: string;
  pincode?: string;
};

type Props = {
  loan: Loan;
  customer: LoanCustomer;
  collateral: LoanCollateral[];
  shopDetails: ShopDetails;
};

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

export const LoanPdfTemplate = ({ loan, customer, collateral, shopDetails }: Props) => {
  return (
    <div className="mx-auto w-full max-w-[210mm] bg-white text-black text-[10px] leading-[1.5] p-8 font-sans border border-gray-300 print:border-0">
      {/* Header */}
      <div className="flex items-start justify-between pb-6 border-b-2 border-[#D4AF37]">
        <div className="pr-4 min-w-[60%]">
          <div className="text-[24px] font-extrabold uppercase tracking-[0.5px] text-black">{shopDetails.name}</div>
          <div className="mt-2 space-y-[2px] text-gray-800 text-[11px]">
            <p>{shopDetails.address}</p>
            {shopDetails.state && <p>{shopDetails.state} {shopDetails.pincode && `- ${shopDetails.pincode}`}</p>}
            {shopDetails.phone && <p><span className="font-semibold">Phone:</span> {shopDetails.phone}</p>}
            {shopDetails.email && <p><span className="font-semibold">Email:</span> {shopDetails.email}</p>}
            {shopDetails.gst && <p><span className="font-semibold">GSTIN:</span> {shopDetails.gst}</p>}
          </div>
        </div>
        <div className="text-right">
          <div className="text-[24px] font-extrabold uppercase text-[#D4AF37]">Loan Agreement</div>
          <div className="mt-2 text-[12px] text-black">
            <p><span className="font-semibold">Loan No:</span> {loan.loan_number}</p>
            <p><span className="font-semibold">Date:</span> {format(new Date(loan.start_date), 'dd MMM yyyy')}</p>
          </div>
        </div>
      </div>

      {/* Customer Details */}
      <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-sm print:bg-transparent print:border-gray-300">
        <h3 className="text-[14px] font-bold text-[#D4AF37] uppercase mb-2 border-b border-gray-300 pb-1">Borrower Details</h3>
        <div className="grid grid-cols-2 gap-4 text-[11px] text-black">
          <div>
            <p><span className="font-semibold">Name:</span> {customer.name}</p>
            <p><span className="font-semibold">Phone:</span> {customer.phone}</p>
            {customer.email && <p><span className="font-semibold">Email:</span> {customer.email}</p>}
          </div>
          <div>
            <p><span className="font-semibold">Address:</span> {customer.address || 'N/A'}</p>
            {customer.pan && <p><span className="font-semibold">PAN:</span> {customer.pan}</p>}
            {customer.aadhaar && <p><span className="font-semibold">Aadhaar:</span> {customer.aadhaar}</p>}
          </div>
        </div>
      </div>

      {/* Loan Details */}
      <div className="mt-6">
        <h3 className="text-[14px] font-bold text-[#D4AF37] uppercase mb-2 border-b border-gray-300 pb-1">Loan Particulars</h3>
        <table className="w-full text-[11px] border-collapse border border-gray-300">
          <tbody>
            <tr className="border-b border-gray-300">
              <td className="py-2 px-2 font-semibold w-1/3 border-r border-gray-300">Principal Amount</td>
              <td className="py-2 px-2 text-right font-bold text-[13px] text-black">{formatCurrency(loan.principal_amount)}</td>
            </tr>
            <tr className="border-b border-gray-300">
              <td className="py-2 px-2 font-semibold border-r border-gray-300">Amount in Words</td>
              <td className="py-2 px-2 text-right italic text-gray-700">{toWords(loan.principal_amount)} Rupees Only</td>
            </tr>
            <tr className="border-b border-gray-300">
              <td className="py-2 px-2 font-semibold border-r border-gray-300">Interest Rate</td>
              <td className="py-2 px-2 text-right text-black">{loan.interest_rate}% per month</td>
            </tr>
            <tr className="border-b border-gray-300">
              <td className="py-2 px-2 font-semibold border-r border-gray-300">Tenure</td>
              <td className="py-2 px-2 text-right text-black">{loan.tenure_months} Months</td>
            </tr>
            <tr className="border-b border-gray-300">
              <td className="py-2 px-2 font-semibold border-r border-gray-300">Repayment Type</td>
              <td className="py-2 px-2 text-right capitalize text-black">{(loan.repayment_type || 'interest_only').replace('_', ' ')}</td>
            </tr>
            {loan.repayment_type === 'emi' && loan.emi_amount && (
              <tr className="border-b border-gray-300">
                <td className="py-2 px-2 font-semibold border-r border-gray-300">EMI Amount</td>
                <td className="py-2 px-2 text-right font-bold text-black">{formatCurrency(loan.emi_amount)}</td>
              </tr>
            )}
            {loan.end_date && (
              <tr className="border-b border-gray-300">
                <td className="py-2 px-2 font-semibold border-r border-gray-300">Due Date</td>
                <td className="py-2 px-2 text-right text-black">{format(new Date(loan.end_date), 'dd MMM yyyy')}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Collateral Details */}
      <div className="mt-6">
        <h3 className="text-[14px] font-bold text-[#D4AF37] uppercase mb-2 border-b border-gray-300 pb-1">Collateral / Pledged Items</h3>
        <table className="w-full text-[11px] border border-gray-300 border-collapse">
          <thead className="bg-gray-100 print:bg-gray-100">
            <tr>
              <th className="py-2 px-3 text-left border-b border-r border-gray-300 text-black">Item Name</th>
              <th className="py-2 px-3 text-left border-b border-r border-gray-300 text-black">Type</th>
              <th className="py-2 px-3 text-right border-b border-r border-gray-300 text-black">Gross Wt.</th>
              <th className="py-2 px-3 text-right border-b border-r border-gray-300 text-black">Net Wt.</th>
              <th className="py-2 px-3 text-right border-b border-r border-gray-300 text-black">Purity</th>
              <th className="py-2 px-3 text-right border-b border-gray-300 text-black">Est. Value</th>
            </tr>
          </thead>
          <tbody>
            {collateral.map((item, index) => (
              <tr key={index} className="border-b border-gray-300">
                <td className="py-2 px-3 border-r border-gray-300 text-black">{item.item_name}</td>
                <td className="py-2 px-3 capitalize border-r border-gray-300 text-black">{item.item_type}</td>
                <td className="py-2 px-3 text-right border-r border-gray-300 text-black">{item.gross_weight}g</td>
                <td className="py-2 px-3 text-right border-r border-gray-300 text-black">{item.net_weight}g</td>
                <td className="py-2 px-3 text-right border-r border-gray-300 text-black">{item.purity}</td>
                <td className="py-2 px-3 text-right text-black">{formatCurrency(item.estimated_value || 0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Terms & Conditions */}
      <div className="mt-8 pt-4 border-t border-gray-300">
        <h4 className="text-[12px] font-bold mb-2 text-black">Terms & Conditions:</h4>
        <ol className="list-decimal pl-4 text-[10px] text-gray-700 space-y-1">
          <li>The loan is granted against the pledge of gold ornaments/items listed above.</li>
          <li>Interest will be charged at the agreed rate on a monthly basis.</li>
          <li>If the loan is not repaid within the tenure, the lender reserves the right to auction the pledged items after due notice.</li>
          <li>The borrower confirms that the pledged items belong to them and are not stolen or encumbered.</li>
          <li>In case of loss or damage due to theft, fire, or natural calamities, the lender's liability is limited as per applicable laws.</li>
        </ol>
      </div>

      {/* Signatures */}
      <div className="mt-16 flex justify-between items-end">
        <div className="text-center">
          <div className="w-40 border-t border-black mb-2"></div>
          <p className="font-semibold text-[11px] text-black">Borrower's Signature</p>
        </div>
        <div className="text-center">
          <div className="w-40 border-t border-black mb-2"></div>
          <p className="font-semibold text-[11px] text-black">Authorized Signatory</p>
          <p className="text-[10px] text-gray-600">For {shopDetails.name}</p>
        </div>
      </div>
      
      <div className="mt-8 text-center text-[9px] text-gray-400">
        Generated by Invoice Gen
      </div>
    </div>
  );
};
