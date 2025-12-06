// WhatsApp Cloud API Client
// Simple encryption using built-in crypto

const ENCRYPTION_KEY = process.env.WHATSAPP_ENCRYPTION_KEY || 'default-dev-key-32chars!!';
const META_API_VERSION = 'v21.0';
const META_API_BASE = `https://graph.facebook.com/${META_API_VERSION}`;

// Simple XOR encryption (for demo - use proper AES in production)
export function encryptToken(token: string): string {
    const key = ENCRYPTION_KEY;
    let result = '';
    for (let i = 0; i < token.length; i++) {
        result += String.fromCharCode(token.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return Buffer.from(result).toString('base64');
}

export function decryptToken(encrypted: string): string {
    const key = ENCRYPTION_KEY;
    const decoded = Buffer.from(encrypted, 'base64').toString();
    let result = '';
    for (let i = 0; i < decoded.length; i++) {
        result += String.fromCharCode(decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return result;
}

// Test connection by fetching phone number details
export async function testConnection(
    phoneNumberId: string,
    accessToken: string
): Promise<{ success: boolean; displayName?: string; error?: string }> {
    try {
        const response = await fetch(
            `${META_API_BASE}/${phoneNumberId}?fields=verified_name,display_phone_number`,
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                },
            }
        );

        if (!response.ok) {
            const error = await response.json();
            return {
                success: false,
                error: error.error?.message || 'Connection failed',
            };
        }

        const data = await response.json();
        return {
            success: true,
            displayName: data.verified_name || data.display_phone_number,
        };
    } catch (error: any) {
        return {
            success: false,
            error: error.message || 'Network error',
        };
    }
}

// Send template message
export async function sendTemplateMessage(
    phoneNumberId: string,
    accessToken: string,
    recipientPhone: string,
    templateName: string,
    languageCode: string = 'en',
    variables: string[] = []
): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
        // Format phone number (remove + and spaces)
        const formattedPhone = recipientPhone.replace(/[+\s-]/g, '');

        // Build components with variables
        const components: any[] = [];
        if (variables.length > 0) {
            components.push({
                type: 'body',
                parameters: variables.map(v => ({ type: 'text', text: v })),
            });
        }

        const payload = {
            messaging_product: 'whatsapp',
            to: formattedPhone,
            type: 'template',
            template: {
                name: templateName,
                language: { code: languageCode },
                ...(components.length > 0 && { components }),
            },
        };

        const response = await fetch(
            `${META_API_BASE}/${phoneNumberId}/messages`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            }
        );

        const data = await response.json();

        if (!response.ok) {
            return {
                success: false,
                error: data.error?.message || 'Failed to send message',
            };
        }

        return {
            success: true,
            messageId: data.messages?.[0]?.id,
        };
    } catch (error: any) {
        return {
            success: false,
            error: error.message || 'Network error',
        };
    }
}

// Fetch templates from Meta
export async function fetchTemplates(
    wabaId: string,
    accessToken: string
): Promise<{ templates: any[]; error?: string }> {
    try {
        const response = await fetch(
            `${META_API_BASE}/${wabaId}/message_templates?limit=100`,
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                },
            }
        );

        if (!response.ok) {
            const error = await response.json();
            return {
                templates: [],
                error: error.error?.message || 'Failed to fetch templates',
            };
        }

        const data = await response.json();
        return { templates: data.data || [] };
    } catch (error: any) {
        return {
            templates: [],
            error: error.message || 'Network error',
        };
    }
}
