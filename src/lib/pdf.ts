import type { Invoice, InvoiceItem, UserSettings } from './definitions';
import html2canvas from 'html2canvas';

// Dynamic import caches
let JsPdfModule: any;

async function getJsPdf() {
  if (!JsPdfModule) {
    const mod = await import('jspdf');
    JsPdfModule = mod.default || mod;
  }
  return JsPdfModule;
}

interface GenerateInvoicePdfParams {
  invoice: Invoice;
  items: InvoiceItem[];
  settings?: Partial<UserSettings> | null;
}

// Render a Tailwind-styled React template offscreen and capture as PDF (single source-of-truth template)
export async function generateInvoicePdfTailwind({ invoice, items, settings }: GenerateInvoicePdfParams): Promise<Blob> {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    throw new Error('PDF generation must run in the browser');
  }

  // Dynamically import the template and React DOM to avoid server-side issues
  const [{ default: InvoicePdfTemplate }, reactDom] = await Promise.all([
    import('@/components/invoice-pdf-template'),
    import('react-dom/client'),
  ]);

  // Ensure Roboto font (used by print layout) is available for parity
  try {
    const href = "https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap";
    const existing = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
      .some(l => (l as HTMLLinkElement).href.includes('fonts.googleapis.com') && (l as HTMLLinkElement).href.includes('Roboto'));
    if (!existing) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      document.head.appendChild(link);
    }
    // Wait for fonts to be ready
    if ((document as any).fonts?.ready) {
      await (document as any).fonts.ready;
      try {
        await (document as any).fonts.load('700 16px Roboto');
      } catch { }
    }
  } catch { }

  // Create an offscreen container with fixed width ~ A4 @ 96dpi for consistency
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-10000px';
  container.style.top = '0';
  container.style.width = '794px'; // ~210mm at 96dpi
  container.style.minWidth = '794px'; // Ensure minimum width
  container.style.maxWidth = '794px'; // Prevent expansion
  container.style.background = '#ffffff';
  container.style.color = '#000000'; // Enforce black text
  container.style.padding = '0';
  container.style.margin = '0';
  container.style.overflow = 'hidden'; // Prevent overflow issues
  container.style.boxSizing = 'border-box';
  container.setAttribute('data-invoice-pdf-root', '1');
  container.className = 'light'; // Force light mode if Tailwind uses .dark class on body

  document.body.appendChild(container);

  const root = reactDom.createRoot(container);
  // Render without JSX to keep this file as .ts
  const element = (await import('react')).createElement(
    InvoicePdfTemplate,
    { invoice, items, settings: settings || null }
  );
  root.render(element);

  // Wait two frames for layout + fonts to settle
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  // Extra buffer to allow webfonts to finalize if any are late
  await new Promise((r) => setTimeout(r, 150));

  try {
    const canvas = await html2canvas(container, {
      scale: 2,
      backgroundColor: '#ffffff',
      useCORS: true,
      logging: false,
      width: 794, // Force fixed width for consistent rendering
      windowWidth: 794, // Force viewport width for rendering
      windowHeight: container.scrollHeight,
    });
    const imgData = canvas.toDataURL('image/jpeg', 0.95);

    const jsPDF = await getJsPdf();
    const pdf = new jsPDF({ unit: 'mm', format: 'a4' });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 10; // mm
    const printableWidth = pageWidth - margin * 2;
    const printableHeight = pageHeight - margin * 2;

    const imgPxWidth = canvas.width;
    const imgPxHeight = canvas.height;

    // Calculate aspect ratio
    const aspectRatio = imgPxHeight / imgPxWidth;

    // Fit to page width with margins
    const renderWidth = printableWidth;
    const renderHeight = renderWidth * aspectRatio;

    // If height exceeds page, scale down proportionally
    let finalWidth = renderWidth;
    let finalHeight = renderHeight;
    if (finalHeight > printableHeight) {
      finalHeight = printableHeight;
      finalWidth = finalHeight / aspectRatio;
    }

    const x = margin;
    const y = margin;

    pdf.addImage(imgData, 'JPEG', x, y, finalWidth, finalHeight, undefined, 'FAST');
    return new Blob([pdf.output('arraybuffer')], { type: 'application/pdf' });
  } finally {
    try {
      root.unmount();
    } catch { }
    container.remove();
  }
}

