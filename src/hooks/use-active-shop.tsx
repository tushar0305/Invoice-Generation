'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/supabase/client';
import { useUser } from '@/supabase/provider';
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
    const [activeShop, setActiveShop] = useState<Shop | null>(null);
    const [userShops, setUserShops] = useState<Shop[]>([]);
    const [userRole, setUserRole] = useState<UserShopRole | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Calculate permissions based on role (default to staff/most restrictive if no role yet)
    const permissions: Permission = {
        canCreateInvoices: true, // All roles
        canEditAllInvoices: userRole?.role === 'owner' || userRole?.role === 'manager',
        canDeleteInvoices: userRole?.role === 'owner' || userRole?.role === 'manager',
        canExportInvoices: userRole?.role === 'owner' || userRole?.role === 'manager',
        canManageStock: userRole?.role === 'owner' || userRole?.role === 'manager',
        canViewStock: true, // All roles
        canEditSettings: userRole?.role === 'owner',
        canInviteStaff: userRole?.role === 'owner',
        canViewAnalytics: true, // All roles (per user feedback)
        canCreateShop: userRole?.role === 'owner',
    };

    // Load user's shops and active shop
    const loadShops = async () => {
        console.log('🔄 loadShops: Starting...');
        if (!user?.uid) {
            console.log('❌ loadShops: No user ID, setting defaults');
            setUserShops([]);
            setActiveShop(null);
            setUserRole(null);
            setIsLoading(false);
            return;
        }

        try {
            console.log('🔄 loadShops: Setting loading to true');
            setIsLoading(true);

            console.log('🔄 loadShops: Querying user_shop_roles...');
            // Get user's shop IDs first
            const { data: userShopRoles, error: rolesError } = await supabase
                .from('user_shop_roles')
                .select('*')
                .eq('user_id', user.uid)
                .eq('is_active', true);

            console.log('📊 loadShops: userShopRoles result:', { count: userShopRoles?.length, error: rolesError?.message });

            // If we have shop roles, get the shop details
            if (!rolesError && userShopRoles && userShopRoles.length > 0) {
                console.log('✅ loadShops: Found shop roles, querying shops...');

                const shopIds = userShopRoles.map((usr: any) => usr.shop_id);

                // Query shops separately to avoid RLS JOIN issues
                const { data: shopsData, error: shopsError } = await supabase
                    .from('shops')
                    .select('*')
                    .in('id', shopIds);

                console.log('📊 loadShops: shops result:', { count: shopsData?.length, error: shopsError?.message });

                if (!shopsError && shopsData && shopsData.length > 0) {
                    console.log('✅ loadShops: Found shops');

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
                        .select('last_active_shop_id')
                        .eq('user_id', user.uid)
                        .maybeSingle();

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
                // FALLBACK: Primary query failed. Try direct approaches.
                console.warn('RBAC tables not populated or no active shops found. Using fallback mode.');

                // STEP 1: Try to find shop directly by created_by
                const { data: directShop } = await supabase
                    .from('shops')
                    .select('*')
                    .eq('created_by', user.uid)
                    .limit(1)
                    .maybeSingle();

                if (directShop) {
                    console.log('✅ Found shop directly via created_by');
                    const shop: Shop = {
                        id: directShop.id,
                        shopName: directShop.shop_name,
                        gstNumber: directShop.gst_number,
                        panNumber: directShop.pan_number,
                        address: directShop.address,
                        state: directShop.state,
                        pincode: directShop.pincode,
                        phoneNumber: directShop.phone_number,
                        email: directShop.email,
                        logoUrl: directShop.logo_url,
                        templateId: directShop.template_id,
                        cgstRate: Number(directShop.cgst_rate) || 1.5,
                        sgstRate: Number(directShop.sgst_rate) || 1.5,
                        isActive: directShop.is_active,
                        createdBy: directShop.created_by,
                        createdAt: directShop.created_at,
                        updatedAt: directShop.updated_at,
                    };

                    setActiveShop(shop);
                    setUserShops([shop]);

                    setUserRole({
                        id: 'direct-owner',
                        userId: user.uid,
                        shopId: shop.id,
                        role: 'owner',
                        isActive: true,
                        invitedAt: new Date().toISOString(),
                        acceptedAt: new Date().toISOString(),
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                    });
                } else {
                    // STEP 2: No shop found in shops table. Check user_settings for migrated ID.
                    const { data: settings } = await supabase
                        .from('user_settings')
                        .select('*')
                        .eq('user_id', user.uid)
                        .maybeSingle();

                    if (settings?.migrated_to_shop_id) {
                        console.log('✅ Found migrated shop ID in user_settings');
                        // Use the migrated shop ID - fetch full shop details
                        const { data: migratedShop } = await supabase
                            .from('shops')
                            .select('*')
                            .eq('id', settings.migrated_to_shop_id)
                            .maybeSingle();

                        if (migratedShop) {
                            const shop: Shop = {
                                id: migratedShop.id,
                                shopName: migratedShop.shop_name,
                                gstNumber: migratedShop.gst_number,
                                panNumber: migratedShop.pan_number,
                                address: migratedShop.address,
                                state: migratedShop.state,
                                pincode: migratedShop.pincode,
                                phoneNumber: migratedShop.phone_number,
                                email: migratedShop.email,
                                logoUrl: migratedShop.logo_url,
                                templateId: migratedShop.template_id,
                                cgstRate: Number(migratedShop.cgst_rate) || 1.5,
                                sgstRate: Number(migratedShop.sgst_rate) || 1.5,
                                isActive: migratedShop.is_active,
                                createdBy: migratedShop.created_by,
                                createdAt: migratedShop.created_at,
                                updatedAt: migratedShop.updated_at,
                            };

                            setActiveShop(shop);
                            setUserShops([shop]);
                            setUserRole({
                                id: 'migrated-owner',
                                userId: user.uid,
                                shopId: shop.id,
                                role: 'owner',
                                isActive: true,
                                invitedAt: new Date().toISOString(),
                                acceptedAt: new Date().toISOString(),
                                createdAt: new Date().toISOString(),
                                updatedAt: new Date().toISOString(),
                            });
                        } else {
                            // Shop referenced in migrated_to_shop_id doesn't exist
                            console.error('❌ migrated_to_shop_id points to non-existent shop');
                            setUserShops([]);
                            setActiveShop(null);
                            setUserRole(null);
                        }
                    } else if (settings) {
                        // STEP 3: Pre-migration mode OR migration didn't create shop properly
                        // Let's CREATE a shop for this user from their settings
                        console.warn('⚠️ No shop found in shops table. Creating shop from user_settings...');

                        try {
                            const { data: newShop, error: createError } = await supabase
                                .from('shops')
                                .insert([{
                                    shop_name: settings.shop_name || 'My Jewelry Shop',
                                    gst_number: settings.gst_number,
                                    pan_number: settings.pan_number,
                                    address: settings.address,
                                    state: settings.state,
                                    pincode: settings.pincode,
                                    phone_number: settings.phone_number,
                                    email: settings.email,
                                    logo_url: settings.logo_url,
                                    template_id: settings.template_id || 'classic',
                                    cgst_rate: settings.cgst_rate || 1.5,
                                    sgst_rate: settings.sgst_rate || 1.5,
                                    created_by: user.uid,
                                }])
                                .select()
                                .single();

                            if (createError) {
                                console.error('Failed to create shop:', createError);
                                throw createError;
                            }

                            if (newShop) {
                                console.log('✅ Successfully created shop:', newShop.id);

                                // Create user_shop_role entry for this user as owner
                                await supabase
                                    .from('user_shop_roles')
                                    .insert([{
                                        user_id: user.uid,
                                        shop_id: newShop.id,
                                        role: 'owner',
                                        accepted_at: new Date().toISOString(),
                                        invited_by: user.uid,
                                    }]);

                                // Update user_settings to mark as migrated
                                await supabase
                                    .from('user_settings')
                                    .update({ migrated_to_shop_id: newShop.id })
                                    .eq('user_id', user.uid);

                                const shop: Shop = {
                                    id: newShop.id,
                                    shopName: newShop.shop_name,
                                    gstNumber: newShop.gst_number,
                                    panNumber: newShop.pan_number,
                                    address: newShop.address,
                                    state: newShop.state,
                                    pincode: newShop.pincode,
                                    phoneNumber: newShop.phone_number,
                                    email: newShop.email,
                                    logoUrl: newShop.logo_url,
                                    templateId: newShop.template_id,
                                    cgstRate: Number(newShop.cgst_rate) || 1.5,
                                    sgstRate: Number(newShop.sgst_rate) || 1.5,
                                    isActive: newShop.is_active,
                                    createdBy: newShop.created_by,
                                    createdAt: newShop.created_at,
                                    updatedAt: newShop.updated_at,
                                };

                                setActiveShop(shop);
                                setUserShops([shop]);

                                setUserRole({
                                    id: 'auto-created-owner',
                                    userId: user.uid,
                                    shopId: shop.id,
                                    role: 'owner',
                                    isActive: true,
                                    invitedAt: new Date().toISOString(),
                                    acceptedAt: new Date().toISOString(),
                                    createdAt: new Date().toISOString(),
                                    updatedAt: new Date().toISOString(),
                                });
                            }
                        } catch (createError) {
                            console.error('Error creating shop:', createError);
                            // Fallback to temp mode if creation fails
                            setUserShops([]);
                            setActiveShop(null);
                            setUserRole(null);
                        }
                    } else {
                        // New user - no shops yet (this is normal!)
                        console.log('ℹ️ No shops found. User can create their first shop using Shop Switcher.');
                        setUserShops([]);
                        setActiveShop(null);
                    }
                }
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
        throw new Error('useActiveShop must be used within an ActiveShopProvider');
    }
    return context;
}
