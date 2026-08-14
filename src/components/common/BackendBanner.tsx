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

  if (localTotal > 0) {
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
      <div className="border-b border-border/50 bg-wash-soft/80 px-3 py-2.5 text-center text-xs leading-relaxed text-foreground sm:px-4 sm:text-sm">
        Found {parts.join(', ')} in this browser.{' '}
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
              })
              .catch((err) => {
                setImportMessage(
                  err instanceof Error ? err.message : 'Import failed',
                );
              })
              .finally(() => setImporting(false));
          }}
          className="font-semibold text-accent hover:underline disabled:opacity-60"
        >
          {importing ? 'Importing…' : 'Import to cloud'}
        </button>
        {importMessage ? ` ${importMessage}` : null}
      </div>
    );
  }

  if (!configured) return null;

  return null;
}
