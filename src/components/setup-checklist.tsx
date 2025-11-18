'use client';

import { CheckCircle2, Circle } from 'lucide-react';
import Link from 'next/link';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import type { UserSettings } from '@/lib/definitions';
import { getSetupProgress } from '@/lib/shop-setup';

interface SetupChecklistProps {
  settings: UserSettings | null;
  isLoading?: boolean;
}

export function SetupChecklist({ settings, isLoading }: SetupChecklistProps) {
  const progress = getSetupProgress(settings);

  if (isLoading) {
    return null;
  }

  if (progress.isComplete) {
    return null;
  }

  const checklistItems = [
    {
      title: 'Shop Name',
      description: 'Give your shop a custom name',
      completed: !!(settings?.shopName && settings.shopName !== 'Jewellers Store'),
    },
    {
      title: 'GST Number',
      description: 'Add your GST registration number',
      completed: !!settings?.gstNumber?.trim(),
    },
    {
      title: 'PAN Number',
      description: 'Add your PAN number',
      completed: !!settings?.panNumber?.trim(),
    },
    {
      title: 'Address',
      description: 'Enter your shop address',
      completed: !!settings?.address?.trim(),
    },
    {
      title: 'State',
      description: 'Specify your state',
      completed: !!settings?.state?.trim(),
    },
    {
      title: 'Pincode',
      description: 'Add your postal code',
      completed: !!settings?.pincode?.trim(),
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Setup Progress</span>
          <span className="text-sm font-normal text-muted-foreground">{progress.completionPercentage}%</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {checklistItems.map((item) => (
            <div key={item.title} className="flex items-start gap-3">
              {item.completed ? (
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              ) : (
                <Circle className="w-5 h-5 text-gray-300 flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <p className={cn(
                  'font-medium text-sm',
                  item.completed ? 'text-gray-600' : 'text-gray-900'
                )}>
                  {item.title}
                </p>
                <p className="text-xs text-gray-500">{item.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="pt-4 border-t">
          <Link href="/dashboard/settings">
            <Button className="w-full" variant="default">
              Complete Setup
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

function cn(...classes: (string | undefined | false | null)[]) {
  return classes.filter(Boolean).join(' ');
}
