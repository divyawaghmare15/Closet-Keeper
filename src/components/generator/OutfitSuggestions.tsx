'use client';

import { useState } from 'react';
import Link from 'next/link';
import { OutfitCard } from '@/components/generator/OutfitCard';
import { OCCASIONS, SEASONS } from '@/lib/constants';
import { suggestOutfitsFromCloset } from '@/lib/suggestOutfits';
import type { ClothingItem, Occasion, Outfit, Season } from '@/types';

export function OutfitSuggestions({
  items,
  onSave,
}: {
  items: ClothingItem[];
  onSave: (outfit: Outfit) => Promise<void> | void;
}) {
  const [occasion, setOccasion] = useState<Occasion>('Office');
  const [season, setSeason] = useState<Season | 'Any'>('Any');
  const [cleanOnly, setCleanOnly] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [source, setSource] = useState<'ai' | 'rules' | null>(null);
  const [suggestions, setSuggestions] = useState<Outfit[]>([]);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  const cleanCount = items.filter((item) => item.isClean).length;
  const poolCount = cleanOnly ? cleanCount : items.length;

  async function handleSuggest() {
    setLoading(true);
    setError('');
    try {
      const result = await suggestOutfitsFromCloset(items, occasion, {
        season,
        cleanOnly,
      });
      setSuggestions(result.outfits);
      setSource(result.source);
      if (result.outfits.length === 0) {
        setError('No looks found for that occasion. Try Casual, or add more tagged pieces.');
      }
    } catch (err) {
      setSuggestions([]);
      setSource(null);
      setError(err instanceof Error ? err.message : 'Could not suggest outfits');
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(outfit: Outfit) {
    await onSave(outfit);
    setSavedIds((prev) => new Set(prev).add(outfit.id));
  }

  if (items.length === 0) {
    return (
      <div className="rounded-[1.75rem] border border-dashed border-border bg-surface-elevated/70 px-6 py-16 text-center">
        <p className="font-display text-xl font-semibold">Nothing to style yet</p>
        <p className="mx-auto mt-2 max-w-sm text-sm text-muted">
          Add a few pieces to your closet. AI will only suggest looks from clothes you own.
        </p>
        <Link
          href="/add-item"
          className="mt-6 inline-flex rounded-2xl bg-accent px-5 py-3 text-sm font-semibold text-white"
        >
          Add item
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[1.5rem] border border-border/60 bg-surface-elevated p-4 sm:p-5">
        <p className="text-sm font-semibold">Occasion</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {OCCASIONS.map((value) => {
            const active = occasion === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => setOccasion(value)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                  active ? 'bg-accent text-white' : 'bg-surface ring-1 ring-border'
                }`}
              >
                {value}
              </button>
            );
          })}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <label className="text-sm font-semibold">
            Season
            <select
              value={season}
              onChange={(event) =>
                setSeason(event.target.value as Season | 'Any')
              }
              className="ml-2 rounded-xl border border-border bg-surface px-3 py-2 text-sm font-medium"
            >
              <option value="Any">Any</option>
              {SEASONS.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm font-semibold">
            <input
              type="checkbox"
              checked={cleanOnly}
              onChange={(event) => setCleanOnly(event.target.checked)}
              className="size-4 accent-[var(--accent)]"
            />
            Clean only
          </label>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={loading || poolCount === 0}
            onClick={() => void handleSuggest()}
            className="rounded-2xl bg-accent px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {loading
              ? 'Styling your closet…'
              : suggestions.length > 0
                ? 'Suggest again'
                : 'Suggest with AI'}
          </button>
          <p className="text-sm text-muted">
            {poolCount} piece{poolCount === 1 ? '' : 's'} in play
            {cleanOnly ? ` · ${items.length - cleanCount} in wash skipped` : ''}
          </p>
        </div>

        {error && <p className="mt-3 text-sm text-red-700">{error}</p>}
      </section>

      {loading && (
        <div className="rounded-[1.75rem] border border-border/60 bg-surface-elevated/80 px-6 py-14 text-center">
          <p className="font-display text-xl font-semibold">Looking through your closet</p>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted">
            Pairing {occasion.toLowerCase()} looks from the clothes you already own.
          </p>
        </div>
      )}

      {!loading && suggestions.length > 0 && (
        <div className="space-y-4">
          <p className="text-sm text-muted">
            {source === 'ai'
              ? 'AI styled these from your closet.'
              : 'Rule-based looks from your closet (AI unavailable).'}
          </p>
          <ul className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {suggestions.map((outfit, index) => (
              <li key={outfit.id}>
                <OutfitCard
                  outfit={outfit}
                  index={index}
                  saved={savedIds.has(outfit.id)}
                  onSave={
                    savedIds.has(outfit.id)
                      ? undefined
                      : () => void handleSave(outfit)
                  }
                />
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
