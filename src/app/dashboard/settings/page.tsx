'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Loader2, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useTransition, useEffect } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useUser, useDoc, useMemoFirebase } from '@/firebase';
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import type { UserSettings } from '@/lib/definitions';
import { Skeleton } from '@/components/ui/skeleton';
import { getAuth, signOut } from 'firebase/auth';

const settingsFormSchema = z.object({
  cgstRate: z.coerce.number().min(0, 'CGST rate must be positive'),
  sgstRate: z.coerce.number().min(0, 'SGST rate must be positive'),
  shopName: z.string().trim().min(1, 'Shop name is required').optional(),
  gstNumber: z.string().trim().optional(),
  panNumber: z.string().trim().optional(),
  address: z.string().trim().optional(),
  phoneNumber: z.string().trim().optional(),
  // email is not part of the form schema anymore
});

type SettingsFormValues = z.infer<typeof settingsFormSchema>;

export default function SettingsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const { user, isUserLoading } = useUser();
  const firestore = getFirestore();

  const settingsRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(firestore, 'userSettings', user.uid);
  }, [firestore, user]);

  const { data: settings, isLoading: settingsLoading } = useDoc<UserSettings>(settingsRef);
  
  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsFormSchema),
    defaultValues: {
  cgstRate: 1.5,
  sgstRate: 1.5,
  shopName: 'Jewellers Store',
  gstNumber: '',
  panNumber: '',
  address: '',
  phoneNumber: '',
    },
  });

  useEffect(() => {
    if (settings) {
      form.reset({
        cgstRate: settings.cgstRate,
        sgstRate: settings.sgstRate,
        shopName: settings.shopName || 'Jewellers Store',
        gstNumber: settings.gstNumber || '',
        panNumber: settings.panNumber || '',
        address: settings.address || '',
        phoneNumber: settings.phoneNumber || '',
      });
    }
  }, [settings, form]);

  async function onSubmit(data: SettingsFormValues) {
    if (!user) {
        toast({ variant: 'destructive', title: 'Authentication Error', description: 'You must be logged in.'});
        return;
    }

    startTransition(async () => {
      try {
    const userSettingsRef = doc(firestore, 'userSettings', user.uid);
    const settingsPayload = {
      ...data,
      id: user.uid,
      userId: user.uid,
      updatedAt: serverTimestamp(),
      shopName: data.shopName || 'Jewellers Store',
      gstNumber: data.gstNumber || '',
      panNumber: data.panNumber || '',
      address: data.address || '',
      phoneNumber: data.phoneNumber || '',
      email: user.email || '', // always use the current user's email
    };
    if (!settings) {
      (settingsPayload as any).createdAt = serverTimestamp();
    }
    await setDoc(userSettingsRef, settingsPayload, { merge: true });
    toast({ title: 'Settings saved successfully!' });
  } catch (error) {
    console.error("Failed to save settings:", error);
    toast({
      variant: 'destructive',
      title: 'An error occurred',
      description: 'Failed to save settings. Please try again.',
    });
  }
  });
  }
  
  const isLoading = isUserLoading || settingsLoading;

  return (
     <Card className="max-w-2xl mx-auto">
        <CardHeader>
      <CardTitle>Profile & Tax Settings</CardTitle>
      <CardDescription>Your shop details appear on invoices. Tax rates auto-fill new invoices.</CardDescription>
        </CardHeader>
        <CardContent>
            {isLoading ? (
                <div className="space-y-8">
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                     <div className="space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                    <Skeleton className="h-10 w-28" />
                </div>
            ) : (
                <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                    <div className="grid grid-cols-1 gap-6">
                      <FormField control={form.control} name="shopName" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Shop Name</FormLabel>
                          <FormControl><Input placeholder="e.g., Jewellers Store" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="address" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Address</FormLabel>
                          <FormControl><Input placeholder="Full address" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <FormField control={form.control} name="phoneNumber" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone</FormLabel>
                            <FormControl><Input placeholder="e.g., 9876543210" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <div>
                          <FormLabel>Email</FormLabel>
                          <Input
                            placeholder="you@example.com"
                            value={user?.email || ''}
                            disabled
                            readOnly
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <FormField control={form.control} name="gstNumber" render={({ field }) => (
                          <FormItem>
                            <FormLabel>GST Number</FormLabel>
                            <FormControl><Input placeholder="e.g., 08AAAAA0000A1Z5" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="panNumber" render={({ field }) => (
                          <FormItem>
                            <FormLabel>PAN Number</FormLabel>
                            <FormControl><Input placeholder="e.g., AAAAA0000A" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <FormField control={form.control} name="cgstRate" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Default CGST Rate (%)</FormLabel>
                            <FormControl><Input type="number" step="0.01" placeholder="e.g., 1.5" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="sgstRate" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Default SGST Rate (%)</FormLabel>
                            <FormControl><Input type="number" step="0.01" placeholder="e.g., 1.5" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                      </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-3 mt-2">
                      <Button type="submit" disabled={isPending} className="flex-1">
                          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Save Settings
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        className="sm:w-40"
                        onClick={async () => {
                          try {
                            const auth = getAuth();
                            await signOut(auth);
                            toast({ title: 'Signed Out', description: 'You have been signed out.' });
                          } catch (e) {
                            console.error(e);
                            toast({ variant: 'destructive', title: 'Sign out failed', description: 'Please try again.' });
                          }
                        }}
                      >
                        Sign Out
                      </Button>
                    </div>
                </form>
                </Form>
            )}
        </CardContent>
    </Card>
  );
}
