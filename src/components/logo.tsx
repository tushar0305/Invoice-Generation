import { useUser, useDoc, useMemoFirebase } from '@/firebase';
import { doc, getFirestore } from 'firebase/firestore';
import type { UserSettings } from '@/lib/definitions';

type LogoProps = {
  generic?: boolean; // when true shows generic brand regardless of user settings
};

export function Logo({ generic }: LogoProps) {
  const { user } = useUser();
  const firestore = getFirestore();

  const settingsRef = useMemoFirebase(() => {
    if (!user || generic) return null;
    return doc(firestore, 'userSettings', user.uid);
  }, [firestore, user, generic]);

  const { data: settings } = useDoc<UserSettings>(settingsRef);

  const brand = generic
    ? 'Invoice Maker'
    : (settings?.shopName || 'Jewellers Store');

  return (
    <div className="flex items-center">
      <span className="font-headline text-xl font-bold text-primary truncate max-w-[180px]" title={brand}>
        {brand}
      </span>
    </div>
  );
}
