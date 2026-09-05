'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useWardrobe } from '@/context/WardrobeContext';
import { categoriesForGender, OCCASIONS, SEASONS } from '@/lib/constants';
import type { Category, FilterState, Occasion, Season } from '@/types';

export function FilterBar() {
  const { filters, setFilters, items } = useWardrobe();
  const { gender } = useAuth();
  const genderCategories = categoriesForGender(gender);
  const CATEGORY_FILTERS: Array<Category | 'All'> = ['All', ...genderCategories];
  const OCCASION_FILTERS: Array<Occasion | 'All'> = ['All', ...OCCASIONS];
  const SEASON_FILTERS: Array<Season | 'All'> = ['All', ...SEASONS];

  const laundryCount = items.filter((item) => !item.isClean).length;

  const hasActiveFilters =
    filters.category !== 'All' ||
    filters.occasion !== 'All' ||
    filters.season !== 'All' ||
    filters.cleanStatus !== 'all' ||
    filters.sortBy !== 'newest';

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {(
          [
            { id: 'all', label: 'All pieces' },
            { id: 'clean', label: 'Clean' },
            {
              id: 'laundry',
              label: laundryCount > 0 ? `Laundry (${laundryCount})` : 'Laundry',
            },
          ] as const
        ).map((option) => (
          <FilterPill
            key={option.id}
            label={option.label}
            active={filters.cleanStatus === option.id}
            onClick={() =>
              setFilters((prev) => ({ ...prev, cleanStatus: option.id }))
            }
          />
        ))}
        <Link
          href="/pack"
          className="rounded-full bg-surface px-3.5 py-1.5 text-sm font-medium text-foreground ring-1 ring-border transition hover:bg-accent-soft"
        >
          Packing list
        </Link>
      </div>

      <FilterRow label="Sort">
        {(
          [
            { id: 'newest', label: 'Newest' },
            { id: 'least-worn', label: 'Wear less often (rotate)' },
            { id: 'recently-worn', label: 'Recently worn' },
          ] as const
        ).map((option) => (
          <FilterPill
            key={option.id}
            label={option.label}
            active={filters.sortBy === option.id}
            onClick={() =>
              setFilters((prev) => ({
                ...prev,
                sortBy: option.id as FilterState['sortBy'],
              }))
            }
          />
        ))}
      </FilterRow>

      <FilterRow label="Category">
        {CATEGORY_FILTERS.map((category) => (
          <FilterPill
            key={category}
            label={category}
            active={filters.category === category}
            onClick={() => setFilters((prev) => ({ ...prev, category }))}
          />
        ))}
      </FilterRow>

      <FilterRow label="Occasion">
        {OCCASION_FILTERS.map((occasion) => (
          <FilterPill
            key={occasion}
            label={occasion}
            active={filters.occasion === occasion}
            onClick={() => setFilters((prev) => ({ ...prev, occasion }))}
          />
        ))}
      </FilterRow>

      <FilterRow label="Season">
        {SEASON_FILTERS.map((season) => (
          <FilterPill
            key={season}
            label={season}
            active={filters.season === season}
            onClick={() => setFilters((prev) => ({ ...prev, season }))}
          />
        ))}
      </FilterRow>

      {hasActiveFilters && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() =>
              setFilters({
                category: 'All',
                occasion: 'All',
                season: 'All',
                cleanStatus: 'all',
                sortBy: 'newest',
                searchQuery: filters.searchQuery,
              })
            }
            className="text-sm font-semibold text-muted transition hover:text-foreground"
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
}

function FilterRow({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="min-w-0">
      <p className="mb-2 text-xs font-semibold tracking-wider text-muted uppercase">
        {label}
      </p>
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 [&::-webkit-scrollbar]:hidden">
        {children}
      </div>
    </div>
  );
}

function FilterPill({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
        active
          ? 'bg-accent text-white'
          : 'bg-surface text-foreground ring-1 ring-border hover:bg-accent-soft'
      }`}
    >
      {label}
    </button>
  );
}
