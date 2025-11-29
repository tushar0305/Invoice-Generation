'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/supabase/client';
import { useUser } from '@/supabase/provider';
import { useTheme } from '@/components/theme-provider';
import type { Shop, UserShopRole, UserRole, Permission } from '@/lib/definitions';

type ActiveShopContextType = {
    activeShop: Shop | null;
    userShops: Shop[];
    userRole: UserShopRole | null;
    permissions: Permission;
    isLoading: boolean;
    switchShop: (shopId: string) => Promise<void>;
    refreshShops: () => Promise<void>;
};

const ActiveShopContext = createContext<ActiveShopContextType | undefined>(undefined);

export function ActiveShopProvider({ children }: { children: ReactNode }) {
    const { user } = useUser();
    const { setTheme } = useTheme();
    const [activeShop, setActiveShop] = useState<Shop | null>(null);
    const [userShops, setUserShops] = useState<Shop[]>([]);
    const [userRole, setUserRole] = useState<UserShopRole | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Calculate permissions based on role
    // During loading or when no role is set, grant NO permissions to be safe
    // Once role is loaded, grant appropriate permissions
    const permissions: Permission = {
        canCreateInvoices: !!userRole, // All roles with active shop
        canEditAllInvoices: userRole?.role === 'owner' || userRole?.role === 'manager',
        canDeleteInvoices: userRole?.role === 'owner' || userRole?.role === 'manager',
        canExportInvoices: userRole?.role === 'owner' || userRole?.role === 'manager',
        canManageStock: userRole?.role === 'owner' || userRole?.role === 'manager',
        canViewStock: !!userRole, // All roles with active shop
        canEditSettings: userRole?.role === 'owner',
        canInviteStaff: userRole?.role === 'owner',
        canViewAnalytics: !!userRole, // All roles with active shop
        canCreateShop: userRole?.role === 'owner',
    };

    // Load user's shops and active shop
    const loadShops = async () => {
        console.log('🔄 loadShops: Starting...');
        if (!user?.uid || !user?.email) {
            console.log('❌ loadShops: No valid user, setting defaults');
            setUserShops([]);
            setActiveShop(null);
            setUserRole(null);
            setIsLoading(false);
            return;
        }

        try {
            console.log('🔄 loadShops: Setting loading to true for user:', user.uid);
            setIsLoading(true);

            console.log('🔄 loadShops: Querying user_shop_roles for user:', user.uid);
            // Get user's shop IDs first
            const { data: userShopRoles, error: rolesError } = await supabase
                .from('user_shop_roles')
                .select('*')
                .eq('user_id', user.uid)
                .eq('is_active', true);

            console.log('📊 loadShops: userShopRoles result:', {
                count: userShopRoles?.length,
                errorMessage: rolesError?.message,
                errorCode: rolesError?.code,
                errorDetails: rolesError?.details,
                errorHint: rolesError?.hint,
                fullError: JSON.stringify(rolesError),
                roles: userShopRoles
            });

            if (rolesError) {
                console.error('❌ loadShops: Error fetching roles:', {
                    message: rolesError.message,
                    code: rolesError.code,
                    details: rolesError.details,
                    hint: rolesError.hint,
                    full: rolesError
                });
                // Don't throw - instead set empty state and continue
                setUserShops([]);
                setActiveShop(null);
                setUserRole(null);
                setIsLoading(false);
                return;
            }

            // If we have shop roles, get the shop details
            if (userShopRoles && userShopRoles.length > 0) {
                console.log('✅ loadShops: Found shop roles, querying shops...');

                const shopIds = userShopRoles.map((usr: any) => usr.shop_id);
                console.log('🔍 loadShops: Querying shops with IDs:', shopIds);

                // Query shops separately to avoid RLS JOIN issues
                const { data: shopsData, error: shopsError } = await supabase
                    .from('shops')
                    .select('*')
                    .in('id', shopIds);

                console.log('📊 loadShops: shops result:', {
                    count: shopsData?.length,
                    error: shopsError?.message,
                    shops: shopsData
                });

                if (shopsError) {
                    console.error('❌ loadShops: Error fetching shops:', shopsError);
                    throw shopsError;
                }

                if (shopsData && shopsData.length > 0) {
                    console.log('✅ loadShops: Found shops data');

                    const shops: Shop[] = shopsData.map((shop: any) => ({
                        id: shop.id,
                        shopName: shop.shop_name,
                        gstNumber: shop.gst_number,
                        panNumber: shop.pan_number,
                        address: shop.address,
                        state: shop.state,
                        pincode: shop.pincode,
                        phoneNumber: shop.phone_number,
                        email: shop.email,
                        logoUrl: shop.logo_url,
                        templateId: shop.template_id,
                        cgstRate: Number(shop.cgst_rate) || 1.5,
                        sgstRate: Number(shop.sgst_rate) || 1.5,
                        isActive: shop.is_active,
                        createdBy: shop.created_by,
                        createdAt: shop.created_at,
                        updatedAt: shop.updated_at,
                    }));

                    setUserShops(shops);

                    // Get user's last active shop from preferences
                    const { data: prefs } = await supabase
                        .from('user_preferences')
                        .select('last_active_shop_id, theme')
                        .eq('user_id', user.uid)
                        .maybeSingle();

                    if (prefs?.theme) {
                        setTheme(prefs.theme as any);
                    }

                    let activeShopId = prefs?.last_active_shop_id;

                    // If no preference or shop not accessible, use first owner shop
                    if (!activeShopId || !shops.find(s => s.id === activeShopId)) {
                        const ownerShop = userShopRoles.find((usr: any) => usr.role === 'owner');
                        activeShopId = ownerShop?.shop_id || shops[0]?.id;
                    }

                    if (activeShopId) {
                        const shop = shops.find(s => s.id === activeShopId);
                        if (shop) {
                            setActiveShop(shop);

                            // Get user's role for this shop
                            const role = userShopRoles.find((usr: any) => usr.shop_id === activeShopId);
                            if (role) {
                                setUserRole({
                                    id: role.id,
                                    userId: role.user_id,
                                    shopId: role.shop_id,
                                    role: role.role as UserRole,
                                    invitedBy: role.invited_by,
                                    invitedAt: role.invited_at,
                                    acceptedAt: role.accepted_at,
                                    isActive: role.is_active,
                                    createdAt: role.created_at,
                                    updatedAt: role.updated_at,
                                });
                            }
                        }
                    }
                } else {
                    // Shops query failed or returned no data
                    console.error('Failed to load shops:', shopsError);
                }
            } else {
                // No roles found - user has no access to any shops
                console.log('ℹ️ No shop roles found. User needs to create or be invited to a shop.');
                setUserShops([]);
                setActiveShop(null);
                setUserRole(null);
            }
        } catch (error) {
            console.error('Error loading shops:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Switch to a different shop
    const switchShop = async (shopId: string) => {
        const shop = userShops.find(s => s.id === shopId);
        if (!shop || !user?.uid) return;

        setActiveShop(shop);

        // Update user preferences (only if not temp mode)
        if (!shopId.startsWith('temp-')) {
            await supabase
                .from('user_preferences')
                .upsert({
                    user_id: user.uid,
                    last_active_shop_id: shopId,
                }, { onConflict: 'user_id' });

            // Reload role for new shop
            const { data: role } = await supabase
                .from('user_shop_roles')
                .select('*')
                .eq('user_id', user.uid)
                .eq('shop_id', shopId)
                .eq('is_active', true)
                .maybeSingle();

            if (role) {
                setUserRole({
                    id: role.id,
                    userId: role.user_id,
                    shopId: role.shop_id,
                    role: role.role as UserRole,
                    inviteCode: role.invite_code,
                    invitedBy: role.invited_by,
                    invitedAt: role.invited_at,
                    acceptedAt: role.accepted_at,
                    isActive: role.is_active,
                    createdAt: role.created_at,
                    updatedAt: role.updated_at,
                });
            } else {
                setUserRole(null); // Should not happen if shop is valid and not temp
            }
        } else {
            // For temporary shops, set a default owner role
            setUserRole({
                id: 'temp-role',
                userId: user.uid,
                shopId: shopId,
                role: 'owner',
                isActive: true,
                invitedAt: new Date().toISOString(),
                acceptedAt: new Date().toISOString(),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            });
        }
    };

    // Load shops on mount and user change
    useEffect(() => {
        loadShops();
    }, [user?.uid]);

    return (
        <ActiveShopContext.Provider
            value={{
                activeShop,
                userShops,
                userRole,
                permissions,
                isLoading,
                switchShop,
                refreshShops: loadShops,
            }}
        >
            {children}
        </ActiveShopContext.Provider>
    );
}

export function useActiveShop() {
    const context = useContext(ActiveShopContext);
    if (context === undefined) {
        throw new Error('useActiveShop must be used within a ActiveShopProvider');
    }
    return context;
}
