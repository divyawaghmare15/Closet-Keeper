'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { useAuth } from '@/context/AuthContext';
import type { Gender } from '@/types';

type AuthMode = 'signin' | 'signup' | 'forgot' | 'update-password';

function safeNextPath(raw: string | null): string {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//')) return '/';
  return raw;
}

function AuthPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    configured,
    user,
    loading,
    signIn,
    signUp,
    resetPassword,
    updatePassword,
    passwordRecovery,
    clearPasswordRecovery,
  } = useAuth();

  const nextPath = useMemo(
    () => safeNextPath(searchParams.get('next')),
    [searchParams],
  );

  const modeFromUrl = searchParams.get('mode');
  const [mode, setMode] = useState<AuthMode>(() => {
    if (modeFromUrl === 'update-password' || modeFromUrl === 'forgot') {
      return modeFromUrl;
    }
    return 'signin';
  });

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedGender, setSelectedGender] = useState<Gender | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (modeFromUrl === 'update-password' || modeFromUrl === 'forgot') {
      setMode(modeFromUrl);
    }
  }, [modeFromUrl]);

  useEffect(() => {
    if (passwordRecovery) {
      setMode('update-password');
      setMessage('Choose a new password for your account.');
    }
  }, [passwordRecovery]);

  useEffect(() => {
    if (!loading && user && mode !== 'update-password' && !passwordRecovery) {
      router.replace(nextPath);
    }
  }, [loading, user, mode, passwordRecovery, router, nextPath]);

  if (!configured) {
    return (
      <div className="mx-auto w-full max-w-lg px-4 py-8 sm:px-6 sm:py-10">
        <p className="font-display text-2xl font-semibold tracking-tight text-accent">
          ClosetKeeper
        </p>
        <h1 className="mt-6 font-display text-3xl font-semibold tracking-tight">
          Backend not connected yet
        </h1>
        <p className="mt-3 text-sm text-muted">
          Add your Supabase URL and anon key to <code>.env.local</code>, run{' '}
          <code>supabase/schema.sql</code> in the Supabase SQL editor, then
          restart the app.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex cursor-pointer rounded-2xl bg-accent px-5 py-3 text-sm font-semibold text-white"
        >
          Back home
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center px-4">
        <p className="text-sm text-muted">Loading…</p>
      </div>
    );
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError('');
    setMessage('');

    try {
      if (mode === 'forgot') {
        if (!email.trim()) {
          setError('Enter the email for your account.');
          setBusy(false);
          return;
        }
        await resetPassword(email.trim());
        setMessage(
          'If an account exists for that email, we sent a reset link. Open it on this device to choose a new password.',
        );
        setBusy(false);
        return;
      }

      if (mode === 'update-password') {
        if (password.length < 6) {
          setError('Password must be at least 6 characters.');
          setBusy(false);
          return;
        }
        if (password !== confirmPassword) {
          setError('Passwords do not match.');
          setBusy(false);
          return;
        }
        await updatePassword(password);
        clearPasswordRecovery();
        setMessage('Password updated. You are signed in.');
        router.replace(nextPath === '/auth' ? '/' : nextPath);
        setBusy(false);
        return;
      }

      if (mode === 'signin') {
        await signIn(email.trim(), password);
        router.replace(nextPath);
        return;
      }

      if (!selectedGender) {
        setError('Please select Male or Female to continue.');
        setBusy(false);
        return;
      }

      const result = await signUp(email.trim(), password, selectedGender);
      if (result.signedIn) {
        router.replace(nextPath);
        return;
      }

      setMessage(
        'Account created. Check your inbox to confirm your email, then sign in.',
      );
      setMode('signin');
      setPassword('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setBusy(false);
    }
  }

  const title =
    mode === 'signin'
      ? 'Sign in'
      : mode === 'signup'
        ? 'Create account'
        : mode === 'forgot'
          ? 'Reset password'
          : 'Set new password';

  const subtitle =
    mode === 'signin'
      ? 'Sign in to sync your wardrobe to the cloud.'
      : mode === 'signup'
        ? 'Choose your profile so categories and suggestions match you.'
        : mode === 'forgot'
          ? 'We will email you a link to choose a new password.'
          : 'Enter a new password for your ClosetKeeper account.';

  return (
    <div className="mx-auto w-full max-w-lg px-4 py-8 sm:px-6 sm:py-10">
      <p className="font-display text-2xl font-semibold tracking-tight text-accent">
        ClosetKeeper
      </p>

      <div className="mt-6 mb-8">
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          {title}
        </h1>
        <p className="mt-2 text-sm text-muted">{subtitle}</p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-[1.75rem] border border-border/60 bg-surface-elevated/90 p-5 shadow-sm sm:p-7"
      >
        {mode !== 'update-password' ? (
          <label className="block space-y-1.5">
            <span className="text-sm font-semibold">Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm outline-none focus:border-accent"
              autoComplete="email"
            />
          </label>
        ) : null}

        {mode === 'signin' || mode === 'signup' || mode === 'update-password' ? (
          <div className="block space-y-1.5">
            <label htmlFor="auth-password" className="text-sm font-semibold">
              {mode === 'update-password' ? 'New password' : 'Password'}
            </label>
            <div className="relative">
              <input
                id="auth-password"
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-xl border border-border bg-surface py-2.5 pr-11 pl-3 text-sm outline-none focus:border-accent"
                autoComplete={
                  mode === 'signin' ? 'current-password' : 'new-password'
                }
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                aria-pressed={showPassword}
                className="absolute top-1/2 right-2 flex size-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-lg text-muted transition hover:bg-accent-soft/70 hover:text-foreground"
              >
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
          </div>
        ) : null}

        {mode === 'update-password' ? (
          <label className="block space-y-1.5">
            <span className="text-sm font-semibold">Confirm new password</span>
            <input
              type={showPassword ? 'text' : 'password'}
              required
              minLength={6}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm outline-none focus:border-accent"
              autoComplete="new-password"
            />
          </label>
        ) : null}

        {mode === 'signup' ? (
          <fieldset className="space-y-1.5">
            <legend className="text-sm font-semibold">I am</legend>
            <div className="flex gap-3">
              {(['female', 'male'] as const).map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setSelectedGender(g)}
                  className={`flex-1 cursor-pointer rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${
                    selectedGender === g
                      ? 'border-accent bg-accent text-white'
                      : 'border-border bg-surface text-foreground hover:border-accent/50'
                  }`}
                >
                  {g === 'female' ? 'Female' : 'Male'}
                </button>
              ))}
            </div>
          </fieldset>
        ) : null}

        {mode === 'signin' ? (
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => {
                setMode('forgot');
                setError('');
                setMessage('');
              }}
              className="cursor-pointer text-sm font-semibold text-accent hover:underline"
            >
              Forgot password?
            </button>
          </div>
        ) : null}

        {error && (
          <p
            className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700"
            role="alert"
          >
            {error}
          </p>
        )}
        {message && (
          <p className="rounded-xl bg-accent-soft px-3 py-2 text-sm text-accent">
            {message}
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="w-full cursor-pointer rounded-2xl bg-accent py-3.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy
            ? 'Please wait…'
            : mode === 'signin'
              ? 'Sign in'
              : mode === 'signup'
                ? 'Create account'
                : mode === 'forgot'
                  ? 'Send reset link'
                  : 'Update password'}
        </button>
      </form>

      {mode === 'forgot' || mode === 'update-password' ? (
        <button
          type="button"
          onClick={() => {
            setMode('signin');
            setError('');
            setMessage('');
            setConfirmPassword('');
            clearPasswordRecovery();
          }}
          className="mt-4 cursor-pointer text-sm font-semibold text-accent"
        >
          Back to sign in
        </button>
      ) : (
        <button
          type="button"
          onClick={() => {
            setMode((prev) => (prev === 'signin' ? 'signup' : 'signin'));
            setError('');
            setMessage('');
          }}
          className="mt-4 cursor-pointer text-sm font-semibold text-accent"
        >
          {mode === 'signin'
            ? 'Need an account? Sign up'
            : 'Already have an account? Sign in'}
        </button>
      )}
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center px-4">
          <p className="text-sm text-muted">Loading…</p>
        </div>
      }
    >
      <AuthPageInner />
    </Suspense>
  );
}

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" aria-hidden>
      <path
        d="M2.5 12s3.5-6.5 9.5-6.5S21.5 12 21.5 12s-3.5 6.5-9.5 6.5S2.5 12 2.5 12Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="2.75" stroke="currentColor" strokeWidth="1.75" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" aria-hidden>
      <path
        d="M4 4l16 16M10.1 10.2A2.75 2.75 0 0 0 13.8 13.9M7.1 7.4C4.7 8.8 3 12 3 12s3.5 6.5 9.5 6.5c1.4 0 2.7-.3 3.8-.8M10.7 5.7c.4-.1.9-.2 1.3-.2 6 0 9.5 6.5 9.5 6.5a17 17 0 0 1-2.4 3.1"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
