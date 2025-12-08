import type { SupabaseClient } from '@supabase/supabase-js';
import { headers } from 'next/headers';

export type AuditLogParams = {
    supabase: SupabaseClient;
    userId: string;
    shopId: string;
    action: 'CREATE' | 'UPDATE' | 'DELETE' | 'READ';
    entityType: string;
    entityId: string;
    metadata?: Record<string, any>;
};

/**
 * Logs an audit event to the database
 * This provides a complete trail of all actions for compliance and debugging
 */
export async function logAudit(params: AuditLogParams): Promise<void> {
    const { supabase, userId, shopId, action, entityType, entityId, metadata } = params;

    try {
        const headersList = await headers();
        const ipAddress = headersList.get('x-forwarded-for') ||
            headersList.get('x-real-ip') ||
            'unknown';
        const userAgent = headersList.get('user-agent') || 'unknown';

        // Insert audit log
        const { error } = await supabase
            .from('audit_logs')
            .insert({
                shop_id: shopId,
                user_id: userId,
                action,
                entity_type: entityType,
                entity_id: entityId,
                metadata: metadata || {},
                ip_address: ipAddress,
                user_agent: userAgent,
                created_at: new Date().toISOString(),
            });

        if (error) {
            // Don't throw - audit logging should not break the main operation
            if (process.env.NODE_ENV === 'development') {
                console.error('[Audit Log Error]', error);
            }
        }

        // Also log to console for development
        if (process.env.NODE_ENV === 'development') {
            console.log('[Audit]', {
                userId,
                shopId,
                action,
                entityType,
                entityId,
                timestamp: new Date().toISOString(),
            });
        }

    } catch (error) {
        if (process.env.NODE_ENV === 'development') {
            console.error('[Audit Log Exception]', error);
        }
    }
}

/**
 * Helper to log multiple audit events in batch
 * Useful for operations that affect multiple entities
 */
export async function logAuditBatch(
    supabase: SupabaseClient,
    logs: Omit<AuditLogParams, 'supabase'>[]
): Promise<void> {
    for (const log of logs) {
        await logAudit({ supabase, ...log });
    }
}

/**
 * Create an audit logger bound to specific context
 * Useful for API routes where context doesn't change
 */
export function createAuditLogger(
    supabase: SupabaseClient,
    userId: string,
    shopId: string
) {
    return {
        log: (params: Omit<AuditLogParams, 'supabase' | 'userId' | 'shopId'>) =>
            logAudit({ supabase, userId, shopId, ...params }),

        logCreate: (entityType: string, entityId: string, metadata?: Record<string, any>) =>
            logAudit({ supabase, userId, shopId, action: 'CREATE', entityType, entityId, metadata }),

        logUpdate: (entityType: string, entityId: string, metadata?: Record<string, any>) =>
            logAudit({ supabase, userId, shopId, action: 'UPDATE', entityType, entityId, metadata }),

        logDelete: (entityType: string, entityId: string, metadata?: Record<string, any>) =>
            logAudit({ supabase, userId, shopId, action: 'DELETE', entityType, entityId, metadata }),
    };
}
