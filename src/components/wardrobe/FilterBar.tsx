'use client';

import { useEffect, useId, useMemo, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
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
  const [sheetOpen, setSheetOpen] = useState(false);

  const laundryCount = items.filter((item) => !item.isClean).length;

  const advancedActiveCount = useMemo(() => {
    let count = 0;
    if (filters.category !== 'All') count += 1;
    if (filters.occasion !== 'All') count += 1;
    if (filters.season !== 'All') count += 1;
    if (filters.sortBy !== 'newest') count += 1;
    return count;
  }, [filters.category, filters.occasion, filters.season, filters.sortBy]);

  const hasActiveFilters =
    advancedActiveCount > 0 || filters.cleanStatus !== 'all';

  function clearAdvanced() {
    setFilters((prev) => ({
      ...prev,
      category: 'All',
      occasion: 'All',
      season: 'All',
      sortBy: 'newest',
    }));
  }

  function clearAll() {
    setFilters({
      category: 'All',
      occasion: 'All',
      season: 'All',
      cleanStatus: 'all',
      sortBy: 'newest',
      searchQuery: filters.searchQuery,
    });
  }

  return (
    <div className="space-y-3">
      {/* Always-visible status chips — primary mobile actions */}
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-0.5 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 [&::-webkit-scrollbar]:hidden">
        {(
          [
            { id: 'all', label: 'All' },
            { id: 'clean', label: 'Clean' },
            {
              id: 'laundry',
              label: laundryCount > 0 ? `Laundry ${laundryCount}` : 'Laundry',
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

        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-semibold transition sm:hidden ${
            advancedActiveCount > 0
              ? 'bg-accent text-white'
              : 'bg-surface text-foreground ring-1 ring-border'
          }`}
        >
          <FilterIcon />
          Filters
          {advancedActiveCount > 0 && (
            <span className="rounded-full bg-white/25 px-1.5 py-0.5 text-[10px] font-bold leading-none">
              {advancedActiveCount}
            </span>
          )}
        </button>

        <Link
          href="/pack"
          className="inline-flex shrink-0 items-center rounded-full bg-surface px-3.5 py-2 text-sm font-semibold text-foreground ring-1 ring-border transition hover:bg-accent-soft"
        >
          Pack
        </Link>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearAll}
            className="shrink-0 px-2 text-sm font-semibold text-muted transition hover:text-foreground sm:hidden"
          >
            Clear
          </button>
        )}
      </div>

      {/* Desktop: keep full filter rows visible */}
      <div className="hidden space-y-4 sm:block">
        <FilterRow label="Sort">
          {(
            [
              { id: 'newest', label: 'Newest' },
              { id: 'least-worn', label: 'Wear less often' },
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
              onClick={clearAll}
              className="text-sm font-semibold text-muted transition hover:text-foreground"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>

      {/* Mobile active filter summary chips */}
      {advancedActiveCount > 0 && (
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 sm:hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {filters.sortBy !== 'newest' && (
            <ActiveChip
              label={
                filters.sortBy === 'least-worn'
                  ? 'Rotate'
                  : filters.sortBy === 'recently-worn'
                    ? 'Recent'
                    : 'Newest'
              }
              onClear={() =>
                setFilters((prev) => ({ ...prev, sortBy: 'newest' }))
              }
            />
          )}
          {filters.category !== 'All' && (
            <ActiveChip
              label={filters.category}
              onClear={() =>
                setFilters((prev) => ({ ...prev, category: 'All' }))
              }
            />
          )}
          {filters.occasion !== 'All' && (
            <ActiveChip
              label={filters.occasion}
              onClear={() =>
                setFilters((prev) => ({ ...prev, occasion: 'All' }))
              }
            />
          )}
          {filters.season !== 'All' && (
            <ActiveChip
              label={filters.season}
              onClear={() =>
                setFilters((prev) => ({ ...prev, season: 'All' }))
              }
            />
          )}
        </div>
      )}

      {sheetOpen && (
        <MobileFilterSheet
          open={sheetOpen}
          onClose={() => setSheetOpen(false)}
          onClear={clearAdvanced}
          advancedActiveCount={advancedActiveCount}
          categoryFilters={CATEGORY_FILTERS}
          occasionFilters={OCCASION_FILTERS}
          seasonFilters={SEASON_FILTERS}
        />
      )}
    </div>
  );
}

function MobileFilterSheet({
  open,
  onClose,
  onClear,
  advancedActiveCount,
  categoryFilters,
  occasionFilters,
  seasonFilters,
}: {
  open: boolean;
  onClose: () => void;
  onClear: () => void;
  advancedActiveCount: number;
  categoryFilters: Array<Category | 'All'>;
  occasionFilters: Array<Occasion | 'All'>;
  seasonFilters: Array<Season | 'All'>;
}) {
  const { filters, setFilters } = useWardrobe();
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const sheet = (
    <div
      className="fixed inset-0 z-[60] flex items-end bg-foreground/40 sm:hidden"
      role="presentation"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="flex max-h-[min(88dvh,100%)] w-full flex-col overflow-hidden rounded-t-[1.5rem] bg-surface-elevated shadow-xl"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-border/60 px-5 py-3.5">
          <h2 id={titleId} className="font-display text-lg font-semibold">
            Filters
          </h2>
          <div className="flex items-center gap-3">
            {advancedActiveCount > 0 && (
              <button
                type="button"
                onClick={onClear}
                className="text-sm font-semibold text-muted"
              >
                Reset
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="text-sm font-semibold text-accent"
            >
              Done
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain px-5 py-4 [-webkit-overflow-scrolling:touch]">
          <SheetSection label="Sort">
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
          </SheetSection>

          <SheetSection label="Category">
            {categoryFilters.map((category) => (
              <FilterPill
                key={category}
                label={category}
                active={filters.category === category}
                onClick={() => setFilters((prev) => ({ ...prev, category }))}
              />
            ))}
          </SheetSection>

          <SheetSection label="Occasion">
            {occasionFilters.map((occasion) => (
              <FilterPill
                key={occasion}
                label={occasion}
                active={filters.occasion === occasion}
                onClick={() => setFilters((prev) => ({ ...prev, occasion }))}
              />
            ))}
          </SheetSection>

          <SheetSection label="Season">
            {seasonFilters.map((season) => (
              <FilterPill
                key={season}
                label={season}
                active={filters.season === season}
                onClick={() => setFilters((prev) => ({ ...prev, season }))}
              />
            ))}
          </SheetSection>
        </div>

        <div className="shrink-0 border-t border-border/60 px-5 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-2xl bg-accent py-3.5 text-sm font-semibold text-white"
          >
            Show results
          </button>
        </div>
      </div>
    </div>
  );

  if (typeof document === 'undefined') return sheet;
  return createPortal(sheet, document.body);
}

function SheetSection({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div>
      <p className="mb-2.5 text-xs font-semibold tracking-wider text-muted uppercase">
        {label}
      </p>
      <div className="flex flex-wrap gap-2">{children}</div>
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
      <div className="flex flex-wrap gap-2">{children}</div>
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
      className={`shrink-0 rounded-full px-3.5 py-2 text-sm font-semibold transition ${
        active
          ? 'bg-accent text-white'
          : 'bg-surface text-foreground ring-1 ring-border hover:bg-accent-soft'
      }`}
    >
      {label}
    </button>
  );
}

function ActiveChip({
  label,
  onClear,
}: {
  label: string;
  onClear: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClear}
      className="inline-flex shrink-0 items-center gap-1 rounded-full bg-accent-soft px-3 py-1.5 text-xs font-semibold text-accent"
    >
      {label}
      <span aria-hidden>×</span>
    </button>
  );
}

function FilterIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-3.5" fill="none" aria-hidden>
      <path
        d="M4 6h16M7 12h10M10 18h4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
