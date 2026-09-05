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

export type SignUpResult = {
  /** True when Supabase created a session (email confirm off). */
  signedIn: boolean;
  /** True when the user must confirm email before signing in. */
  needsEmailConfirmation: boolean;
};

interface AuthContextValue {
  configured: boolean;
  loading: boolean;
  user: User | null;
  gender: Gender | null;
  /** True after a password-recovery link lands the user in a recovery session. */
  passwordRecovery: boolean;
  setGender: (g: Gender) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (
    email: string,
    password: string,
    gender: Gender,
  ) => Promise<SignUpResult>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  clearPasswordRecovery: () => void;
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

function persistGender(g: Gender) {
  localStorage.setItem(GENDER_LS_KEY, g);
}

function authRedirectBase(): string {
  if (typeof window === 'undefined') return '';
  return `${window.location.origin}/auth`;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const configured = isSupabaseConfigured();
  const [loading, setLoading] = useState(configured);
  const [user, setUser] = useState<User | null>(null);
  const [gender, setGenderState] = useState<Gender | null>(null);
  const [passwordRecovery, setPasswordRecovery] = useState(false);

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
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setPasswordRecovery(true);
      }
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
      passwordRecovery,
      clearPasswordRecovery() {
        setPasswordRecovery(false);
      },
      async setGender(g: Gender) {
        persistGender(g);
        setGenderState(g);
        const supabase = getSupabaseBrowserClient();
        if (supabase && user) {
          await supabase.auth.updateUser({ data: { gender: g } });
        }
      },
      async signIn(email, password) {
        const supabase = getSupabaseBrowserClient();
        if (!supabase) throw new Error('Supabase is not configured');
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;

        const signedIn = data.user;
        const existing = readGenderFromUser(signedIn);
        if (existing) {
          persistGender(existing);
          setGenderState(existing);
        } else {
          setGenderState(readGenderLocal());
        }
        setUser(signedIn);
      },
      async signUp(email, password, g) {
        const supabase = getSupabaseBrowserClient();
        if (!supabase) throw new Error('Supabase is not configured');
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { gender: g },
            emailRedirectTo: `${authRedirectBase()}?next=${encodeURIComponent('/')}`,
          },
        });
        if (error) throw error;

        persistGender(g);
        setGenderState(g);

        if (data.session?.user) {
          setUser(data.session.user);
          return { signedIn: true, needsEmailConfirmation: false };
        }

        return { signedIn: false, needsEmailConfirmation: true };
      },
      async signOut() {
        const supabase = getSupabaseBrowserClient();
        if (!supabase) return;
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        localStorage.removeItem(GENDER_LS_KEY);
        setGenderState(null);
        setUser(null);
        setPasswordRecovery(false);
      },
      async resetPassword(email) {
        const supabase = getSupabaseBrowserClient();
        if (!supabase) throw new Error('Supabase is not configured');
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${authRedirectBase()}?mode=update-password`,
        });
        if (error) throw error;
      },
      async updatePassword(password) {
        const supabase = getSupabaseBrowserClient();
        if (!supabase) throw new Error('Supabase is not configured');
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
        setPasswordRecovery(false);
      },
    }),
    [configured, loading, user, gender, passwordRecovery],
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
