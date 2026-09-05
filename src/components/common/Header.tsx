'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/context/AuthContext';

const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/wardrobe', label: 'Wardrobe' },
  { href: '/generator', label: 'Outfits' },
  { href: '/misc', label: 'Extras' },
] as const;

function ProfileMenu({
  email,
  onSignOut,
}: {
  email: string;
  onSignOut: () => void;
}) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const initial = email[0]?.toUpperCase() ?? '?';

  useEffect(() => {
    if (!open) return;

    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-soft text-sm font-bold text-accent ring-2 ring-transparent transition hover:ring-accent/30 focus-visible:outline-none focus-visible:ring-accent/40"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Account menu"
      >
        {initial}
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-44 overflow-hidden rounded-2xl border border-border/60 bg-surface-elevated py-1 shadow-lg"
        >
          <Link
            href="/profile"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="block px-4 py-2.5 text-sm font-semibold text-foreground transition hover:bg-accent-soft/60"
          >
            Profile
          </Link>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onSignOut();
            }}
            className="block w-full px-4 py-2.5 text-left text-sm font-semibold text-muted transition hover:bg-accent-soft/60 hover:text-foreground"
          >
            Sign out
          </button>
        </div>
      ) : null}
    </div>
  );
}

export function Header() {
  const pathname = usePathname();
  const { configured, user, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-40 hidden border-b border-border/50 bg-surface-elevated/80 backdrop-blur-md lg:block">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-6 px-6 xl:px-10">
        <Link
          href="/"
          className="shrink-0 font-display text-2xl font-semibold tracking-tight text-foreground transition hover:text-accent"
        >
          ClosetKeeper
        </Link>

        <nav
          className="flex min-w-0 flex-1 items-center gap-1"
          aria-label="Primary"
        >
          {NAV_LINKS.map(({ href, label }) => {
            const active =
              href === '/' ? pathname === '/' : pathname.startsWith(href);

            return (
              <Link
                key={href}
                href={href}
                className={`shrink-0 rounded-xl px-3 py-2 text-sm font-semibold transition xl:px-4 ${
                  active
                    ? 'bg-accent text-white'
                    : 'text-foreground hover:bg-accent-soft/70'
                }`}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="flex shrink-0 items-center gap-3">
          <Link
            href="/add-item"
            className="rounded-2xl bg-accent px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:brightness-110 active:scale-[0.98]"
          >
            + Add Item
          </Link>

          {configured ? (
            user ? (
              <ProfileMenu
                email={user.email ?? 'User'}
                onSignOut={() => {
                  void signOut().then(() => {
                    window.location.assign('/auth');
                  });
                }}
              />
            ) : (
              <Link
                href="/auth"
                className={`rounded-xl px-3 py-2 text-sm font-semibold transition xl:px-4 ${
                  pathname.startsWith('/auth')
                    ? 'bg-accent text-white'
                    : 'text-foreground hover:bg-accent-soft/70'
                }`}
              >
                Sign in
              </Link>
            )
          ) : null}
        </div>
      </div>
    </header>
  );
}
