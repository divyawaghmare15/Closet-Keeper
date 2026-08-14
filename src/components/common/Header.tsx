'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/wardrobe', label: 'Wardrobe' },
  { href: '/add-item', label: 'Add' },
  { href: '/generator', label: 'Outfits' },
  { href: '/misc', label: 'Extras' },
] as const;

export function Header() {
  const pathname = usePathname();
  const { configured, user, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-40 hidden border-b border-border/50 bg-surface-elevated/80 backdrop-blur-md lg:block">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-6 xl:px-10">
        <Link
          href="/"
          className="shrink-0 font-display text-2xl font-semibold tracking-tight text-foreground transition hover:text-accent"
        >
          ClosetKeeper
        </Link>

        <nav
          className="flex min-w-0 flex-1 items-center justify-end gap-1 overflow-x-auto"
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

          {configured ? (
            user ? (
              <button
                type="button"
                onClick={() => {
                  void signOut();
                }}
                className="ml-1 shrink-0 rounded-xl px-3 py-2 text-sm font-semibold text-muted transition hover:bg-accent-soft/70 hover:text-foreground xl:px-4"
              >
                Sign out
              </button>
            ) : (
              <Link
                href="/auth"
                className={`ml-1 shrink-0 rounded-xl px-3 py-2 text-sm font-semibold transition xl:px-4 ${
                  pathname.startsWith('/auth')
                    ? 'bg-accent text-white'
                    : 'text-foreground hover:bg-accent-soft/70'
                }`}
              >
                Sign in
              </Link>
            )
          ) : null}
        </nav>
      </div>
    </header>
  );
}
