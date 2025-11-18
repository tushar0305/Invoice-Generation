'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/supabase/provider';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Logo } from '@/components/logo';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { useRouter } from 'next/navigation';

const formSchema = z.object({
  email: z.string().email({ message: 'Invalid email address.' }),
  password: z
    .string()
    .min(6, { message: 'Password must be at least 6 characters.' }),
});

export default function LoginPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const auth = useAuth();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  function getAuthErrorMessage(errorCode: string): string {
    switch (errorCode) {
      case 'auth/invalid-email':
        return 'The email address format is not valid.';
      case 'email_not_confirmed':
        return 'Please confirm your email. Check your inbox (and spam) for the verification link.';
      case 'invalid_credentials':
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
      case 'invalid_grant':
        return 'Invalid credentials. Please check your email and password.';
      case 'auth/user-disabled':
        return 'This user account has been disabled.';
      case 'auth/user-not-found':
        return 'No user found with this email. Please contact admin.';
      case 'weak_password':
        return 'Password is too weak. Please choose a stronger one.';
      case 'rate_limited':
        return 'Too many attempts. Please wait a moment and try again.';
      default:
        return 'An unexpected error occurred. Please try again.';
    }
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    try {
      if (mode === 'signin') {
        await auth.signInWithEmailAndPassword(values.email, values.password);
        toast({ title: 'Signed In', description: "You're now logged in." });
      } else {
        await auth.createUserWithEmailAndPassword(values.email, values.password);
        toast({ title: 'Account Created', description: 'Account created. Please verify your email before signing in.' });
      }
    } catch (error: any) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: mode === 'signin' ? 'Authentication Error' : 'Signup Notice',
        description: getAuthErrorMessage(error.code || error?.message || ''),
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <Logo generic />
          </div>
          <CardTitle className="text-2xl">
            {mode === 'signin' ? 'Welcome Back' : 'Create Account'}
          </CardTitle>
          <CardDescription>
            {mode === 'signin' ? 'Enter your credentials to access your dashboard.' : 'Sign up with email and password to start.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="name@example.com"
                        type="email"
                        {...field}
                      />
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
                        <Input
                          placeholder="••••••••"
                          type={showPassword ? 'text' : 'password'}
                          {...field}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground"
                          onClick={() => setShowPassword((prev) => !prev)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {mode === 'signin' ? 'Sign In' : 'Sign Up'}
              </Button>
              <div className="text-center text-sm text-muted-foreground">
                {mode === 'signin' ? (
                  <>
                    New here?{' '}
                    <button
                      type="button"
                      onClick={() => setMode('signup')}
                      className="text-primary hover:underline"
                    >
                      Create an account
                    </button>
                  </>
                ) : (
                  <>
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={() => setMode('signin')}
                      className="text-primary hover:underline"
                    >
                      Sign in
                    </button>
                  </>
                )}
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
