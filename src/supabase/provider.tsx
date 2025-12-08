'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Session, User, AuthChangeEvent } from '@supabase/supabase-js';
import { supabase } from './client';

interface SupabaseContextState {
  session: Session | null;
  user: (User & { uid: string }) | null;
  isUserLoading: boolean;
}

const SupabaseContext = createContext<SupabaseContextState | undefined>(undefined);

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<(User & { uid: string }) | null>(null);
  const [isUserLoading, setIsUserLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      setIsUserLoading(true);
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Session error:', error);
          // Clear invalid session and local storage
          await supabase.auth.signOut();
          localStorage.clear();
          sessionStorage.clear();
        }
        if (!mounted) return;
        setSession(data.session);
        const u = data.session?.user ?? null;
        setUser(u ? Object.assign(u, { uid: u.id }) : null);
      } catch (err) {
        console.error('Auth initialization error:', err);
        if (mounted) {
          // Clear everything on auth error
          await supabase.auth.signOut();
          localStorage.clear();
          sessionStorage.clear();
          setSession(null);
          setUser(null);
        }
      } finally {
        if (mounted) {
          setIsUserLoading(false);
        }
      }
    };
    init();

    const { data: sub } = supabase.auth.onAuthStateChange((event: AuthChangeEvent, newSession: Session | null) => {
      if (process.env.NODE_ENV === 'development') {
        console.log('Auth state change:', event, !!newSession);
      }
      if (event === 'SIGNED_OUT') {
        setSession(null);
        setUser(null);
      } else if (event === 'TOKEN_REFRESHED' || event === 'SIGNED_IN') {
        setSession(newSession);
        const u = newSession?.user ?? null;
        setUser(u ? Object.assign(u, { uid: u.id }) : null);
      }
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo(() => ({ session, user, isUserLoading }), [session, user, isUserLoading]);

  return <SupabaseContext.Provider value={value}>{children}</SupabaseContext.Provider>;
}

export function useSupabase() {
  return supabase;
}

export function useUser() {
  const ctx = useContext(SupabaseContext);
  if (!ctx) throw new Error('useUser must be used within SupabaseProvider');
  return { user: ctx.user, isUserLoading: ctx.isUserLoading, userError: null as Error | null };
}

export function useAuth() {
  // return auth-like wrapper used by login page
  return {
    signInWithEmailAndPassword: async (email: string, password: string) => {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        const lowerMsg = (error.message || '').toLowerCase();
        let code = 'auth_error';
        if (lowerMsg.includes('email not confirmed')) code = 'email_not_confirmed';
        else if (lowerMsg.includes('invalid login credentials')) code = 'invalid_credentials';
        else if (lowerMsg.includes('invalid email')) code = 'auth/invalid-email';
        const err = new Error(error.message);
        (err as any).code = code;
        throw err;
      }
      // If sign-in succeeded but user has no confirmed email yet, Supabase may not return error.
      if (data?.user && !(data.user.email_confirmed_at || data.user.confirmed_at)) {
        const err = new Error('Email not confirmed');
        (err as any).code = 'email_not_confirmed';
        throw err;
      }
    },
    createUserWithEmailAndPassword: async (email: string, password: string) => {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) {
        const lowerMsg = (error.message || '').toLowerCase();
        let code = 'signup_error';
        if (lowerMsg.includes('password')) code = 'weak_password';
        else if (lowerMsg.includes('rate limit')) code = 'rate_limited';
        const err = new Error(error.message);
        (err as any).code = code;
        throw err;
      }
      // Inform user to confirm email if confirmation required
      if (data?.user && !(data.user.email_confirmed_at || data.user.confirmed_at)) {
        const err = new Error('Email verification required. Please check your inbox.');
        (err as any).code = 'email_not_confirmed';
        throw err;
      }
    },
    signOut: async () => {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    },
  };
}
