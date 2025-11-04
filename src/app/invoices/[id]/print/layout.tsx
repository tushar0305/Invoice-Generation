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
          @page { size: A4; margin: 15mm; }
          body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            font-size: 11px; 
            color: #111111; 
            line-height: 1.5; 
            position: relative; 
            background-color: #fff;
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
            opacity: 0.08; 
            z-index: 0; 
            pointer-events: none;
            overflow: hidden;
          }
          .watermark img { 
            width: auto; 
            height: 750px;
            filter: grayscale(100%) contrast(80%);
          }
          .header { 
            display: flex; 
            justify-content: space-between; 
            align-items: flex-start; 
            margin-bottom: 30px; 
            padding-bottom: 12px; 
            position: relative;
            z-index: 1;
          }
          .logo-section { 
            min-width: 60%; 
            padding-right: 20px;
          }
          .shop-name { 
            font-size: 22px; 
            font-weight: 800; 
            color: #111111; 
            margin-bottom: 2px; 
            letter-spacing: 0.3px; 
            text-transform: uppercase;
          }
          .shop-details { margin-top: 2px; font-size: 12px; }
          .invoice-info { text-align: right; }
          .invoice-info div { margin-bottom: 4px; }
          .invoice-title { font-size: 22px; font-weight: 800; color: #111111; margin-bottom: 6px; text-transform: uppercase; }
          table { width: 100%; border-collapse: collapse; margin-top: 12px; }
          th, td { border: 1px solid #d1d5db; padding: 10px 8px; text-align: left; }
          th { background: #f3f4f6; font-weight: 700; color: #111111; font-size: 10px; text-transform: uppercase; }
          td { font-size: 10px; color: #111111; }
          .right { text-align: right; }
          .totals { width: 45%; margin-left: auto; margin-top: 15px; }
          .totals td { border: none; padding: 6px 8px; }
          .totals tr.grand-total td { border-top: 2px solid #111111; padding-top: 10px; font-size: 16px; font-weight: 800; color: #111111; }
          .grand { font-size: 16px; font-weight: 800; color: #111111; }
          .footer { margin-top: 24px; padding-top: 12px; border-top: 1px solid #d1d5db; display: flex; justify-content: space-between; font-size: 10px; color: #444444; }
          .signature-section { text-align: right; }
          
          @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
        `}</style>
        {children}
      </body>
    </html>
  );
}
