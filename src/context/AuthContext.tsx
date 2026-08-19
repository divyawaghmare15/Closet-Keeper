'use client';

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { User } from '@supabase/supabase-js';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import type { Gender } from '@/types';

interface AuthContextValue {
  configured: boolean;
  loading: boolean;
  user: User | null;
  gender: Gender | null;
  setGender: (g: Gender) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, gender: Gender) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function readGenderFromUser(u: User | null): Gender | null {
  if (!u) return null;
  const meta = u.user_metadata?.gender;
  if (meta === 'male' || meta === 'female') return meta;
  return null;
}

const GENDER_LS_KEY = 'ck_gender';

function readGenderLocal(): Gender | null {
  if (typeof window === 'undefined') return null;
  const v = localStorage.getItem(GENDER_LS_KEY);
  if (v === 'male' || v === 'female') return v;
  return null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const configured = isSupabaseConfigured();
  const [loading, setLoading] = useState(configured);
  const [user, setUser] = useState<User | null>(null);
  const [gender, setGenderState] = useState<Gender | null>(null);

  useEffect(() => {
    if (!configured) {
      setGenderState(readGenderLocal());
      setLoading(false);
      return;
    }

    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setGenderState(readGenderLocal());
      setLoading(false);
      return;
    }

    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      const u = data.session?.user ?? null;
      setUser(u);
      setGenderState(readGenderFromUser(u) ?? readGenderLocal());
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null;
      setUser(u);
      setGenderState(readGenderFromUser(u) ?? readGenderLocal());
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [configured]);

  const value = useMemo<AuthContextValue>(
    () => ({
      configured,
      loading,
      user,
      gender,
      async setGender(g: Gender) {
        localStorage.setItem(GENDER_LS_KEY, g);
        setGenderState(g);
        const supabase = getSupabaseBrowserClient();
        if (supabase && user) {
          await supabase.auth.updateUser({ data: { gender: g } });
        }
      },
      async signIn(email, password) {
        const supabase = getSupabaseBrowserClient();
        if (!supabase) throw new Error('Supabase is not configured');
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      },
      async signUp(email, password, g) {
        const supabase = getSupabaseBrowserClient();
        if (!supabase) throw new Error('Supabase is not configured');
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { gender: g } },
        });
        if (error) throw error;
        localStorage.setItem(GENDER_LS_KEY, g);
        setGenderState(g);
      },
      async signOut() {
        const supabase = getSupabaseBrowserClient();
        if (!supabase) return;
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
      },
    }),
    [configured, loading, user, gender],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
