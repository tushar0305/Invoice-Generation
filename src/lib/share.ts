// Web-only sharing implementation
// Capacitor has been removed - mobile app will be handled separately

export const shareInvoice = async (invoice: any) => {
  // Use Web Share API if available
  if (navigator.share) {
    try {
      await navigator.share({
        title: `Invoice #${invoice.invoice_number}`,
        text: `Invoice for ${invoice.customer_name}`,
        url: window.location.href,
      });
      return { success: true };
    } catch (error) {
      console.error('Share failed:', error);
      return { success: false, error };
    }
  }

  // Fallback: copy link to clipboard
  try {
    await navigator.clipboard.writeText(window.location.href);
    return { success: true, message: 'Link copied to clipboard' };
  } catch (error) {
    return { success: false, error: 'Sharing not supported' };
  }
};

// Download blob function remains the same
export const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const downloadInvoiceAction = async (pdfBlob: Blob, filename: string) => {
  downloadBlob(pdfBlob, filename);
  return { success: true };
};

export const shareImageAction = async (canvas: HTMLCanvasElement, filename: string) => {
  return new Promise<{ success: boolean, error?: string }>((resolve) => {
    canvas.toBlob(async (blob) => {
      if (!blob) {
        resolve({ success: false, error: 'Failed to create image' });
        return;
      }

      // Use Web Share API if available
      if (navigator.share && navigator.canShare) {
        try {
          const file = new File([blob], filename, { type: 'image/png' });
          if (navigator.canShare({ files: [file] })) {
            await navigator.share({
              files: [file],
              title: filename,
            });
            resolve({ success: true });
            return;
          }
        } catch (error) {
          console.error('Share failed, falling back to download:', error);
        }
      }

      // Fallback: download
      downloadBlob(blob, filename);
      resolve({ success: true });
    }, 'image/png');
  });
};
