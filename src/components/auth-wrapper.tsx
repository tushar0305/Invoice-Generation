'use client';

import { useUser } from '@/supabase/provider';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/supabase/client';

export function AuthWrapper({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const [onboardingChecked, setOnboardingChecked] = useState(false);
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [roleChecked, setRoleChecked] = useState(false);
  const [hasAnyRole, setHasAnyRole] = useState(false);

  // Check onboarding status and role when user loads
  useEffect(() => {
    const checkOnboardingAndRole = async () => {
      if (!user) {
        setOnboardingChecked(true);
        setRoleChecked(true);
        return;
      }

      try {
        // Check onboarding status
        const { data: prefs, error: prefsError } = await supabase
          .from('user_preferences')
          .select('onboarding_completed')
          .eq('user_id', user.uid)
          .maybeSingle();

        if (prefsError) {
          console.error('Error checking onboarding:', prefsError);
          setOnboardingComplete(false);
        } else {
          setOnboardingComplete(prefs?.onboarding_completed ?? false);
        }

        // Check if user has ANY role in any shop
        const { data: roles, error: rolesError } = await supabase
          .from('user_shop_roles')
          .select('role')
          .eq('user_id', user.uid)
          .eq('is_active', true);

        if (!rolesError && roles && roles.length > 0) {
          setHasAnyRole(true);
          const hasOwnerRole = roles.some((r: any) => r.role === 'owner');
          setIsOwner(hasOwnerRole);
        } else {
          setHasAnyRole(false);
          setIsOwner(false);
        }
      } catch (err) {
        console.error('Auth check failed:', err);
        setOnboardingComplete(false);
      } finally {
        setOnboardingChecked(true);
        setRoleChecked(true);
      }
    };

    if (!isUserLoading) {
      checkOnboardingAndRole();
    }
  }, [user, isUserLoading]);

  useEffect(() => {
    // Wait for user, onboarding status, AND role to be checked
    if (isUserLoading || !onboardingChecked || !roleChecked) return;

    // If not logged in and not on public pages, redirect to login
    if (!user && pathname !== '/login' && pathname !== '/' && !pathname.startsWith('/store')) {
      router.replace('/login');
      return;
    }

    // If logged in but onboarding not complete
    // SKIP shop setup if user already has a role (e.g. invited staff)
    // Also skip if we're already on a shop page or admin (prevents flash)
    if (user && !onboardingComplete && !hasAnyRole && !pathname.startsWith('/onboarding') && !pathname.startsWith('/shop') && !pathname.startsWith('/admin')) {
      router.replace('/onboarding/shop-setup');
      return;
    }

    // If logged in, onboarding complete (OR has role), and on login/landing page
    if (user && (onboardingComplete || hasAnyRole) && (pathname === '/login' || pathname === '/')) {
      // Fetch last active shop or first available shop
      const getLastActiveShop = async () => {
        let targetShopId = null;

        // Try to get from preferences first
        const { data: prefs } = await supabase
          .from('user_preferences')
          .select('last_active_shop_id')
          .eq('user_id', user.uid)
          .maybeSingle();

        if (prefs?.last_active_shop_id) {
          targetShopId = prefs.last_active_shop_id;
        } else {
          // Fallback to first shop role
          const { data: roles } = await supabase
            .from('user_shop_roles')
            .select('shop_id')
            .eq('user_id', user.uid)
            .eq('is_active', true)
            .limit(1)
            .maybeSingle();

          if (roles?.shop_id) {
            targetShopId = roles.shop_id;
          }
        }

        if (targetShopId) {
          // Check role for this shop to determine landing page
          const { data: roleData } = await supabase
            .from('user_shop_roles')
            .select('role')
            .eq('user_id', user.uid)
            .eq('shop_id', targetShopId)
            .maybeSingle();

          const role = roleData?.role;

          if (role === 'owner') {
            router.replace('/admin');
          } else {
            router.replace(`/shop/${targetShopId}/dashboard`);
          }
        } else {
          // Fallback if no shop found (shouldn't happen if hasAnyRole is true, but safe fallback)
          router.replace('/onboarding/shop-setup');
        }
      };

      getLastActiveShop();
      return;
    }
  }, [user, isUserLoading, onboardingChecked, onboardingComplete, roleChecked, isOwner, hasAnyRole, router, pathname]);

  // Show loading screen during initial checks to prevent flash
  if (isUserLoading || !onboardingChecked || !roleChecked) {
    // Only show loader if we're navigating (not on public pages)
    if (pathname !== '/login' && pathname !== '/' && !pathname.startsWith('/store')) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }
  }

  // Render children immediately for public pages or after checks complete
  return <>{children}</>;
}
