'use client';

import { useState } from 'react';
import Link from 'next/link';
import { EditItemSheet } from '@/components/wardrobe/EditItemSheet';
import { ItemCard } from '@/components/wardrobe/ItemCard';
import { useWardrobe } from '@/context/WardrobeContext';
import type { ClothingItem } from '@/types';

export function WardrobeGrid() {
  const { filteredItems, filters, toggleCleanStatus, deleteItem } =
    useWardrobe();
  const [editingItem, setEditingItem] = useState<ClothingItem | null>(null);

  const hasActiveFilters =
    filters.category !== 'All' ||
    filters.occasion !== 'All' ||
    filters.season !== 'All' ||
    filters.isCleanOnly ||
    filters.searchQuery.trim() !== '';

  if (filteredItems.length === 0) {
    return (
      <div className="rounded-[1.75rem] border border-dashed border-border bg-surface-elevated/70 px-6 py-16 text-center">
        <p className="font-display text-xl font-semibold text-foreground">
          {hasActiveFilters ? 'Nothing matches yet' : 'Your closet is empty'}
        </p>
        <p className="mx-auto mt-2 max-w-sm text-sm text-muted">
          {hasActiveFilters
            ? 'Loosen filters or search, or add a new piece.'
            : 'Add a few pieces and your wardrobe will live here.'}
        </p>
        <Link
          href="/add-item"
          className="mt-6 inline-flex rounded-2xl bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110"
        >
          Add item
        </Link>
      </div>
    );
  }

  return (
    <>
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
        {filteredItems.map((item, index) => (
          <li
            key={item.id}
            className="animate-fade-up"
            style={{ animationDelay: `${index * 40}ms` }}
          >
            <ItemCard
              item={item}
              onToggleClean={() => {
                void toggleCleanStatus(item.id);
              }}
              onDelete={() => {
                void deleteItem(item.id);
              }}
              onEdit={() => setEditingItem(item)}
            />
          </li>
        ))}
      </ul>

      {editingItem && (
        <EditItemSheet
          item={editingItem}
          onClose={() => setEditingItem(null)}
        />
      )}
    </>
  );
}
