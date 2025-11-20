import { AlertCircle, CheckCircle2, ArrowRight, Info } from 'lucide-react';
import Link from 'next/link';
import { Button } from './ui/button';
import type { UserSettings } from '@/lib/definitions';

interface ShopSetupBannerProps {
  settings: UserSettings | null;
  isLoading?: boolean;
  variant?: 'warning' | 'info'; // 'warning' for incomplete, 'info' for welcome
}

export function ShopSetupBanner({ settings, isLoading, variant = 'warning' }: ShopSetupBannerProps) {
  // Check if basic info (shop name and address) is set
  const hasShopNameOnly = !!(settings && settings.shopName && settings.shopName !== 'Jewellers Store');
  const hasAddress = !!(settings?.address && settings.address.trim() !== '');
  const hasBasicInfo = hasShopNameOnly && hasAddress;

  // Check if complete info is set (just requires basic info for now)
  const isSetupComplete = hasBasicInfo;

  if (isLoading) {
    return null;
  }

  // If no settings exist, show welcome banner
  if (!settings) {
    return (
      <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-lg flex flex-col sm:flex-row items-start gap-3 w-full overflow-hidden">
        <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="font-semibold text-blue-900 text-sm sm:text-base">Welcome to Invoice Generator!</h3>
          <p className="text-xs sm:text-sm text-blue-700 mb-3 mt-1">
            Let's get your shop details set up so you can start creating professional invoices.
          </p>
          <Link href="/dashboard/settings" className="block">
            <Button 
              size="sm" 
              className="bg-blue-600 hover:bg-blue-700 text-xs sm:text-sm w-full sm:w-auto self-start shrink-0"
            >
              Set Up Shop Now <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // If setup is complete, don't show any banner
  if (isSetupComplete) {
    return null;
  }

  // If basic info is missing, show warning banner
  if (!hasBasicInfo) {
    // Different wording if shop name captured but address missing
    const title = hasShopNameOnly ? 'Add Your Address' : 'Complete Your Shop Setup';
    const desc = hasShopNameOnly
      ? 'Please add your shop address and contact details. These appear on all invoices.'
      : 'Please add your shop name and address. These details will appear on all invoices.';
    return (
      <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-amber-50 border border-amber-200 rounded-lg flex flex-col sm:flex-row items-start gap-3 w-full overflow-hidden">
        <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="font-semibold text-amber-900 text-sm sm:text-base">{title}</h3>
          <p className="text-xs sm:text-sm text-amber-700 mb-3 mt-1">{desc}</p>
          <Link href="/dashboard/settings" className="block">
            <Button 
              size="sm" 
              className="bg-amber-600 hover:bg-amber-700 text-xs sm:text-sm w-full sm:w-auto self-start shrink-0"
            >
              {hasShopNameOnly ? 'Add Address' : 'Add Shop Details'} <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // No additional banners shown if basic info exists (already covered by success banner above)
  return null;
}
