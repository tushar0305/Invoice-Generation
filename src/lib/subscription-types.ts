export type PlanTier = 'free' | 'gold' | 'platinum';

export interface PlanLimits {
    invoices: number; // -1 for unlimited
    customers: number;
    staff: number;
    ai_tokens: number;
}

export interface PlanFeatures {
    ai_insights: boolean;
    custom_branding: boolean;
    priority_support?: boolean;
    whatsapp_integration?: boolean;
}

export interface Plan {
    id: PlanTier;
    name: string;
    description: string;
    price_monthly: number;
    price_yearly: number;
    limits: PlanLimits;
    features: PlanFeatures;
}

export interface ShopSubscription {
    shop_id: string;
    plan_id: PlanTier;
    status: 'active' | 'past_due' | 'canceled' | 'trialing';
    current_period_start: string;
    current_period_end: string;
    cancel_at_period_end: boolean;
}

export interface ShopUsage {
    shop_id: string;
    period_start: string;
    invoices_created: number;
    customers_added: number;
    staff_seats_occupied: number;
    ai_tokens_used: number;
    storage_bytes: number;
    updated_at: string;
}

export interface SubscriptionContextType {
    plan: Plan;
    subscription: ShopSubscription | null;
    usage: ShopUsage;
    checkLimit: (metric: keyof PlanLimits, currentUsage?: number) => boolean;
}
