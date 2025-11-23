import type { UserRole } from './definitions';

/**
 * Permission helper functions for RBAC
 */

export function canCreateInvoices(role: UserRole | null | undefined): boolean {
    return !!role; // All roles can create invoices
}

export function canEditAllInvoices(role: UserRole | null | undefined): boolean {
    return role === 'owner' || role === 'manager';
}

export function canEditOwnInvoice(
    role: UserRole | null | undefined,
    invoiceCreatorId: string,
    currentUserId: string
): boolean {
    if (!role) return false;
    if (role === 'owner' || role === 'manager') return true;
    return role === 'staff' && invoiceCreatorId === currentUserId;
}

export function canDeleteInvoices(role: UserRole | null | undefined): boolean {
    return role === 'owner' || role === 'manager';
}

export function canExportInvoices(role: UserRole | null | undefined): boolean {
    return role === 'owner' || role === 'manager';
}

export function canManageStock(role: UserRole | null | undefined): boolean {
    return role === 'owner' || role === 'manager';
}

export function canViewStock(role: UserRole | null | undefined): boolean {
    return !!role; // All roles can view stock
}

export function canEditSettings(role: UserRole | null | undefined): boolean {
    return role === 'owner';
}

export function canInviteStaff(role: UserRole | null | undefined): boolean {
    return role === 'owner';
}

export function canViewAnalytics(role: UserRole | null | undefined): boolean {
    return !!role; // All roles can view analytics (per user requirement)
}

export function canCreateShop(role: UserRole | null | undefined): boolean {
    return role === 'owner';
}

export function canManageStaffRoles(role: UserRole | null | undefined): boolean {
    return role === 'owner';
}

/**
 * Get all permissions for a role
 */
export function getPermissions(role: UserRole | null | undefined) {
    return {
        canCreateInvoices: canCreateInvoices(role),
        canEditAllInvoices: canEditAllInvoices(role),
        canDeleteInvoices: canDeleteInvoices(role),
        canExportInvoices: canExportInvoices(role),
        canManageStock: canManageStock(role),
        canViewStock: canViewStock(role),
        canEditSettings: canEditSettings(role),
        canInviteStaff: canInviteStaff(role),
        canViewAnalytics: canViewAnalytics(role),
        canCreateShop: canCreateShop(role),
        canManageStaffRoles: canManageStaffRoles(role),
    };
}

/**
 * Role display helpers
 */
export function getRoleDisplayName(role: UserRole): string {
    const names: Record<UserRole, string> = {
        owner: 'Owner',
        manager: 'Manager',
        staff: 'Staff',
    };
    return names[role];
}

export function getRoleBadgeColor(role: UserRole): string {
    const colors: Record<UserRole, string> = {
        owner: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
        manager: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
        staff: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400',
    };
    return colors[role];
}
