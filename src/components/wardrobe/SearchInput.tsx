'use client';

import { useWardrobe } from '@/context/WardrobeContext';

export function SearchInput() {
  const { filters, setFilters } = useWardrobe();

  return (
    <label className="relative block w-full">
      <span className="sr-only">Search wardrobe</span>
      <svg
        viewBox="0 0 24 24"
        className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted"
        fill="none"
        aria-hidden
      >
        <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.75" />
        <path
          d="m16 16 3.5 3.5"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
        />
      </svg>
      <input
        type="search"
        value={filters.searchQuery}
        onChange={(event) =>
          setFilters((prev) => ({ ...prev, searchQuery: event.target.value }))
        }
        placeholder="Search name, brand, notes, color…"
        className="w-full rounded-2xl border border-border bg-surface-elevated py-3 pr-4 pl-10 text-sm outline-none transition placeholder:text-muted focus:border-accent focus:ring-2 focus:ring-accent/20"
      />
    </label>
  );
}
