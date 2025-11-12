import React from 'react';
import '@/app/globals.css';

export const metadata = {
  title: 'Print Invoice',
};

export default function PrintLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <style jsx global>{`
          @page {
            size: A4;
            margin: 15mm;
          }
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            font-size: 11px;
            color: #111;
            line-height: 1.5;
            position: relative;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
          }
          .watermark-container {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            opacity: 0.08;
            z-index: 0;
            pointer-events: none;
            overflow: hidden;
          }
          .watermark-container img {
            width: auto;
            height: 750px;
            filter: grayscale(100%) contrast(80%);
          }
          .invoice-body {
            position: relative;
            z-index: 1;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 20px;
          }
          .shop-info .shop-name {
            font-size: 22px;
            font-weight: 800;
            color: #111;
            margin-bottom: 6px;
            text-transform: uppercase;
          }
          .shop-info .shop-details {
            font-size: 12px;
            color: #333;
          }
          .shop-details div {
            margin-bottom: 4px;
          }
          .invoice-info {
            text-align: right;
            flex-shrink: 0;
            white-space: nowrap;
          }
          .invoice-info .invoice-title {
            font-size: 22px;
            font-weight: 800;
            color: #111;
            margin-bottom: 6px;
            text-transform: uppercase;
          }
          .invoice-info div {
            margin-bottom: 4px;
          }
          .buyer-section {
            border-top: 1px solid #d1d5db;
            border-bottom: 2px solid #d1d5db;
            margin: 20px 0;
            padding: 15px 0;
          }
          .buyer-section .title {
            font-weight: 700;
            text-transform: uppercase;
            font-size: 15px;
            letter-spacing: .04em;
            margin-bottom: 12px;
          }
          .buyer-section .details {
            font-size: 14px;
          }
          .buyer-section .details div {
             color: #333;
             margin-bottom: 4px;
          }
          .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 12px;
          }
          .items-table th, .items-table td {
            border: 1px solid #d1d5db;
            padding: 10px 8px;
            text-align: left;
          }
          .items-table th {
            background: #f3f4f6;
            font-weight: 700;
            color: #111;
            font-size: 10px;
            text-transform: uppercase;
          }
          .items-table td {
            font-size: 10px;
            color: #111;
          }
          .text-right {
            text-align: right;
          }
          .totals-table {
            width: 50%;
            margin-left: auto;
            margin-top: 0;
            border-collapse: collapse;
          }
          .totals-table td {
            border: none;
            padding: 6px 8px;
          }
          .totals-table tr:last-child td {
            border-top: 2px solid #111;
            padding-top: 10px;
          }
          .totals-table .grand-total {
            font-size: 16px;
            font-weight: 800;
            color: #111;
          }
          .words-section {
            margin-top: 20px;
            padding: 15px 0;
            border-top: 1px solid #d1d5db;
            border-bottom: 1px solid #d1d5db;
            font-size: 12px;
          }
          .footer {
            margin-top: 25px;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
          }
          .footer .thanks {
            color: #666;
          }
          .footer .signature-section {
            text-align: right;
          }
          .footer .signature-line {
            margin-top: 40px;
            border-top: 1px solid #d1d5db;
            width: 200px;
            margin-left: auto;
            padding-top: 8px;
            font-size:10px;
             color: #444;
          }
          @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
        `}</style>
        {children}
      </body>
    </html>
  );
}
