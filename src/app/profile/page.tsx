'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import type { Gender } from '@/types';

export default function ProfilePage() {
  const { user, gender, setGender, configured } = useAuth();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (!configured || !user) {
    return (
      <div className="mx-auto w-full max-w-lg px-4 py-8">
        <h1 className="font-display text-2xl font-semibold">Profile</h1>
        <p className="mt-2 text-sm text-muted">Sign in to manage your profile.</p>
        <Link href="/auth" className="mt-4 inline-flex rounded-2xl bg-accent px-5 py-3 text-sm font-semibold text-white">
          Sign in
        </Link>
      </div>
    );
  }

  async function handleChangePassword() {
    if (!newPassword || newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const supabase = getSupabaseBrowserClient();
      if (!supabase) throw new Error('Not configured');
      const { error: err } = await supabase.auth.updateUser({ password: newPassword });
      if (err) throw err;
      setMessage('Password updated successfully.');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update password');
    } finally {
      setBusy(false);
    }
  }

  async function handleGenderChange(g: Gender) {
    await setGender(g);
    setMessage(`Gender updated to ${g}.`);
  }

  return (
    <div className="mx-auto w-full max-w-lg px-4 py-8 sm:px-6 sm:py-10">
      <h1 className="font-display text-2xl font-semibold tracking-tight">Profile</h1>
      <p className="mt-1 text-sm text-muted">{user.email}</p>

      {/* Gender */}
      <section className="mt-8 space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">Gender</h2>
        <div className="flex gap-3">
          {(['female', 'male'] as const).map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => void handleGenderChange(g)}
              className={`flex-1 cursor-pointer rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${
                gender === g
                  ? 'border-accent bg-accent text-white'
                  : 'border-border bg-surface text-foreground hover:border-accent/50'
              }`}
            >
              {g === 'female' ? 'Female' : 'Male'}
            </button>
          ))}
        </div>
      </section>

      {/* Change password */}
      <section className="mt-8 space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">Change Password</h2>
        <input
          type="password"
          placeholder="New password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm outline-none focus:border-accent"
        />
        <input
          type="password"
          placeholder="Confirm new password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm outline-none focus:border-accent"
        />
        <button
          type="button"
          onClick={() => void handleChangePassword()}
          disabled={busy}
          className="w-full cursor-pointer rounded-2xl bg-accent py-3 text-sm font-semibold text-white disabled:opacity-60"
        >
          {busy ? 'Updating…' : 'Update password'}
        </button>
      </section>

      {error && (
        <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}
      {message && (
        <p className="mt-4 rounded-xl bg-accent-soft px-3 py-2 text-sm text-accent">{message}</p>
      )}
    </div>
  );
}
