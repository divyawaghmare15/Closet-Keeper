'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useWardrobe } from '@/context/WardrobeContext';

export function BackendBanner() {
  const { configured, user, loading } = useAuth();
  const {
    cloudEnabled,
    localItemCount,
    localOutfitCount,
    localCapsuleCount,
    localMiscCount,
    importLocalToCloud,
  } = useWardrobe();
  const [importing, setImporting] = useState(false);
  const [importMessage, setImportMessage] = useState('');
  const [dismissed, setDismissed] = useState(false);

  const localTotal =
    localItemCount + localOutfitCount + localCapsuleCount + localMiscCount;

  if (!cloudEnabled) {
    return (
      <div className="border-b border-border/50 bg-surface-elevated/80 px-3 py-2.5 text-center text-xs leading-relaxed text-muted sm:px-4 sm:text-sm">
        Running in local mode. Connect Supabase to sync your wardrobe — see{' '}
        <code className="text-foreground">supabase/schema.sql</code> and{' '}
        <Link href="/auth" className="font-semibold text-accent hover:underline">
          /auth
        </Link>
        .
      </div>
    );
  }

  if (loading) return null;

  if (!user) {
    return (
      <div className="border-b border-border/50 bg-accent-soft/70 px-3 py-2.5 text-center text-xs leading-relaxed text-foreground sm:px-4 sm:text-sm">
        Supabase is connected.{' '}
        <Link href="/auth" className="font-semibold text-accent hover:underline">
          Sign in
        </Link>{' '}
        to sync items, outfits, and extras in the cloud.
      </div>
    );
  }

  if (localTotal > 0 && !dismissed) {
    const parts = [
      localItemCount > 0
        ? `${localItemCount} item${localItemCount === 1 ? '' : 's'}`
        : null,
      localOutfitCount > 0
        ? `${localOutfitCount} outfit${localOutfitCount === 1 ? '' : 's'}`
        : null,
      localCapsuleCount > 0
        ? `${localCapsuleCount} capsule${localCapsuleCount === 1 ? '' : 's'}`
        : null,
      localMiscCount > 0
        ? `${localMiscCount} extra card${localMiscCount === 1 ? '' : 's'}`
        : null,
    ].filter(Boolean);

    return (
      <div className="border-b border-wash/30 bg-wash-soft px-3 py-3 sm:px-4">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <div className="min-w-0 text-left">
            <p className="text-sm font-semibold text-foreground">
              Browser clothes found — import before they get lost
            </p>
            <p className="mt-0.5 text-xs leading-relaxed text-muted sm:text-sm">
              This device still has {parts.join(', ')} saved locally. Your cloud
              closet is separate until you import.
            </p>
            {importMessage ? (
              <p className="mt-1 text-xs font-medium text-accent sm:text-sm">
                {importMessage}
              </p>
            ) : null}
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={importing}
              onClick={() => {
                setImporting(true);
                setImportMessage('');
                void importLocalToCloud()
                  .then((result) => {
                    const total =
                      result.items +
                      result.outfits +
                      result.capsules +
                      result.miscCards;
                    setImportMessage(
                      total > 0
                        ? `Imported ${result.items} items, ${result.outfits} outfits, ${result.miscCards} extras.`
                        : 'Nothing to import.',
                    );
                    if (total > 0) {
                      window.setTimeout(() => setDismissed(true), 1800);
                    }
                  })
                  .catch((err) => {
                    setImportMessage(
                      err instanceof Error ? err.message : 'Import failed',
                    );
                  })
                  .finally(() => setImporting(false));
              }}
              className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:brightness-110 disabled:opacity-60"
            >
              {importing ? 'Importing…' : 'Import to cloud'}
            </button>
            <button
              type="button"
              onClick={() => setDismissed(true)}
              className="rounded-xl px-3 py-2 text-sm font-semibold text-muted transition hover:bg-white/60 hover:text-foreground"
            >
              Later
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!configured) return null;

  return null;
}
