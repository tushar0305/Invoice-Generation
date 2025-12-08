/**
 * Active Shop Context - Client-side state management with React Query caching
 * Optimized version that receives initial data from server
 */

'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { Shop, UserShopRole, Permission } from '@/lib/definitions';

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

// Create a query client with optimal cache settings
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes
            gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
            refetchOnWindowFocus: false,
            retry: 1,
        },
    },
});

type ActiveShopProviderProps = {
    children: ReactNode;
    initialData: {
        activeShop: Shop | null;
        userShops: Shop[];
        userRole: UserShopRole | null;
    };
};

function ActiveShopProviderInner({ children, initialData }: ActiveShopProviderProps) {
    const router = useRouter();
    const [activeShop, setActiveShop] = useState<Shop | null>(initialData.activeShop);
    const [userShops, setUserShops] = useState<Shop[]>(initialData.userShops);
    const [userRole, setUserRole] = useState<UserShopRole | null>(initialData.userRole);
    const [isLoading, setIsLoading] = useState(false);

    // Update state when initial data changes (server-side navigation)
    useEffect(() => {
        setActiveShop(initialData.activeShop);
        setUserShops(initialData.userShops);
        setUserRole(initialData.userRole);
    }, [initialData]);

    // Calculate permissions based on role
    const permissions: Permission = {
        canCreateInvoices: !!userRole,
        canEditAllInvoices: userRole?.role === 'owner' || userRole?.role === 'manager',
        canDeleteInvoices: userRole?.role === 'owner' || userRole?.role === 'manager',
        canExportInvoices: userRole?.role === 'owner' || userRole?.role === 'manager',
        canManageStock: userRole?.role === 'owner' || userRole?.role === 'manager',
        canViewStock: !!userRole,
        canEditSettings: userRole?.role === 'owner',
        canInviteStaff: userRole?.role === 'owner',
        canViewAnalytics: !!userRole,
        canCreateShop: userRole?.role === 'owner',
    };

    // Switch to a different shop
    const switchShop = async (shopId: string) => {
        if (!shopId || shopId === activeShop?.id) return;

        setIsLoading(true);

        try {
            // Update preference in database
            const { supabase } = await import('@/supabase/client');
            const { data: { user } } = await supabase.auth.getUser();

            if (user) {
                await supabase
                    .from('user_preferences')
                    .upsert(
                        {
                            user_id: user.id,
                            last_active_shop_id: shopId,
                            updated_at: new Date().toISOString(),
                        },
                        {
                            onConflict: 'user_id',
                        }
                    );
            }

            // Navigate to new shop (will trigger server-side data fetch)
            router.push(`/shop/${shopId}/dashboard`);
        } catch (error) {
            if (process.env.NODE_ENV === 'development') {
                console.error('Error switching shop:', error);
            }
        } finally {
            setIsLoading(false);
        }
    };

    // Refresh shops data (force server refetch)
    const refreshShops = async () => {
        setIsLoading(true);
        try {
            // Force a hard refresh by navigating to current page
            router.refresh();
        } catch (error) {
            if (process.env.NODE_ENV === 'development') {
                console.error('Error refreshing shops:', error);
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <ActiveShopContext.Provider
            value={{
                activeShop,
                userShops,
                userRole,
                permissions,
                isLoading,
                switchShop,
                refreshShops,
            }}
        >
            {children}
        </ActiveShopContext.Provider>
    );
}

// Wrap with QueryClientProvider
export function ActiveShopProvider(props: ActiveShopProviderProps) {
    return (
        <QueryClientProvider client={queryClient}>
            <ActiveShopProviderInner {...props} />
        </QueryClientProvider>
    );
}

// Hook to use the active shop context
export function useActiveShop() {
    const context = useContext(ActiveShopContext);
    if (context === undefined) {
        throw new Error('useActiveShop must be used within ActiveShopProvider');
    }
    return context;
}
