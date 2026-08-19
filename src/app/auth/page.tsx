'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import type { Gender } from '@/types';

export default function AuthPage() {
  const router = useRouter();
  const { configured, user, loading, signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedGender, setSelectedGender] = useState<Gender | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  if (!configured) {
    return (
      <div className="mx-auto w-full max-w-lg px-4 py-8 sm:px-6 sm:py-10">
        <h1 className="font-display text-3xl font-semibold tracking-tight">
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

  if (!loading && user) {
    return (
      <div className="mx-auto w-full max-w-lg px-4 py-8 sm:px-6 sm:py-10">
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          You are signed in
        </h1>
        <p className="mt-2 text-sm text-muted">{user.email}</p>
        <Link
          href="/"
          className="mt-6 inline-flex cursor-pointer rounded-2xl bg-accent px-5 py-3 text-sm font-semibold text-white"
        >
          Go to home
        </Link>
      </div>
    );
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError('');
    setMessage('');

    try {
      if (mode === 'signin') {
        await signIn(email.trim(), password);
        router.push('/');
      } else {
        if (!selectedGender) {
          setError('Please select Male or Female to continue.');
          setBusy(false);
          return;
        }
        await signUp(email.trim(), password, selectedGender);
        setMessage(
          'Account created. If email confirmation is enabled in Supabase, check your inbox before signing in.',
        );
        setMode('signin');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-lg px-4 py-8 sm:px-6 sm:py-10">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          {mode === 'signin' ? 'Sign in' : 'Create account'}
        </h1>
        <p className="mt-2 text-sm text-muted">
          Your wardrobe items sync to Supabase when you are signed in.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-[1.75rem] border border-border/60 bg-surface-elevated/90 p-5 shadow-sm sm:p-7"
      >
        <label className="block space-y-1.5">
          <span className="text-sm font-semibold">Email</span>
          <input
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm outline-none focus:border-accent"
          />
        </label>

        <div className="block space-y-1.5">
          <label htmlFor="auth-password" className="text-sm font-semibold">
            Password
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
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
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

        {mode === 'signup' && (
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
        )}

        {error && (
          <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
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
              : 'Create account'}
        </button>
      </form>

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
    </div>
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
