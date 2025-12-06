// WhatsApp Marketing Types

export interface WhatsAppConfig {
    id: string;
    shop_id: string;
    phone_number: string;
    waba_id: string;
    phone_number_id: string;
    display_name?: string;
    status: 'pending' | 'connected' | 'error';
    created_at: string;
    updated_at: string;
}

export interface WhatsAppTemplate {
    id: string;
    shop_id: string;
    name: string;
    category: 'MARKETING' | 'UTILITY' | 'AUTHENTICATION';
    language: string;
    body: string;
    header_text?: string;
    footer?: string;
    buttons?: TemplateButton[];
    meta_template_id?: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    created_at: string;
}

export interface TemplateButton {
    type: 'QUICK_REPLY' | 'URL' | 'PHONE_NUMBER';
    text: string;
    url?: string;
    phone_number?: string;
}

export interface WhatsAppMessage {
    id: string;
    shop_id: string;
    customer_id?: string;
    template_id?: string;
    phone_number: string;
    variables?: Record<string, string>;
    meta_message_id?: string;
    status: 'pending' | 'sent' | 'failed';
    error_message?: string;
    sent_at: string;
}

// API Request/Response types
export interface SaveConfigRequest {
    phone_number: string;
    waba_id: string;
    phone_number_id: string;
    access_token: string;
    display_name?: string;
}

export interface TestConnectionResponse {
    success: boolean;
    display_name?: string;
    error?: string;
}

export interface SendMessageRequest {
    template_name: string;
    phone_number: string;
    variables?: string[];
}

export interface BulkSendRequest {
    template_id: string;
    segment: 'ALL' | 'HIGH_VALUE' | 'DUE' | 'LOYAL';
    variable_mapping?: Record<string, string>;
}

// Audience segments
export type AudienceSegment =
    | 'ALL'           // All customers with phone numbers
    | 'HIGH_VALUE'    // Top 20% by purchase amount
    | 'DUE'           // Customers with pending payments
    | 'LOYAL'         // Loyalty program members
    | 'RECENT_90'     // Purchased in last 90 days
    | 'INACTIVE';     // No purchase in 180+ days
