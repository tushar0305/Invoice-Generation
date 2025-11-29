/**
 * Shop Layout - Server Component
 * Fetches shop data on the server for optimal performance
 */

import { redirect } from 'next/navigation';
import { createClient } from '@/supabase/server';
import { getActiveShopData } from '@/lib/get-active-shop';
import { ShopLayoutClient } from '@/components/shop-layout-client';
import { ActiveShopProvider } from '@/hooks/use-active-shop';

export default async function ShopLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ shopId: string }>;
}) {
  const { shopId } = await params;
  const supabase = await createClient();

  // Get authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Redirect to login if not authenticated
  if (!user) {
    redirect('/login');
  }

  // ✅ OPTIMIZED: Fetch shop data with parallel queries (server-side)
  const shopData = await getActiveShopData(user.id, shopId);

  // Verify user has access to this shop
  if (!shopData.activeShop || shopData.activeShop.id !== shopId) {
    // User doesn't have access to this shop
    if (shopData.userShops.length > 0) {
      // Redirect to first available shop
      redirect(`/shop/${shopData.userShops[0].id}/dashboard`);
    } else {
      // No shops available, redirect to shop setup
      redirect('/onboarding/shop-setup');
    }
  }

  return (
    <ActiveShopProvider
      initialData={{
        activeShop: shopData.activeShop,
        userShops: shopData.userShops,
        userRole: shopData.userRole,
      }}
    >
      <ShopLayoutClient
        shopData={{
          activeShop: shopData.activeShop,
          userShops: shopData.userShops,
          userRole: shopData.userRole,
        }}
        userEmail={user.email || null}
        userId={user.id}
        shopId={shopId}
      >
        {children}
      </ShopLayoutClient>
    </ActiveShopProvider>
  );
}
