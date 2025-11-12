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
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
            font-size: 10px;
            font-weight: 400;
            line-height: 1.6;
            color: #333;
            background-color: #fff;
          }
          .invoice-container {
            position: relative;
          }
          .watermark {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 80%;
            height: 80%;
            background-repeat: no-repeat;
            background-position: center;
            background-size: contain;
            opacity: 0.05;
            z-index: 0;
            pointer-events: none;
          }
          .invoice-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            padding-bottom: 20px;
            margin-bottom: 20px;
            border-bottom: 2px solid #eee;
          }
          .header-left .shop-name {
            font-size: 24px;
            font-weight: 700;
            color: #000;
            margin-bottom: 4px;
          }
          .header-left .shop-details {
            font-size: 11px;
            line-height: 1.5;
          }
          .header-right {
            text-align: right;
          }
          .header-right .invoice-title {
            font-size: 24px;
            font-weight: 700;
            text-transform: uppercase;
            color: #000;
            margin-bottom: 8px;
          }
          .header-right .invoice-meta div {
            margin-bottom: 2px;
            font-size: 11px;
          }
          .buyer-details {
            margin-bottom: 30px;
            padding: 10px;
            background-color: #f9f9f9;
            border: 1px solid #eee;
            border-radius: 4px;
          }
          .buyer-details .section-title {
            font-size: 12px;
            font-weight: 600;
            margin-bottom: 8px;
            color: #000;
          }
          .buyer-details p {
            margin: 0;
            line-height: 1.6;
            font-size: 11px;
          }
          .items-section table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          .items-section th,
          .items-section td {
            border: 1px solid #eee;
            padding: 8px 10px;
            text-align: left;
            vertical-align: top;
          }
          .items-section th {
            background-color: #f9f9f9;
            font-weight: 600;
            color: #000;
            font-size: 9px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .items-section td {
            font-size: 11px;
          }
          .text-right {
            text-align: right;
          }
          .summary-section {
            display: flex;
            justify-content: flex-end;
            margin-bottom: 20px;
          }
          .summary-box {
            width: 45%;
            max-width: 350px;
          }
          .summary-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 10px;
            font-size: 11px;
          }
          .summary-row:nth-child(odd) {
             background-color: #f9f9f9;
          }
          .summary-row.grand-total {
            font-weight: 700;
            font-size: 16px;
            color: #000;
            background-color: #f3f4f6;
            border-top: 2px solid #ddd;
            padding-top: 12px;
            padding-bottom: 12px;
          }
          .amount-in-words {
            padding: 15px 10px;
            border-top: 1px solid #eee;
            border-bottom: 1px solid #eee;
            margin-bottom: 40px;
            font-size: 11px;
          }
          .invoice-footer {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            color: #888;
            font-size: 10px;
          }
          .signature-area {
            text-align: center;
          }
          .signature-line {
            border-top: 1px solid #ccc;
            margin-top: 50px;
            padding-top: 5px;
            width: 200px;
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