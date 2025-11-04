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

const settingsFormSchema = z.object({
  cgstRate: z.coerce.number().min(0, 'CGST rate must be positive'),
  sgstRate: z.coerce.number().min(0, 'SGST rate must be positive'),
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
    },
  });

  useEffect(() => {
    if (settings) {
      form.reset({
        cgstRate: settings.cgstRate,
        sgstRate: settings.sgstRate,
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
            updatedAt: serverTimestamp()
        };

        if(!settings) {
            (settingsPayload as any).createdAt = serverTimestamp();
        }

        await setDoc(userSettingsRef, settingsPayload, { merge: true });
        
        toast({
          title: 'Settings saved successfully!',
        });
        
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
            <CardTitle>Tax Settings</CardTitle>
            <CardDescription>Define your default CGST and SGST tax rates. These will be automatically applied to new invoices.</CardDescription>
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
                    <FormField control={form.control} name="cgstRate" render={({ field }) => (
                    <FormItem>
                        <FormLabel>CGST Rate (%)</FormLabel>
                        <FormControl><Input type="number" step="0.01" placeholder="e.g., 1.5" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                    )} />
                    <FormField control={form.control} name="sgstRate" render={({ field }) => (
                    <FormItem>
                        <FormLabel>SGST Rate (%)</FormLabel>
                        <FormControl><Input type="number" step="0.01" placeholder="e.g., 1.5" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                    )} />
                    
                    <Button type="submit" disabled={isPending}>
                        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Settings
                    </Button>
                </form>
                </Form>
            )}
        </CardContent>
    </Card>
  );
}
