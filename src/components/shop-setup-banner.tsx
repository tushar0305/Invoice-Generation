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
  const hasBasicInfo = settings && 
    settings.shopName && 
    settings.shopName !== 'Jewellers Store' &&
    settings.address && 
    settings.address.trim() !== '';

  // Check if complete info is set (just requires basic info for now)
  const isSetupComplete = hasBasicInfo;

  if (isLoading) {
    return null;
  }

  // If no settings exist, show welcome banner
  if (!settings) {
    return (
      <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-lg flex flex-col sm:flex-row items-start gap-3">
        <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="font-semibold text-blue-900 text-sm sm:text-base">Welcome to Invoice Generator!</h3>
          <p className="text-xs sm:text-sm text-blue-700 mb-3 mt-1">
            Let's get your shop details set up so you can start creating professional invoices.
          </p>
          <Link href="/dashboard/settings">
            <Button 
              size="sm" 
              className="bg-blue-600 hover:bg-blue-700 text-xs sm:text-sm w-full sm:w-auto"
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
    return (
      <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-amber-50 border border-amber-200 rounded-lg flex flex-col sm:flex-row items-start gap-3">
        <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="font-semibold text-amber-900 text-sm sm:text-base">Complete Your Shop Setup</h3>
          <p className="text-xs sm:text-sm text-amber-700 mb-3 mt-1">
            Please add your shop name and address. These details will appear on all your invoices.
          </p>
          <Link href="/dashboard/settings">
            <Button 
              size="sm" 
              className="bg-amber-600 hover:bg-amber-700 text-xs sm:text-sm w-full sm:w-auto"
            >
              Add Shop Details <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // No additional banners shown if basic info exists (already covered by success banner above)
  return null;
}
