'use client';

import { useEffect } from 'react';
import { FilterBar } from '@/components/wardrobe/FilterBar';
import { SearchInput } from '@/components/wardrobe/SearchInput';
import { WardrobeGrid } from '@/components/wardrobe/WardrobeGrid';
import { useWardrobe } from '@/context/WardrobeContext';

function SkeletonCard() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border/60 bg-surface-elevated sm:rounded-[1.5rem]">
      <div className="aspect-[3/4] animate-pulse bg-accent-soft/40 sm:aspect-[4/5]" />
      <div className="space-y-2 p-2.5 sm:space-y-2.5 sm:p-4">
        <div className="h-3.5 w-3/4 animate-pulse rounded-full bg-border/60 sm:h-4" />
        <div className="h-3 w-1/2 animate-pulse rounded-full bg-border/40" />
        <div className="flex gap-1.5 pt-1">
          <div className="h-8 flex-1 animate-pulse rounded-xl bg-border/40" />
          <div className="h-8 w-12 animate-pulse rounded-xl bg-border/40" />
        </div>
      </div>
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export default function WardrobePage() {
  const {
    filteredItems,
    items,
    loading,
    error,
    cloudEnabled,
    filters,
    setFilters,
  } = useWardrobe();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('laundry') === '1') {
      setFilters((prev) => ({ ...prev, cleanStatus: 'laundry' }));
    }
  }, [setFilters]);

  return (
    <div className="mx-auto w-full max-w-7xl px-3 py-4 sm:px-6 sm:py-8 lg:px-10 lg:py-10">
      <div className="animate-fade-up mb-4 flex items-end justify-between gap-3 sm:mb-8">
        <div className="min-w-0">
          <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-4xl">
            {filters.cleanStatus === 'laundry' ? 'Laundry' : 'Closet'}
          </h1>
          <p className="mt-1 text-xs text-muted sm:mt-2 sm:text-base">
            {loading
              ? 'Loading…'
              : `${filteredItems.length}${
                  filteredItems.length !== items.length
                    ? ` of ${items.length}`
                    : ''
                } pieces`}
            <span className="hidden sm:inline">
              {cloudEnabled ? ' · cloud sync' : ' · local only'}
            </span>
          </p>
        </div>
      </div>

      {error && (
        <p className="mb-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div
        className="animate-fade-up sticky top-0 z-20 -mx-3 mb-3 space-y-2.5 border-b border-border/40 bg-[color-mix(in_srgb,var(--surface)_92%,transparent)] px-3 py-2.5 backdrop-blur-md sm:static sm:mx-0 sm:mb-6 sm:space-y-5 sm:border-0 sm:bg-transparent sm:px-0 sm:py-0 sm:backdrop-blur-none"
        style={{ animationDelay: '60ms' }}
      >
        <SearchInput />
        <FilterBar />
      </div>

      <div className="animate-fade-up" style={{ animationDelay: '120ms' }}>
        {loading ? <SkeletonGrid /> : <WardrobeGrid />}
      </div>
    </div>
  );
}
