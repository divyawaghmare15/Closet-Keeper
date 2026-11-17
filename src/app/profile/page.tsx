'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useWardrobe } from '@/context/WardrobeContext';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import type { Gender } from '@/types';

function firstNameFromEmail(email: string | undefined): string {
  if (!email) return 'You';
  const local = email.split('@')[0] ?? '';
  const token = local.split(/[._-]/)[0] ?? '';
  if (!token) return 'You';
  return token.charAt(0).toUpperCase() + token.slice(1).toLowerCase();
}

export default function ProfilePage() {
  const { user, gender, configured, signOut, setGender } = useAuth();
  const { items, savedOutfits } = useWardrobe();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [genderBusy, setGenderBusy] = useState(false);
  const [securityOpen, setSecurityOpen] = useState(false);

  const stats = useMemo(() => {
    const clean = items.filter((item) => item.isClean).length;
    return {
      pieces: items.length,
      ready: clean,
      laundry: items.length - clean,
      looks: savedOutfits.length,
    };
  }, [items, savedOutfits.length]);

  if (!configured || !user) {
    return (
      <div className="mx-auto w-full max-w-lg px-4 py-8">
        <h1 className="font-display text-2xl font-semibold">You</h1>
        <p className="mt-2 text-sm text-muted">Sign in to manage your profile.</p>
        <Link
          href="/auth"
          className="mt-4 inline-flex rounded-2xl bg-accent px-5 py-3 text-sm font-semibold text-white"
        >
          Sign in
        </Link>
      </div>
    );
  }

  const name = firstNameFromEmail(user.email);
  const initial = (user.email?.[0] ?? '?').toUpperCase();

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
      const { error: err } = await supabase.auth.updateUser({
        password: newPassword,
      });
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

  async function handleGenderChange(next: Gender) {
    if (next === gender) return;
    setGenderBusy(true);
    setError('');
    setMessage('');
    try {
      await setGender(next);
      setMessage(
        next === 'male'
          ? "Profile set to Male. Categories and suggestions will use the men's closet."
          : "Profile set to Female. Categories and suggestions will use the women's closet.",
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not update profile type',
      );
    } finally {
      setGenderBusy(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-lg px-3 pb-8 pt-4 sm:px-6 sm:py-10">
      <section className="animate-fade-up">
        <div className="flex items-center gap-3.5">
          <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-accent text-lg font-bold text-white shadow-sm sm:size-16 sm:text-xl">
            {initial}
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold tracking-[0.14em] text-accent uppercase">
              ClosetKeeper
            </p>
            <h1 className="truncate font-display text-2xl font-semibold tracking-tight sm:text-3xl">
              {name}
            </h1>
            <p className="truncate text-sm text-muted">{user.email}</p>
          </div>
        </div>
      </section>

      <section
        className="animate-fade-up mt-5 grid grid-cols-4 gap-2 sm:mt-6"
        style={{ animationDelay: '60ms' }}
      >
        <StatCell label="Pieces" value={stats.pieces} href="/wardrobe" />
        <StatCell label="Ready" value={stats.ready} href="/wardrobe" />
        <StatCell
          label="Laundry"
          value={stats.laundry}
          href="/wardrobe?laundry=1"
        />
        <StatCell label="Looks" value={stats.looks} href="/generator" />
      </section>

      <section
        className="animate-fade-up mt-6"
        style={{ animationDelay: '100ms' }}
      >
        <h2 className="mb-2 text-xs font-semibold tracking-wide text-muted uppercase">
          Tools
        </h2>
        <div className="overflow-hidden rounded-[1.35rem] border border-border/60 bg-surface-elevated shadow-sm">
          <ToolRow
            href="/misc"
            title="Extras"
            subtitle="Bags, jewelry, and other bits"
          />
          <ToolRow
            href="/pack"
            title="Packing list"
            subtitle="Build a travel checklist"
          />
          <ToolRow
            href="/capsule"
            title="Capsules"
            subtitle="Seasonal mini-wardrobes"
            last
          />
        </div>
      </section>

      <section
        className="animate-fade-up mt-4 rounded-[1.35rem] border border-border/60 bg-surface-elevated p-4 shadow-sm sm:p-5"
        style={{ animationDelay: '140ms' }}
      >
        <h2 className="text-xs font-semibold tracking-wide text-muted uppercase">
          Closet type
        </h2>
        <p className="mt-1 text-sm text-muted">
          Controls categories when you add and tag pieces.
        </p>
        <div className="mt-3 flex gap-2">
          {(['female', 'male'] as const).map((g) => (
            <button
              key={g}
              type="button"
              disabled={genderBusy}
              onClick={() => void handleGenderChange(g)}
              className={`flex-1 rounded-xl border px-4 py-2.5 text-sm font-semibold transition disabled:opacity-60 ${
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

      <section
        className="animate-fade-up mt-4 overflow-hidden rounded-[1.35rem] border border-border/60 bg-surface-elevated shadow-sm"
        style={{ animationDelay: '180ms' }}
      >
        <button
          type="button"
          onClick={() => setSecurityOpen((prev) => !prev)}
          className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left transition hover:bg-accent-soft/30 sm:px-5"
        >
          <div>
            <h2 className="text-xs font-semibold tracking-wide text-muted uppercase">
              Security
            </h2>
            <p className="mt-0.5 text-sm text-muted">Change password</p>
          </div>
          <span className="text-sm font-semibold text-accent">
            {securityOpen ? 'Hide' : 'Open'}
          </span>
        </button>

        {securityOpen && (
          <div className="space-y-3 border-t border-border/60 px-4 py-4 sm:px-5">
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
              className="w-full rounded-2xl bg-accent py-3 text-sm font-semibold text-white disabled:opacity-60"
            >
              {busy ? 'Updating…' : 'Update password'}
            </button>
          </div>
        )}
      </section>

      <section
        className="animate-fade-up mt-4"
        style={{ animationDelay: '220ms' }}
      >
        <button
          type="button"
          onClick={() => {
            void signOut().then(() => {
              window.location.assign('/auth');
            });
          }}
          className="w-full rounded-2xl border border-border/70 bg-surface-elevated px-4 py-3.5 text-sm font-semibold text-foreground transition hover:bg-accent-soft/50"
        >
          Sign out
        </button>
      </section>

      {error && (
        <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      {message && (
        <p className="mt-4 rounded-xl bg-accent-soft px-3 py-2 text-sm text-accent">
          {message}
        </p>
      )}
    </div>
  );
}

function StatCell({
  label,
  value,
  href,
}: {
  label: string;
  value: number;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-2xl border border-border/60 bg-surface-elevated px-2 py-3 text-center shadow-sm transition hover:border-accent/30 active:scale-[0.98]"
    >
      <p className="font-display text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
        {value}
      </p>
      <p className="mt-0.5 text-[10px] font-semibold tracking-wide text-muted uppercase">
        {label}
      </p>
    </Link>
  );
}

function ToolRow({
  href,
  title,
  subtitle,
  last = false,
}: {
  href: string;
  title: string;
  subtitle: string;
  last?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center justify-between gap-3 px-4 py-3.5 transition hover:bg-accent-soft/40 active:bg-accent-soft/60 sm:px-5 ${
        last ? '' : 'border-b border-border/50'
      }`}
    >
      <div className="min-w-0">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="truncate text-xs text-muted">{subtitle}</p>
      </div>
      <span className="shrink-0 text-accent" aria-hidden>
        →
      </span>
    </Link>
  );
}
