'use client';

import { useState, useRef } from 'react';
import { motion, useMotionValue, useSpring, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Mail, Lock, ArrowRight, Eye, EyeOff, TrendingUp, ShieldCheck, Gem, BarChart3, PieChart, Activity } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/supabase/client';
import { MotionWrapper } from '@/components/ui/motion-wrapper';

// --- Types & Schema ---
const authSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type AuthFormValues = z.infer<typeof authSchema>;

// --- Hyper-Realistic 3D Ad Component ---

function FuturisticDashboardAd() {
  const ref = useRef<HTMLDivElement>(null);

  // Mouse position state
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Smoother, heavier spring for a "weighty" feel
  const mouseX = useSpring(x, { stiffness: 100, damping: 30 });
  const mouseY = useSpring(y, { stiffness: 100, damping: 30 });

  function handleMouseMove(e: React.MouseEvent) {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseXFromCenter = e.clientX - rect.left - width / 2;
    const mouseYFromCenter = e.clientY - rect.top - height / 2;

    x.set(mouseXFromCenter / 40);
    y.set(mouseYFromCenter / 40);
  }

  function handleMouseLeave() {
    x.set(0);
    y.set(0);
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative w-full h-full flex items-center justify-center perspective-1000"
      style={{ perspective: 1500 }}
    >
      {/* 3D Container */}
      <motion.div
        style={{ rotateX: mouseY, rotateY: mouseX }}
        className="relative w-[520px] h-[360px] preserve-3d transition-transform duration-100 ease-out"
      >
        {/* --- Layer 0: Ambient Glow & Shadow --- */}
        <div className="absolute inset-0 bg-gold-500/5 rounded-[30px] blur-[80px] animate-pulse-slow"
          style={{ transform: 'translateZ(-80px)' }} />
        <div className="absolute top-[90%] left-[10%] right-[10%] h-10 bg-black/40 blur-xl rounded-full"
          style={{ transform: 'translateZ(-100px) rotateX(90deg)' }} />

        {/* --- Layer 1: Main Dashboard Base (Frosted Glass) --- */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl border border-white/20 rounded-[32px] shadow-[0_0_0_1px_rgba(255,255,255,0.1),0_20px_60px_rgba(0,0,0,0.3)] overflow-hidden"
          style={{ transformStyle: 'preserve-3d' }}>

          {/* Glossy Reflection Overlay */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent opacity-50 pointer-events-none" />

          {/* Subtle Grid */}
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.03]" />

          {/* --- Mock UI Structure --- */}

          {/* Sidebar */}
          <div className="absolute left-0 top-0 bottom-0 w-20 border-r border-white/10 bg-white/5 flex flex-col items-center py-8 gap-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold-400 to-gold-600 shadow-lg shadow-gold-500/20 flex items-center justify-center">
              <div className="w-4 h-4 bg-white rounded-full opacity-80" />
            </div>
            <div className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 transition-colors" />
            <div className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 transition-colors" />
            <div className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 transition-colors" />
            <div className="mt-auto w-8 h-8 rounded-full bg-gradient-to-tr from-slate-700 to-slate-600 border border-white/20" />
          </div>

          {/* Header */}
          <div className="absolute left-20 top-0 right-0 h-20 border-b border-white/10 flex items-center px-8 justify-between">
            <div className="flex flex-col gap-1">
              <div className="w-32 h-2 rounded-full bg-white/20" />
              <div className="w-20 h-2 rounded-full bg-white/10" />
            </div>
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10" />
              <div className="w-10 h-10 rounded-full bg-gold-500/10 border border-gold-500/20 flex items-center justify-center">
                <div className="w-2 h-2 bg-gold-400 rounded-full animate-pulse" />
              </div>
            </div>
          </div>

          {/* Content Grid */}
          <div className="absolute left-20 top-20 right-0 bottom-0 p-8 grid grid-cols-3 gap-6">
            {/* Card 1: Revenue */}
            <div className="col-span-2 bg-gradient-to-br from-white/5 to-transparent rounded-2xl border border-white/10 p-5 relative overflow-hidden group">
              <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="flex justify-between items-start mb-4">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                  <TrendingUp size={16} className="text-emerald-400" />
                </div>
                <span className="text-xs text-emerald-400 font-bold">+12.5%</span>
              </div>
              <div className="w-24 h-2 rounded-full bg-white/10 mb-2" />
              <div className="w-32 h-6 rounded-lg bg-white/20" />

              {/* Realistic Spline Chart */}
              <div className="absolute bottom-0 left-0 right-0 h-16 opacity-50">
                <svg className="w-full h-full" viewBox="0 0 100 40" preserveAspectRatio="none">
                  <path d="M0 35 C 20 35, 20 10, 40 20 C 60 30, 60 5, 80 15 L 100 10 V 40 H 0 Z" fill="url(#grad1)" />
                  <path d="M0 35 C 20 35, 20 10, 40 20 C 60 30, 60 5, 80 15 L 100 10" fill="none" stroke="#10b981" strokeWidth="2" />
                  <defs>
                    <linearGradient id="grad1" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" style={{ stopColor: '#10b981', stopOpacity: 0.3 }} />
                      <stop offset="100%" style={{ stopColor: '#10b981', stopOpacity: 0 }} />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            </div>

            {/* Card 2: Inventory */}
            <div className="bg-gradient-to-br from-white/5 to-transparent rounded-2xl border border-white/10 p-5 flex flex-col justify-between relative overflow-hidden">
              <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center mb-2">
                <PieChart size={16} className="text-purple-400" />
              </div>
              <div className="relative w-20 h-20 mx-auto my-2">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="40" cy="40" r="32" stroke="rgba(255,255,255,0.1)" strokeWidth="8" fill="none" />
                  <circle cx="40" cy="40" r="32" stroke="#a855f7" strokeWidth="8" fill="none" strokeDasharray="200" strokeDashoffset="60" strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">75%</div>
              </div>
            </div>

            {/* Card 3: Recent Activity (Wide) */}
            <div className="col-span-3 bg-gradient-to-br from-white/5 to-transparent rounded-2xl border border-white/10 p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-white/10 flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="w-3/4 h-2 rounded-full bg-white/20" />
                <div className="w-1/2 h-2 rounded-full bg-white/10" />
              </div>
              <div className="w-16 h-6 rounded-full bg-gold-500/20 border border-gold-500/30" />
            </div>
          </div>
        </div>

        {/* --- Layer 2: Floating Elements (High Z-Index) --- */}

        {/* Gold Rate Ticker (Top Right) */}
        <motion.div
          animate={{ y: [0, -10, 0], rotateZ: [0, 2, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -right-16 top-12 w-56 bg-slate-900/95 backdrop-blur-xl p-5 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.4)] border border-slate-700/50"
          style={{ transformStyle: 'preserve-3d', translateZ: '80px' }}
        >
          <div className="flex justify-between items-start mb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-gold-500/20 rounded-md">
                <Gem size={14} className="text-gold-400" />
              </div>
              <span className="text-xs font-medium text-slate-300">Gold (24K)</span>
            </div>
            <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">+0.8%</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-sm text-gold-500 font-bold">₹</span>
            <span className="text-2xl font-bold text-white tracking-tight">7,240</span>
          </div>
          <div className="mt-3 h-1 w-full bg-slate-800 rounded-full overflow-hidden">
            <motion.div
              animate={{ x: ['-100%', '100%'] }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="h-full w-1/2 bg-gradient-to-r from-transparent via-gold-500 to-transparent opacity-50"
            />
          </div>
        </motion.div>

        {/* Live Sales Badge (Bottom Left) */}
        <motion.div
          animate={{ y: [0, 10, 0], rotateZ: [0, -2, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute -left-10 bottom-20 bg-white/90 backdrop-blur-xl p-4 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.1)] border border-white/60 flex items-center gap-4"
          style={{ transformStyle: 'preserve-3d', translateZ: '60px' }}
        >
          <div className="relative">
            <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center">
              <Activity size={20} className="text-indigo-600" />
            </div>
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white flex items-center justify-center text-[8px] font-bold text-white">3</div>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">New Orders</p>
            <p className="text-lg font-bold text-slate-900">Just Now</p>
          </div>
        </motion.div>

        {/* Security Shield (Bottom Right) */}
        <motion.div
          className="absolute -bottom-8 right-12 bg-gradient-to-r from-slate-800 to-slate-900 text-white px-4 py-2 rounded-xl shadow-lg border border-slate-700 flex items-center gap-2"
          style={{ transformStyle: 'preserve-3d', translateZ: '100px' }}
        >
          <ShieldCheck size={14} className="text-emerald-400" />
          <span className="text-xs font-medium">End-to-End Encrypted</span>
        </motion.div>

      </motion.div>
    </motion.div>
  );
}

// --- Main Page Component ---

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
        const { error } = await supabase.auth.signUp({
          email: data.email,
          password: data.password,
        });
        if (error) throw error;
        toast({ title: 'Account created!', description: 'Redirecting to shop setup...' });
        router.push('/onboarding/shop-setup');
      } else {
        // Sign in
        const { data: authData, error } = await supabase.auth.signInWithPassword({
          email: data.email,
          password: data.password,
        });
        if (error) throw error;

        // Check if user has shops to route correctly and prevent redirect flash
        if (authData.user) {
          const { data: roles } = await supabase
            .from('user_shop_roles')
            .select('shop_id')
            .eq('user_id', authData.user.id)
            .limit(1);

          if (roles && roles.length > 0) {
            // User has shops - redirect to admin dashboard
            toast({ title: 'Welcome back!', description: 'Loading your dashboard...' });
            router.push('/admin');
          } else {
            // No shops - redirect to setup
            toast({ title: 'Welcome!', description: 'Let\'s set up your first shop...' });
            router.push('/onboarding/shop-setup');
          }
        }
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Authentication Error',
        description: error.message || 'Something went wrong.',
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen w-full flex bg-[#FDFBF7] font-sans text-slate-900 overflow-hidden selection:bg-gold-200 selection:text-gold-900">

      {/* --- Left Side: 3D Advertisement (Desktop) --- */}
      <div className="hidden lg:flex w-[55%] relative items-center justify-center bg-slate-900 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-800 via-slate-900 to-black" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.05]" />

        {/* Animated Orbs */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <motion.div
            animate={{ y: [0, -50, 0], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 10, repeat: Infinity }}
            className="absolute top-1/4 -left-20 w-[600px] h-[600px] bg-gold-500/10 rounded-full blur-[120px]"
          />
          <motion.div
            animate={{ y: [0, 50, 0], opacity: [0.2, 0.4, 0.2] }}
            transition={{ duration: 12, repeat: Infinity, delay: 2 }}
            className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[100px]"
          />
        </div>

        {/* 3D Dashboard Ad */}
        <div className="w-full h-full max-w-4xl max-h-[800px] z-10 flex flex-col items-center justify-center">
          <div className="w-full h-[500px]">
            <FuturisticDashboardAd />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="text-center mt-4 space-y-4 max-w-lg"
          >
            <h2 className="text-3xl font-heading font-bold text-white">
              The Future of <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-300 to-gold-500">Jewellery Retail</span>
            </h2>
            <p className="text-slate-400 text-lg">
              Experience the power of a fully integrated management suite.
              Inventory, Billing, and CRM in one holographic workspace.
            </p>
          </motion.div>
        </div>
      </div>

      {/* --- Right Side: Auth Form --- */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-8 relative bg-[#FDFBF7]">

        <MotionWrapper className="w-full max-w-[420px] relative z-20">

          {/* Logo (Right Side) */}
          <div className="flex justify-center mb-10">
            <div className="relative w-56 h-20">
              <Image
                src="/logo/swarnavyapar_light.png"
                alt="SwarnaVyapar Logo"
                fill
                className="object-contain"
                priority
              />
            </div>
          </div>

          <div className="text-center space-y-2 mb-8">
            <h1 className="text-2xl font-bold font-heading text-slate-900">
              {isSignUp ? 'Create Your Account' : 'Sign In to Dashboard'}
            </h1>
            <p className="text-slate-500">
              {isSignUp ? 'Join the network of premium jewellers.' : 'Access your secure workspace.'}
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={isSignUp ? 'signup' : 'signin'}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-5"
                >
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem id="login-email">
                        <FormLabel className="text-slate-700 font-medium">Email Address</FormLabel>
                        <FormControl>
                          <div className="relative group">
                            <Mail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-gold-600 transition-colors" />
                            <Input
                              placeholder="jeweller@swarnavyapar.in"
                              className="pl-10 h-12 bg-white border-slate-200 focus:border-gold-500 focus:ring-4 focus:ring-gold-500/10 transition-all text-slate-900 rounded-xl shadow-sm"
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
                      <FormItem id="login-password">
                        <FormLabel className="text-slate-700 font-medium">Password</FormLabel>
                        <FormControl>
                          <div className="relative group">
                            <Lock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-gold-600 transition-colors" />
                            <Input
                              type={showPassword ? 'text' : 'password'}
                              placeholder="••••••••"
                              className="pl-10 pr-10 h-12 bg-white border-slate-200 focus:border-gold-500 focus:ring-4 focus:ring-gold-500/10 transition-all text-slate-900 rounded-xl shadow-sm"
                              {...field}
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(p => !p)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
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
                    className="w-full h-12 text-base font-bold rounded-xl mt-4 bg-gradient-to-r from-slate-900 to-slate-800 text-white hover:from-slate-800 hover:to-slate-700 shadow-lg shadow-slate-900/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    disabled={isLoading}
                  >
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isSignUp ? 'Create Account' : 'Sign In'}
                    {!isLoading && <ArrowRight className="ml-2 h-4 w-4" />}
                  </Button>
                </motion.div>
              </AnimatePresence>
            </form>
          </Form>

          <div className="mt-8 text-center">
            <p className="text-slate-500 text-sm mb-2">
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}
            </p>
            <Button
              variant="outline"
              className="w-full h-11 border-gold-200 text-gold-700 hover:bg-gold-50 hover:text-gold-800 hover:border-gold-300 transition-colors font-medium rounded-xl"
              onClick={() => setIsSignUp(!isSignUp)}
            >
              {isSignUp ? 'Sign In Instead' : 'Create New Account'}
            </Button>
          </div>

          {/* Footer Info */}
          <div className="mt-10 text-center text-xs text-slate-400">
            &copy; {new Date().getFullYear()} SwarnaVyapar. All rights reserved.
          </div>

        </MotionWrapper>
      </div>
    </div>
  );
}
