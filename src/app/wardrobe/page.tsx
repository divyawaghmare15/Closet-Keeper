'use client';

import { FilterBar } from '@/components/wardrobe/FilterBar';
import { SearchInput } from '@/components/wardrobe/SearchInput';
import { WardrobeGrid } from '@/components/wardrobe/WardrobeGrid';
import { useWardrobe } from '@/context/WardrobeContext';

function SkeletonCard() {
  return (
    <div className="overflow-hidden rounded-[1.5rem] border border-border/60 bg-surface-elevated">
      <div className="aspect-[4/5] animate-pulse bg-accent-soft/40" />
      <div className="space-y-2.5 p-4">
        <div className="h-4 w-3/4 animate-pulse rounded-full bg-border/60" />
        <div className="h-3 w-1/2 animate-pulse rounded-full bg-border/40" />
        <div className="flex gap-1.5">
          <div className="h-6 w-14 animate-pulse rounded-full bg-border/40" />
          <div className="h-6 w-12 animate-pulse rounded-full bg-border/40" />
        </div>
        <div className="flex gap-2 pt-1">
          <div className="h-9 flex-1 animate-pulse rounded-xl bg-border/40" />
          <div className="h-9 w-14 animate-pulse rounded-xl bg-border/40" />
        </div>
      </div>
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export default function WardrobePage() {
  const { filteredItems, items, loading, error, cloudEnabled } = useWardrobe();

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10">
      <div className="animate-fade-up mb-8">
        <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          Your wardrobe
        </h1>
        <p className="mt-2 text-sm text-muted sm:text-base">
          {loading
            ? 'Loading…'
            : `${filteredItems.length} shown${
                filteredItems.length !== items.length ? ` of ${items.length}` : ''
              }`}
          {cloudEnabled ? ' · cloud sync' : ' · local only'}
        </p>
        {error && (
          <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}
      </div>

      <div
        className="animate-fade-up mb-6 space-y-5"
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
