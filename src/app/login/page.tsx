'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Mail, Lock, ArrowRight, Building2, Eye, EyeOff, Fingerprint } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Capacitor } from '@capacitor/core';
import { NativeBiometric } from '@capgo/capacitor-native-biometric';
import { SecureStoragePlugin } from 'capacitor-secure-storage-plugin';
import { Preferences } from '@capacitor/preferences';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/supabase/client';
import { MotionWrapper, FadeIn } from '@/components/ui/motion-wrapper';

const authSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  shopName: z.string().optional(),
  enableBiometrics: z.boolean().optional(),
});

type AuthFormValues = z.infer<typeof authSchema>;

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isBiometricAvailable, setIsBiometricAvailable] = useState(false);
  const [hasStoredCredentials, setHasStoredCredentials] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<AuthFormValues>({
    resolver: zodResolver(authSchema),
    defaultValues: {
      email: '',
      password: '',
      shopName: '',
      enableBiometrics: false,
    },
  });

  useEffect(() => {
    checkBiometricAvailability();
  }, []);

  async function checkBiometricAvailability() {
    if (!Capacitor.isNativePlatform()) return;
    try {
      const result = await NativeBiometric.isAvailable();
      if (result.isAvailable) {
        setIsBiometricAvailable(true);
        // Check if we have stored credentials
        const { value: storedEmail } = await SecureStoragePlugin.get({ key: 'user_email' }).catch(() => ({ value: null }));
        const { value: storedPassword } = await SecureStoragePlugin.get({ key: 'user_password' }).catch(() => ({ value: null }));
        if (storedEmail && storedPassword) {
          setHasStoredCredentials(true);
        }
      }
    } catch (e) {
      console.error('Biometric check failed', e);
    }
  }

  async function handleBiometricLogin() {
    try {
      setIsLoading(true);
      await NativeBiometric.verifyIdentity({
        reason: "Log in to your account",
        title: "Biometric Login",
        subtitle: "Log in",
        description: "Use your face or fingerprint to log in"
      });

      // If verified (no error thrown)
      const { value: email } = await SecureStoragePlugin.get({ key: 'user_email' });
      const { value: password } = await SecureStoragePlugin.get({ key: 'user_password' });

      if (email && password) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        toast({ title: 'Welcome back!', description: 'Logged in with biometrics.' });
        router.push('/dashboard');
      } else {
        toast({ variant: 'destructive', title: 'Error', description: 'No credentials found. Please log in with password first.' });
      }
    } catch (error: any) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Biometric Login Failed', description: 'Please use your password.' });
    } finally {
      setIsLoading(false);
    }
  }

  async function onSubmit(data: AuthFormValues) {
    setIsLoading(true);
    try {
      if (isSignUp) {
        // Enforce shop name when signing up
        if (!data.shopName || data.shopName.trim().length < 2) {
          toast({
            variant: 'destructive',
            title: 'Shop name required',
            description: 'Please enter your Shop Name to continue.',
          });
          setIsLoading(false);
          return;
        }
        const { error } = await supabase.auth.signUp({
          email: data.email,
          password: data.password,
        });
        if (error) throw error;

        // Try to save initial shop name in user_settings. This may fail if email confirmation is required.
        try {
          const currentUser = (await supabase.auth.getUser()).data.user;
          if (currentUser?.id) {
            await supabase
              .from('user_settings')
              .upsert({
                user_id: currentUser.id,
                shop_name: data.shopName.trim(),
              }, { onConflict: 'user_id' });
          } else {
            // Fallback: store to localStorage to be picked up on first login
            if (typeof window !== 'undefined') {
              localStorage.setItem('pendingShopName', data.shopName.trim());
            }
          }
        } catch (_) {
          // Swallow; not critical at signup time
          if (typeof window !== 'undefined') {
            try { localStorage.setItem('pendingShopName', data.shopName.trim()); } catch { }
          }
        }
        toast({
          title: 'Account created!',
          description: 'Please check your email to verify your account.',
        });
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: data.email,
          password: data.password,
        });
        if (error) throw error;

        // Save credentials if biometric enabled
        if (isBiometricAvailable && data.enableBiometrics) {
          try {
            await SecureStoragePlugin.set({ key: 'user_email', value: data.email });
            await SecureStoragePlugin.set({ key: 'user_password', value: data.password });
            toast({ title: 'Biometrics Enabled', description: 'You can now log in with biometrics.' });
          } catch (e) {
            console.error('Failed to save credentials', e);
          }
        }

        toast({
          title: 'Welcome back!',
          description: 'Successfully logged in.',
        });
        router.push('/dashboard');
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Authentication Error',
        description: error.message || 'Something went wrong. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen w-full flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex w-1/2 bg-primary relative overflow-hidden items-center justify-center text-primary-foreground">
        <div className="absolute inset-0 bg-[url('/patterns/grid.svg')] opacity-10"></div>
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-gold-500/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-gold-500/10 rounded-full blur-3xl"></div>

        <div className="relative z-10 p-12 max-w-lg">
          <FadeIn>
            <div className="mb-8">
              {/* Logo Placeholder */}
              <div className="h-16 w-16 bg-gold-500 rounded-xl flex items-center justify-center mb-6 shadow-lg shadow-gold-500/20">
                <span className="text-3xl font-heading font-bold text-primary">SJ</span>
              </div>
              <h1 className="text-5xl font-heading font-bold mb-6 leading-tight">
                Manage Your Jewellery Business with <span className="text-gold-400">Elegance</span>
              </h1>
              <p className="text-lg text-primary-foreground/80 leading-relaxed">
                Create professional invoices, track stock, and manage customers with a platform designed for modern jewellers.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-6 mt-12">
              <div className="p-4 rounded-lg bg-white/5 backdrop-blur-sm border border-white/10">
                <h3 className="font-bold text-gold-400 mb-1">Smart Invoicing</h3>
                <p className="text-sm opacity-80">Generate GST-compliant invoices in seconds.</p>
              </div>
              <div className="p-4 rounded-lg bg-white/5 backdrop-blur-sm border border-white/10">
                <h3 className="font-bold text-gold-400 mb-1">Stock Management</h3>
                <p className="text-sm opacity-80">Track gold rates and inventory effortlessly.</p>
              </div>
            </div>
          </FadeIn>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <MotionWrapper className="w-full max-w-md space-y-8">
          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-heading font-bold tracking-tight">
              {isSignUp ? 'Create an account' : 'Welcome back'}
            </h2>
            <p className="text-muted-foreground mt-2">
              {isSignUp ? 'Enter your details to get started.' : 'Enter your credentials to access your account.'}
            </p>
          </div>

          {hasStoredCredentials && !isSignUp && (
            <Button
              variant="outline"
              className="w-full h-12 mb-4 border-gold-500/50 text-gold-600 hover:bg-gold-500/10"
              onClick={handleBiometricLogin}
              disabled={isLoading}
            >
              <Fingerprint className="mr-2 h-5 w-5" />
              Login with Biometrics
            </Button>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="shopName"
                render={({ field }) => (
                  isSignUp ? (
                    <FormItem>
                      <FormLabel>Shop Name</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Building2 className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                          <Input placeholder="e.g. Shree Jewellers" className="pl-10 h-11" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  ) : <></>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                        <Input placeholder="name@example.com" className="pl-10 h-11" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                        <Input type={showPassword ? 'text' : 'password'} placeholder="••••••••" className="pl-10 pr-10 h-11" {...field} />
                        <button
                          type="button"
                          onClick={() => setShowPassword(p => !p)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {isBiometricAvailable && !isSignUp && (
                <FormField
                  control={form.control}
                  name="enableBiometrics"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          Enable Biometric Login
                        </FormLabel>
                        <CardDescription>
                          Save credentials securely for next time.
                        </CardDescription>
                      </div>
                    </FormItem>
                  )}
                />
              )}

              <Button type="submit" className="w-full h-11 text-base shadow-lg" disabled={isLoading} variant="premium">
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSignUp ? 'Sign Up' : 'Sign In'}
                {!isLoading && <ArrowRight className="ml-2 h-4 w-4" />}
              </Button>
            </form>
          </Form>

          <div className="text-center text-sm">
            <span className="text-muted-foreground">
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}
            </span>{' '}
            <Button
              variant="link"
              className="p-0 h-auto font-semibold text-primary hover:text-primary/80"
              onClick={() => setIsSignUp(!isSignUp)}
            >
              {isSignUp ? 'Sign in' : 'Sign up'}
            </Button>
          </div>
        </MotionWrapper>
      </div>
    </div>
  );
}
