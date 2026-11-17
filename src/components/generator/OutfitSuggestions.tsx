'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { OutfitCard } from '@/components/generator/OutfitCard';
import { OCCASIONS, SEASONS } from '@/lib/constants';
import { suggestOutfitsFromCloset } from '@/lib/suggestOutfits';
import type { ClothingItem, Occasion, Outfit, Season } from '@/types';

const PRIMARY_OCCASIONS: Occasion[] = [
  'Casual',
  'Office',
  'Formal',
  'Festive',
  'Party',
  'Travel',
];

function occasionFromUrl(): Occasion {
  if (typeof window === 'undefined') return 'Casual';
  const raw = new URLSearchParams(window.location.search).get('occasion');
  if (raw && (OCCASIONS as string[]).includes(raw)) return raw as Occasion;
  return 'Casual';
}

function seasonFromUrl(): Season | 'Any' {
  if (typeof window === 'undefined') return 'Any';
  const raw = new URLSearchParams(window.location.search).get('season');
  if (raw === 'Any') return 'Any';
  if (raw && (SEASONS as string[]).includes(raw)) return raw as Season;
  return 'Any';
}

export function OutfitSuggestions({
  items,
  onSave,
  defaultOccasion = 'Casual',
}: {
  items: ClothingItem[];
  onSave: (outfit: Outfit) => Promise<void> | void;
  defaultOccasion?: Occasion;
}) {
  const [occasion, setOccasion] = useState<Occasion>(defaultOccasion);
  const [season, setSeason] = useState<Season | 'Any'>('Any');
  const [cleanOnly, setCleanOnly] = useState(true);
  const [showMoreOccasions, setShowMoreOccasions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [source, setSource] = useState<'ai' | 'rules' | null>(null);
  const [suggestions, setSuggestions] = useState<Outfit[]>([]);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    setOccasion(occasionFromUrl());
    setSeason(seasonFromUrl());
  }, []);

  const cleanCount = items.filter((item) => item.isClean).length;
  const poolCount = cleanOnly ? cleanCount : items.length;
  const moreOccasions = OCCASIONS.filter(
    (value) => !PRIMARY_OCCASIONS.includes(value),
  );

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
        setError(
          'No looks found for that occasion. Try Casual, or add more tagged pieces.',
        );
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
      <div className="rounded-[1.75rem] border border-dashed border-border bg-surface-elevated/70 px-5 py-14 text-center sm:px-6 sm:py-16">
        <p className="font-display text-xl font-semibold">Nothing to style yet</p>
        <p className="mx-auto mt-2 max-w-sm text-sm text-muted">
          Add a few pieces to your closet. Looks only use clothes you own.
        </p>
        <Link
          href="/add-item"
          className="mt-6 inline-flex rounded-2xl bg-accent px-5 py-3 text-sm font-semibold text-white"
        >
          Add a piece
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5 sm:space-y-6">
      <section className="rounded-[1.5rem] border border-border/60 bg-surface-elevated p-3.5 shadow-sm sm:p-5">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-foreground">Dress for</p>
            <p className="text-xs text-muted">
              {poolCount} piece{poolCount === 1 ? '' : 's'} ready
              {cleanOnly && items.length - cleanCount > 0
                ? ` · ${items.length - cleanCount} in wash skipped`
                : ''}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setCleanOnly((prev) => !prev)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-[11px] font-semibold transition ${
              cleanOnly
                ? 'bg-accent-soft text-accent ring-1 ring-accent/25'
                : 'bg-surface text-muted ring-1 ring-border'
            }`}
          >
            {cleanOnly ? 'Clean only' : 'Include laundry'}
          </button>
        </div>

        <div className="mt-3 -mx-0.5 flex gap-1.5 overflow-x-auto px-0.5 pb-1 [scrollbar-width:none] sm:flex-wrap sm:overflow-visible [&::-webkit-scrollbar]:hidden">
          {PRIMARY_OCCASIONS.map((value) => {
            const active = occasion === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => setOccasion(value)}
                className={`shrink-0 rounded-full px-3.5 py-2 text-xs font-semibold transition ${
                  active
                    ? 'bg-accent text-white'
                    : 'bg-surface text-foreground ring-1 ring-border'
                }`}
              >
                {value}
              </button>
            );
          })}
          {!showMoreOccasions ? (
            <button
              type="button"
              onClick={() => setShowMoreOccasions(true)}
              className="shrink-0 rounded-full bg-surface px-3.5 py-2 text-xs font-semibold text-muted ring-1 ring-border"
            >
              More
            </button>
          ) : (
            moreOccasions.map((value) => {
              const active = occasion === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setOccasion(value)}
                  className={`shrink-0 rounded-full px-3.5 py-2 text-xs font-semibold transition ${
                    active
                      ? 'bg-accent text-white'
                      : 'bg-surface text-foreground ring-1 ring-border'
                  }`}
                >
                  {value}
                </button>
              );
            })
          )}
        </div>

        <div className="mt-3 flex items-center gap-2">
          <label className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-border/60 bg-surface px-3 py-2.5 text-sm">
            <span className="shrink-0 text-muted">Season</span>
            <select
              value={season}
              onChange={(event) =>
                setSeason(event.target.value as Season | 'Any')
              }
              className="min-w-0 flex-1 bg-transparent font-semibold outline-none"
            >
              <option value="Any">Any</option>
              {SEASONS.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>
        </div>

        <button
          type="button"
          disabled={loading || poolCount === 0}
          onClick={() => void handleSuggest()}
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-accent px-5 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:brightness-110 active:scale-[0.99] disabled:opacity-60"
        >
          {loading ? (
            <>
              <span
                className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white"
                aria-hidden
              />
              Styling…
            </>
          ) : suggestions.length > 0 ? (
            'Suggest again'
          ) : (
            'Suggest looks'
          )}
        </button>

        {error && <p className="mt-3 text-sm text-red-700">{error}</p>}
      </section>

      {loading && (
        <div className="rounded-[1.75rem] border border-border/60 bg-surface-elevated/80 px-5 py-12 text-center sm:px-6 sm:py-14">
          <p className="font-display text-xl font-semibold">
            Looking through your closet
          </p>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted">
            Pairing {occasion.toLowerCase()} looks from clothes you already own.
          </p>
        </div>
      )}

      {!loading && suggestions.length > 0 && (
        <div className="space-y-3 sm:space-y-4">
          <p className="text-xs text-muted sm:text-sm">
            {source === 'ai'
              ? 'AI styled these from your closet.'
              : 'Rule-based looks from your closet (AI unavailable).'}
          </p>
          <ul className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
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
