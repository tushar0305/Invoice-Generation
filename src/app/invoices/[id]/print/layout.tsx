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
            margin: 0;
          }
          body {
            font-family: 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
          }
          .invoice-container {
            position: relative;
            max-width: 800px;
            margin: 0 auto;
            background: white;
            padding: 40px;
            overflow: hidden;
            font-size: 14px;
            color: #333;
          }
          .watermark {
            position: absolute;
            inset: 0;
            opacity: 0.06;
            pointer-events: none;
            background-repeat: no-repeat;
            background-position: center;
            background-size: 60%;
            z-index: 0;
          }
          .header {
            text-align: center;
            border-bottom: 1px solid #eee;
            padding-bottom: 16px;
            margin-bottom: 24px;
          }
          .header-logo {
            margin: 0 auto 8px auto;
            width: 80px;
            height: 80px;
          }
          .shop-name {
            font-size: 28px;
            font-weight: 700;
            color: #b8860b; /* DarkGoldenRod */
          }
          .shop-address, .shop-contact {
            font-size: 12px;
            color: #555;
          }
          .invoice-details {
            display: flex;
            justify-content: space-between;
            margin-bottom: 24px;
            font-size: 12px;
          }
          .invoice-details .customer-details {
            text-align: right;
          }
          .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 24px;
            font-size: 12px;
          }
          .items-table th, .items-table td {
            border: 1px solid #eee;
            padding: 8px;
          }
          .items-table th {
            background-color: #fcf8e3; /* Light yellow */
            text-align: left;
            font-weight: 600;
          }
          .items-table .text-right {
            text-align: right;
          }
          .summary {
            display: flex;
            justify-content: flex-end;
            font-size: 12px;
          }
          .summary-box {
            width: 50%;
            max-width: 300px;
          }
          .summary-item {
            display: flex;
            justify-content: space-between;
            padding: 6px 0;
          }
          .summary-item.total {
            font-size: 18px;
            font-weight: 700;
            border-top: 2px solid #333;
            margin-top: 8px;
            padding-top: 8px;
          }
          .words-section {
            margin-top: 24px;
            padding: 12px 0;
            border-top: 1px solid #eee;
            border-bottom: 1px solid #eee;
            font-size: 12px;
          }
          .footer {
            text-align: center;
            margin-top: 32px;
            padding-top: 16px;
            border-top: 1px solid #eee;
            font-size: 12px;
            color: #777;
          }
          @media print {
            body { 
              -webkit-print-color-adjust: exact; 
              print-color-adjust: exact;
              background-color: #fff;
              margin: 0;
            }
            .invoice-container {
                box-shadow: none;
                margin: 0;
                padding: 25mm 15mm; /* Standard print margins */
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

    