import type { UserSettings } from '@/lib/definitions';

export interface SetupProgress {
  isComplete: boolean;
  completionPercentage: number;
  missingFields: string[];
}

/**
 * Check if shop setup is complete
 */
export function isShopSetupComplete(settings: UserSettings | null): boolean {
  if (!settings) return false;
  
  return !!(
    settings.shopName && 
    settings.shopName !== 'Jewellers Store' &&
    settings.gstNumber && 
    settings.gstNumber.trim() !== '' &&
    settings.panNumber && 
    settings.panNumber.trim() !== '' &&
    settings.address && 
    settings.address.trim() !== '' &&
    settings.state && 
    settings.state.trim() !== '' &&
    settings.pincode && 
    settings.pincode.trim() !== ''
  );
}

/**
 * Get setup progress for the user
 */
export function getSetupProgress(settings: UserSettings | null): SetupProgress {
  if (!settings) {
    return {
      isComplete: false,
      completionPercentage: 0,
      missingFields: [
        'Shop Name',
        'GST Number',
        'PAN Number',
        'Address',
        'State',
        'Pincode',
      ],
    };
  }

  const requiredFields = [
    { name: 'Shop Name', value: settings.shopName && settings.shopName !== 'Jewellers Store' },
    { name: 'GST Number', value: !!settings.gstNumber?.trim() },
    { name: 'PAN Number', value: !!settings.panNumber?.trim() },
    { name: 'Address', value: !!settings.address?.trim() },
    { name: 'State', value: !!settings.state?.trim() },
    { name: 'Pincode', value: !!settings.pincode?.trim() },
  ];

  const completedFields = requiredFields.filter(field => field.value).length;
  const totalFields = requiredFields.length;

  return {
    isComplete: completedFields === totalFields,
    completionPercentage: Math.round((completedFields / totalFields) * 100),
    missingFields: requiredFields
      .filter(field => !field.value)
      .map(field => field.name),
  };
}
