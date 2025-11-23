'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Mail, Lock, ArrowRight, Building2, Eye, EyeOff } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/supabase/client';
import { MotionWrapper, FadeIn } from '@/components/ui/motion-wrapper';

const authSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  shopName: z.string().optional(),
});

type AuthFormValues = z.infer<typeof authSchema>;

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<AuthFormValues>({
    resolver: zodResolver(authSchema),
    defaultValues: {
      email: '',
      password: '',
      shopName: '',
    },
  });

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

        // Create the shop immediately using the RPC
        try {
          const { data: sessionData } = await supabase.auth.getSession();

          if (sessionData.session) {
            const { error: createShopError } = await supabase.rpc('create_new_shop', {
              p_shop_name: data.shopName.trim()
            });

            if (createShopError) {
              console.error('Failed to create shop:', createShopError);
              // Don't block signup success, but log it. 
              // The user can create a shop later from dashboard.
            } else {
              console.log('✅ Shop created successfully during signup');
            }
          } else {
            // If no session (e.g. email verification required), we can't call RPC yet.
            // Store in localStorage for potential post-verification handling (optional)
            if (typeof window !== 'undefined') {
              localStorage.setItem('pendingShopName', data.shopName.trim());
            }
          }
        } catch (err) {
          console.error('Error creating shop:', err);
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
    <div className="min-h-screen w-full flex bg-background">
      {/* Left Side - Branding (Desktop) */}
      <div className="hidden lg:flex w-1/2 bg-primary relative overflow-hidden items-center justify-center text-primary-foreground">
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)', backgroundSize: '20px 20px' }}></div>
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-gold-500/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-gold-500/10 rounded-full blur-3xl"></div>

        <div className="relative z-10 p-12 max-w-lg">
          <FadeIn>
            <div className="mb-8">
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
          </FadeIn>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-8 relative">
        {/* Mobile Background Accents */}
        <div className="lg:hidden absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-primary/10 to-transparent -z-10" />

        <MotionWrapper className="w-full max-w-md space-y-8 bg-card/50 backdrop-blur-sm p-6 rounded-2xl border border-border/50 shadow-xl lg:shadow-none lg:bg-transparent lg:border-none lg:p-0">

          {/* Mobile Branding */}
          <div className="lg:hidden text-center mb-6">
            <div className="h-12 w-12 bg-gold-500 rounded-lg flex items-center justify-center mx-auto mb-4 shadow-lg shadow-gold-500/20">
              <span className="text-2xl font-heading font-bold text-primary">SJ</span>
            </div>
            <h1 className="text-2xl font-heading font-bold text-primary">Welcome Back</h1>
            <p className="text-sm text-muted-foreground">Sign in to your account</p>
          </div>

          <div className="text-center lg:text-left hidden lg:block">
            <h2 className="text-3xl font-heading font-bold tracking-tight">
              {isSignUp ? 'Create an account' : 'Welcome back'}
            </h2>
            <p className="text-muted-foreground mt-2">
              {isSignUp ? 'Enter your details to get started.' : 'Enter your credentials to access your account.'}
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
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
                          <Input placeholder="e.g. Shree Jewellers" className="pl-10 h-11 bg-background/50" {...field} />
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
                        <Input placeholder="name@example.com" className="pl-10 h-11 bg-background/50" {...field} />
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
                        <Input type={showPassword ? 'text' : 'password'} placeholder="••••••••" className="pl-10 pr-10 h-11 bg-background/50" {...field} />
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

              <Button type="submit" className="w-full h-11 text-base shadow-lg font-semibold" disabled={isLoading} variant="premium">
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSignUp ? 'Sign Up' : 'Sign In'}
                {!isLoading && <ArrowRight className="ml-2 h-4 w-4" />}
              </Button>
            </form>
          </Form>

          <div className="text-center text-sm pt-2">
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
