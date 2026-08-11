'use client';

import { FilterBar } from '@/components/wardrobe/FilterBar';
import { SearchInput } from '@/components/wardrobe/SearchInput';
import { WardrobeGrid } from '@/components/wardrobe/WardrobeGrid';
import { useWardrobe } from '@/context/WardrobeContext';

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
        {loading ? (
          <div className="rounded-[1.75rem] border border-dashed border-border bg-surface-elevated/70 px-6 py-16 text-center text-sm text-muted">
            Loading your closet…
          </div>
        ) : (
          <WardrobeGrid />
        )}
      </div>
    </div>
  );
}
