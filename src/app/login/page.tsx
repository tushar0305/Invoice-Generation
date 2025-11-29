'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Mail, Lock, ArrowRight, Building2, Eye, EyeOff, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/supabase/client';
import { MotionWrapper } from '@/components/ui/motion-wrapper';

const authSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
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
    },
  });

  async function onSubmit(data: AuthFormValues) {
    setIsLoading(true);
    try {
      if (isSignUp) {
        // Simplified signup - only email + password
        const { error } = await supabase.auth.signUp({
          email: data.email,
          password: data.password,
        });
        if (error) throw error;

        toast({
          title: 'Account created!',
          description: 'Redirecting to shop setup...',
        });

        // Redirect to onboarding wizard
        router.push('/onboarding/shop-setup');
      } else {
        const { data: authData, error } = await supabase.auth.signInWithPassword({
          email: data.email,
          password: data.password,
        });

        if (error) {
          throw error;
        }

        toast({
          title: 'Welcome back!',
          description: 'Redirecting...',
        });

        // We do NOT redirect here manually anymore.
        // The AuthWrapper component detects the user login state change
        // and handles the redirect to the correct shop/admin page.
        // This prevents race conditions.
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
    <div className="min-h-screen w-full flex bg-white font-sans text-slate-900">
      {/* Left Side - Branding (Desktop) */}
      <div className="hidden lg:flex w-1/2 relative overflow-hidden items-center justify-center bg-slate-50">
        {/* Decorative Elements */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-gold-100/40 via-transparent to-transparent" />
        <div className="absolute top-0 left-0 w-full h-full bg-[url('/grid.svg')] opacity-[0.02]" />

        {/* Animated Orbs */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 8, repeat: Infinity }}
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-gold-200/30 rounded-full blur-[100px]"
        />
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{ duration: 10, repeat: Infinity, delay: 1 }}
          className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-purple-200/20 rounded-full blur-[120px]"
        />

        <div className="relative z-10 p-12 max-w-xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-8"
          >
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center shadow-xl shadow-gold-500/20 ring-4 ring-white">
              <span className="text-white font-bold text-3xl font-heading">S</span>
            </div>

            <div className="space-y-4">
              <h1 className="text-5xl md:text-6xl font-bold font-heading leading-tight text-slate-900">
                Manage Your <br />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-gold-500 via-gold-600 to-amber-700">
                  Jewellery Empire
                </span>
              </h1>
              <p className="text-lg text-slate-600 leading-relaxed max-w-md">
                Join thousands of jewellers who trust SwarnaVyapar for elegant invoicing, smart inventory, and seamless customer management.
              </p>
            </div>

            <div className="flex items-center gap-4 text-sm font-medium text-slate-500">
              <div className="flex -space-x-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-400">
                    User
                  </div>
                ))}
              </div>
              <p>Trusted by 500+ Showrooms</p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-8 relative bg-white lg:bg-transparent overflow-hidden">
        {/* Mobile Background Pattern & 3D Effects */}
        <div className="lg:hidden absolute inset-0 bg-slate-50">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-gold-100/50 via-transparent to-transparent" />
          <div className="absolute top-0 left-0 w-full h-full bg-[url('/grid.svg')] opacity-[0.05]" />

          {/* 3D Animated Blobs for Mobile - Enhanced Visibility */}
          <motion.div
            animate={{
              scale: [1, 1.15, 1],
              opacity: [0.6, 0.8, 0.6],
              y: [0, -15, 0],
              rotate: [0, 10, 0]
            }}
            transition={{ duration: 5, repeat: Infinity }}
            className="absolute -top-24 -right-24 w-72 h-72 bg-gradient-to-br from-gold-300/40 to-gold-500/40 rounded-full blur-[50px] mix-blend-multiply"
          />
          <motion.div
            animate={{
              scale: [1, 1.25, 1],
              opacity: [0.5, 0.7, 0.5],
              x: [0, 15, 0],
              rotate: [0, -10, 0]
            }}
            transition={{ duration: 7, repeat: Infinity, delay: 0.5 }}
            className="absolute -top-12 -left-12 w-60 h-60 bg-gradient-to-br from-purple-300/30 to-purple-500/30 rounded-full blur-[40px] mix-blend-multiply"
          />
        </div>

        <MotionWrapper className="w-full max-w-[420px] space-y-8 relative z-10">
          <div className="text-center lg:text-left space-y-2">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 font-heading">
              {isSignUp ? 'Create an account' : 'Welcome back'}
            </h2>
            <p className="text-slate-500">
              {isSignUp ? 'Start managing your jewellery business in minutes.' : 'Please enter your details to sign in.'}
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <AnimatePresence mode="wait">
                <motion.div
                  key={isSignUp ? 'signup' : 'signin'}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-5"
                >
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-700">Email</FormLabel>
                        <FormControl>
                          <div className="relative group">
                            <Mail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-gold-600 transition-colors" />
                            <Input
                              placeholder="name@example.com"
                              className="pl-10 h-12 bg-slate-50 border-slate-200 focus:border-gold-500 focus:ring-gold-500/20 transition-all text-slate-900"
                              {...field}
                            />
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
                        <FormLabel className="text-slate-700">Password</FormLabel>
                        <FormControl>
                          <div className="relative group">
                            <Lock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-gold-600 transition-colors" />
                            <Input
                              type={showPassword ? 'text' : 'password'}
                              placeholder="••••••••"
                              className="pl-10 pr-10 h-12 bg-slate-50 border-slate-200 focus:border-gold-500 focus:ring-gold-500/20 transition-all text-slate-900"
                              {...field}
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(p => !p)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                            >
                              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full h-12 text-base font-semibold rounded-xl mt-2 bg-slate-900 text-white hover:bg-slate-800 shadow-lg shadow-slate-900/20 transition-all hover:scale-[1.02]"
                    disabled={isLoading}
                  >
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isSignUp ? 'Create account' : 'Sign in'}
                    {!isLoading && <ArrowRight className="ml-2 h-4 w-4" />}
                  </Button>
                </motion.div>
              </AnimatePresence>
            </form>
          </Form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-slate-500">Or continue with</span>
            </div>
          </div>

          <div className="text-center text-sm">
            <span className="text-slate-500">
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}
            </span>{' '}
            <Button
              variant="link"
              className="p-0 h-auto font-semibold text-gold-600 hover:text-gold-700"
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
