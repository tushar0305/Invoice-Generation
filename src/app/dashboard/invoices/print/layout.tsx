'use client';

import React from 'react';


export default function PrintLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap');
        @page { size: A4; margin: 0; }
        .invoice-container {
          font-family: 'Roboto', 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          color: #333;
          font-size: 11px;
          line-height: 1.5;
          width: 100%;
          margin: 0;
          max-width: 210mm;
          position: relative;
          background: #fff;
        }
        .invoice-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 15px; }
        .header-left { max-width: 60%; }
        .header-right { text-align: right; }
        .shop-name { font-size: 24px; font-weight: 700; color: #800000; margin: 0 0 5px 0; text-transform: uppercase; }
        .header-left p { margin: 0; font-size: 11px; color: #444; }
        .header-right h2 { font-size: 16px; font-weight: 700; margin: 0 0 10px 0; }
        .header-right p { margin: 2px 0; font-size: 11px; }
        .separator { border-top: 2px solid #D4AF37; margin: 15px 0; }
        .customer-details { margin-bottom: 15px; }
        .customer-details h3 { margin: 0 0 5px 0; font-size: 12px; font-weight: 700; color: #800000; text-transform: uppercase; }
        .customer-details p { margin: 1px 0; }
        .items-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        .items-table th, .items-table td { border: 1px solid #e5e7eb; padding: 8px 10px; }
        .items-table th { background-color: #f9fafb; font-weight: 700; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; text-align: left; }
        .items-table .text-right { text-align: right; }
        .summary-section { display: flex; justify-content: flex-end; margin-top: 10px; margin-bottom: 20px; }
        .summary-details { width: 45%; max-width: 350px; }
        .summary-row { display: flex; justify-content: space-between; padding: 7px 10px; border-bottom: 1px solid #eee; }
        .summary-row:last-child { border-bottom: none; }
        .summary-row.grand-total { font-size: 16px; font-weight: 700; background-color: transparent; color: #800000; border-top: 2px solid #D4AF37; padding: 10px; border-radius: 0 0 4px 4px; }
        .words-section { padding: 15px; border-top: 1px dashed #ccc; border-bottom: 1px dashed #ccc; margin-bottom: 30px; font-size: 12px; }
        .words-section p { margin: 0; font-style: italic; }
        .invoice-footer { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 50px; }
        .terms { font-size: 9px; color: #666; }
        .terms h4 { margin: 0 0 5px 0; font-weight: 700; color: #333; }
        .terms p { margin: 0; }
        .signature { text-align: center; }
        .signature p { margin: 0; font-size: 11px; }
        .signature-box { height: 0; margin: 0; border: none; background: transparent !important; }

        @media print {
          body { -webkit-print-color-adjust: auto; print-color-adjust: auto; }
          .invoice-container { box-shadow: none; margin: 0; max-width: 100%; border-radius: 0; padding: 20mm 15mm; }
          .signature-box { display: none !important; }
        }
      `}</style>
      <div id="print-root">
        {children}
      </div>
    </>
  );
}
