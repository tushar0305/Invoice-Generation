import { supabase } from '@/supabase/client';

/**
 * Fetches the public slug for a shop from catalogue_settings.
 * This is required to generate the public passbook URL.
 */
export async function getShopSlug(shopId: string): Promise<string | null> {
    try {
        const { data, error } = await supabase
            .from('catalogue_settings')
            .select('public_slug')
            .eq('shop_id', shopId)
            .single();
        
        if (error) {
            console.warn('Error fetching shop slug:', error);
            return null;
        }
        return data?.public_slug || null;
    } catch (err) {
        console.error('Failed to get shop slug:', err);
        return null;
    }
}

/**
 * Generates the full URL for the customer's digital passbook.
 */
export function generatePassbookUrl(slug: string, enrollmentId: string): string {
    // Ensure we are on the client side
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    return `${origin}/store/${slug}/schemes/${enrollmentId}`;
}

/**
 * Opens WhatsApp with a pre-filled message.
 * If phone is provided, it opens the chat with that person.
 * If phone is empty, it opens the contact picker.
 */
export function openWhatsApp(phone: string | undefined, text: string) {
    const cleanPhone = phone ? phone.replace(/\D/g, '') : '';
    // Use '91' prefix if missing for Indian numbers (common use case)
    // But better to rely on what's stored. 
    // If cleanPhone is empty, wa.me/?text=... works to pick a contact.
    
    const url = cleanPhone 
        ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`
        : `https://wa.me/?text=${encodeURIComponent(text)}`;
        
    window.open(url, '_blank');
}

/**
 * Generates the welcome message for a new enrollment.
 */
export function getEnrollmentMessage(
    customerName: string, 
    schemeName: string, 
    passbookUrl: string
): string {
    return `Hello ${customerName},
Welcome to the *${schemeName}* scheme! 🎉

You can track your payments, accumulated gold, and maturity details using your Digital Passbook:
${passbookUrl}

Thank you for trusting us with your savings!`;
}

/**
 * Generates the payment receipt message.
 */
export function getPaymentMessage(
    customerName: string,
    amount: number,
    weight: number,
    schemeName: string,
    passbookUrl: string
): string {
    const weightText = weight > 0 ? ` (${weight.toFixed(3)}g added)` : '';
    return `Dear ${customerName},
Received payment of ₹${amount}${weightText} for *${schemeName}*. ✅

View your updated passbook here:
${passbookUrl}`;
}
