import React from 'react';

export const metadata = {
  title: 'Tax Invoice',
};

export default function PrintLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <style>{`
          @page { size: A4; margin: 15mm; }
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 11px; color: #111111; line-height: 1.5; position: relative; }
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
          .logo-img { display: none; }
          .shop-info { flex: 1; }
          .shop-name { font-size: 22px; font-weight: 800; color: #111111; margin-bottom: 6px; text-transform: uppercase; letter-spacing: .3px; }
          .shop-details { margin-top: 2px; }
          .muted { color: #444444; font-size: 10px; }
          .invoice-info { text-align: right; }
          .invoice-info div { margin-bottom: 4px; }
          .invoice-title { font-size: 22px; font-weight: 800; color: #111111; margin-bottom: 6px; text-transform: uppercase; }
          table { width: 100%; border-collapse: collapse; margin-top: 12px; }
          th, td { border: 1px solid #d1d5db; padding: 10px 8px; text-align: left; }
          th { background: #f3f4f6; font-weight: 700; color: #111111; font-size: 10px; text-transform: uppercase; }
          td { font-size: 10px; color: #111111; }
          .right { text-align: right; }
          .totals { width: 50%; margin-left: auto; margin-top: 0; }
          .totals td { border: none; padding: 6px 8px; }
          .totals tr:last-child td { border-top: 2px solid #111111; padding-top: 10px; }
          .grand { font-size: 16px; font-weight: 800; color: #111111; }
          .footer { margin-top: 24px; padding-top: 12px; border-top: 1px solid #d1d5db; display: flex; justify-content: space-between; font-size: 10px; color: #444444; }
          .signature-section { text-align: right; }
        `}</style>
      </head>
      <body>{children}</body>
    </html>
  );
}
