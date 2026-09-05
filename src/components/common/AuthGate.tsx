'use client';

import { useEffect, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

const PUBLIC_PATHS = ['/auth'];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

/**
 * When Supabase is configured, require sign-in for all app pages except /auth.
 * Local-only mode (no Supabase) stays open without an account.
 */
export function AuthGate({ children }: { children: ReactNode }) {
  const { configured, user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const publicPage = isPublicPath(pathname);

  useEffect(() => {
    if (!configured || loading || publicPage) return;
    if (!user) {
      const next = encodeURIComponent(pathname || '/');
      router.replace(`/auth?next=${next}`);
    }
  }, [configured, loading, publicPage, user, pathname, router]);

  if (!configured || publicPage) {
    return <>{children}</>;
  }

  if (loading || !user) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center px-4">
        <p className="text-sm text-muted">Checking sign-in…</p>
      </div>
    );
  }

  return <>{children}</>;
}
