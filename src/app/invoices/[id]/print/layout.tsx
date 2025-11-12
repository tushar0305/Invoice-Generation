import React from 'react';
import '@/app/globals.css';

export const metadata = {
  title: 'Print Invoice',
};

export default function PrintLayout({ children }: { children: React.Node }) {
  return (
    <html lang="en">
      <body>
        <style jsx global>{`
          @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap');
          
          @page {
            size: A4;
            margin: 0;
          }
          .invoice-body {
            font-family: 'Roboto', 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
            background-color: #fff;
            color: #333;
            font-size: 11px;
            line-height: 1.6;
            position: relative;
          }
          .watermark {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            opacity: 0.05;
            z-index: 0;
            pointer-events: none;
            overflow: hidden;
            background-repeat: no-repeat;
            background-position: center;
            background-size: 50%;
          }
          .invoice-container {
            max-width: 800px;
            margin: 0 auto;
            padding: 25mm 15mm;
            position: relative;
            z-index: 1;
            background: transparent;
          }
          .invoice-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 2px solid #D4AF37;
            padding-bottom: 15px;
            margin-bottom: 20px;
          }
          .shop-details-container {
            display: flex;
            align-items: center;
            gap: 15px;
          }
          .shop-logo {
            width: 70px;
            height: 70px;
          }
          .logo-fallback-container {
            width: 70px;
            height: 70px;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .shop-name {
            font-size: 24px;
            font-weight: 700;
            color: #800000;
            margin: 0;
            text-transform: uppercase;
          }
          .shop-info p {
            margin: 2px 0;
            font-size: 10px;
          }
          .invoice-meta {
            text-align: right;
          }
          .invoice-meta h2 {
            font-size: 18px;
            font-weight: 700;
            color: #333;
            margin: 0 0 10px 0;
          }
          .invoice-meta p {
            margin: 2px 0;
            font-size: 11px;
          }
          .customer-details {
            border: 1px solid #eee;
            background-color: #fcfcfc;
            padding: 15px;
            margin-bottom: 20px;
            border-radius: 4px;
          }
          .customer-details h3 {
            margin: 0 0 5px 0;
            font-size: 12px;
            font-weight: 700;
            text-transform: uppercase;
            color: #800000;
          }
          .customer-details p {
            margin: 1px 0;
          }
          .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          .items-table th, .items-table td {
            border: 1px solid #e5e7eb;
            padding: 8px 10px;
          }
          .items-table th {
            background-color: #f9fafb;
            font-weight: 700;
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            text-align: left;
          }
          .items-table .text-right {
            text-align: right;
          }
          .summary-section {
            display: flex;
            justify-content: flex-end;
            margin-top: 10px;
            margin-bottom: 20px;
          }
          .summary-details {
            width: 45%;
            max-width: 350px;
          }
          .summary-row {
            display: flex;
            justify-content: space-between;
            padding: 7px 10px;
            border-bottom: 1px solid #eee;
          }
          .summary-row:last-child {
            border-bottom: none;
          }
          .summary-row.grand-total {
            font-size: 16px;
            font-weight: 700;
            background-color: #f9fafb;
            color: #800000;
            border-top: 2px solid #D4AF37;
            padding: 10px;
            border-radius: 0 0 4px 4px;
          }
          .words-section {
            padding: 15px;
            border-top: 1px dashed #ccc;
            border-bottom: 1px dashed #ccc;
            margin-bottom: 30px;
            font-size: 12px;
          }
          .words-section p {
            margin: 0;
            font-style: italic;
          }
          .invoice-footer {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
          }
          .terms {
            font-size: 9px;
            color: #666;
          }
          .terms h4 {
            margin: 0 0 5px 0;
            font-weight: 700;
            color: #333;
          }
          .terms p {
            margin: 0;
          }
          .signature {
            text-align: center;
          }
          .signature p {
            margin: 0;
            font-size: 11px;
          }
          .signature-box {
            height: 50px;
            margin-bottom: 5px;
          }
          
          @media print {
            body { 
              -webkit-print-color-adjust: exact; 
              print-color-adjust: exact;
            }
            .invoice-container {
              box-shadow: none;
              margin: 0;
              max-width: 100%;
              border-radius: 0;
            }
          }
        `}</style>
        {children}
      </body>
    </html>
  );
}
