import { createClient } from '@/supabase/server';
import { generateInvoicePdf } from '@/lib/pdf';
import { NextRequest, NextResponse } from 'next/server';
import type { Invoice, InvoiceItem } from '@/lib/definitions';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ invoiceId: string }> }
) {
  const { invoiceId } = await params;
  const supabase = await createClient();

  // 1. Auth Check
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. Fetch Invoice
  const { data: invoiceData, error: invoiceError } = await supabase
    .from('invoices')
    .select('*')
    .eq('id', invoiceId)
    .single();

  if (invoiceError || !invoiceData) {
    return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
  }

  // 3. Check Access
  // Verify user has access to this shop
  const { data: role } = await supabase
    .from('user_shop_roles')
    .select('role')
    .eq('user_id', user.id)
    .eq('shop_id', invoiceData.shop_id)
    .single();

  if (!role) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // 4. Fetch Items
  const { data: itemsData, error: itemsError } = await supabase
    .from('invoice_items')
    .select('*')
    .eq('invoice_id', invoiceId);

  if (itemsError) {
    return NextResponse.json({ error: 'Failed to fetch items' }, { status: 500 });
  }

  // 5. Fetch Shop Settings
  const { data: shopData, error: shopError } = await supabase
    .from('shops')
    .select('*')
    .eq('id', invoiceData.shop_id)
    .single();

  if (shopError) {
    return NextResponse.json({ error: 'Shop not found' }, { status: 500 });
  }

  // 6. Map Data to Types
  const invoice: Invoice = {
    id: invoiceData.id,
    shopId: invoiceData.shop_id,
    invoiceNumber: invoiceData.invoice_number,
    customerId: invoiceData.customer_id,
    customerSnapshot: invoiceData.customer_snapshot || { name: 'Guest' },
    invoiceDate: invoiceData.invoice_date,
    status: invoiceData.status,
    subtotal: Number(invoiceData.subtotal),
    discount: Number(invoiceData.discount),
    cgstAmount: Number(invoiceData.cgst_amount),
    sgstAmount: Number(invoiceData.sgst_amount),
    grandTotal: Number(invoiceData.grand_total),
    notes: invoiceData.notes,
    createdByName: invoiceData.created_by_name, // Assuming this field exists or is handled
    createdAt: invoiceData.created_at,
    updatedAt: invoiceData.updated_at,
  };

  const items: InvoiceItem[] = (itemsData || []).map((item: any) => ({
    id: item.id,
    description: item.description,
    purity: item.purity,

    metalType: item.metal_type,
    category: item.category,
    hsnCode: item.hsn_code,

    grossWeight: Number(item.gross_weight || 0),
    netWeight: Number(item.net_weight || 0),
    stoneWeight: Number(item.stone_weight || 0),
    wastagePercent: Number(item.wastage_percent || 0),

    rate: Number(item.rate || 0),
    makingRate: Number(item.making_rate || 0),
    making: Number(item.making || 0),
    stoneAmount: Number(item.stone_amount || 0),

    // Calculate total amount per item for display
    amount: (
      (Number(item.net_weight || 0) * Number(item.rate || 0)) +
      (Number(item.making_rate || 0) * Number(item.net_weight || 0)) +
      (Number(item.making || 0)) +
      (Number(item.stone_amount || 0))
    )
  }));

  const settings = {
    shopName: shopData.shop_name,
    address: shopData.address,
    state: shopData.state,
    pincode: shopData.pincode,
    phoneNumber: shopData.phone_number,
    email: shopData.email,
    gstNumber: shopData.gst_number,
    panNumber: shopData.pan_number,
    logoUrl: shopData.logo_url,
    cgstRate: Number(shopData.cgst_rate),
    sgstRate: Number(shopData.sgst_rate),
    templateId: shopData.template_id,
  };

  // 7. Generate PDF
  try {
    const pdfBlob = await generateInvoicePdf({
      invoice,
      items,
      settings
    });

    // Convert Blob to ArrayBuffer for NextResponse
    const arrayBuffer = await pdfBlob.arrayBuffer();

    // 8. Return Response
    return new NextResponse(arrayBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Invoice-${invoice.invoiceNumber}.pdf"`,
      },
    });
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('PDF Generation Error:', error);
    }
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  }
}
