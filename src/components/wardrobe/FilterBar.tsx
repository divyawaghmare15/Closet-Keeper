'use client';

import type { ReactNode } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useWardrobe } from '@/context/WardrobeContext';
import { categoriesForGender, OCCASIONS, SEASONS } from '@/lib/constants';
import type { Category, Occasion, Season } from '@/types';

export function FilterBar() {
  const { filters, setFilters } = useWardrobe();
  const { gender } = useAuth();
  const genderCategories = categoriesForGender(gender);
  const CATEGORY_FILTERS: Array<Category | 'All'> = ['All', ...genderCategories];
  const OCCASION_FILTERS: Array<Occasion | 'All'> = ['All', ...OCCASIONS];
  const SEASON_FILTERS: Array<Season | 'All'> = ['All', ...SEASONS];

  const hasActiveFilters =
    filters.category !== 'All' ||
    filters.occasion !== 'All' ||
    filters.season !== 'All' ||
    filters.isCleanOnly;

  return (
    <div className="space-y-4">
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

      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() =>
            setFilters((prev) => ({
              ...prev,
              isCleanOnly: !prev.isCleanOnly,
            }))
          }
          className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
            filters.isCleanOnly
              ? 'bg-accent text-white'
              : 'bg-surface text-foreground ring-1 ring-border hover:bg-accent-soft'
          }`}
        >
          Clean only
        </button>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={() =>
              setFilters({
                category: 'All',
                occasion: 'All',
                season: 'All',
                isCleanOnly: false,
                searchQuery: filters.searchQuery,
              })
            }
            className="text-sm font-semibold text-muted transition hover:text-foreground"
          >
            Clear filters
          </button>
        )}
      </div>
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
