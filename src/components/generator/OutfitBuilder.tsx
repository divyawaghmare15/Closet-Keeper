'use client';

import { useMemo, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { categoriesForGender, OCCASIONS } from '@/lib/constants';
import type { Category, ClothingItem, Occasion, Outfit } from '@/types';

export function OutfitBuilder({
  items,
  onSave,
}: {
  items: ClothingItem[];
  onSave: (outfit: Outfit) => Promise<void> | void;
}) {
  const { gender } = useAuth();
  const CATEGORIES = categoriesForGender(gender);
  const [title, setTitle] = useState('');
  const [occasion, setOccasion] = useState<Occasion>('Casual');
  const [categoryFilter, setCategoryFilter] = useState<Category | 'All'>('All');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const selectedItems = useMemo(
    () =>
      selectedIds
        .map((id) => items.find((item) => item.id === id))
        .filter((item): item is ClothingItem => Boolean(item)),
    [items, selectedIds],
  );

  const catalog = useMemo(() => {
    const list =
      categoryFilter === 'All'
        ? items
        : items.filter((item) => item.category === categoryFilter);
    return [...list].sort((a, b) => a.title.localeCompare(b.title));
  }, [items, categoryFilter]);

  function toggleItem(id: string) {
    setMessage('');
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id],
    );
  }

  function clearSelection() {
    setSelectedIds([]);
    setMessage('');
  }

  async function handleSave() {
    if (selectedItems.length === 0) {
      setMessage('Pick at least one item for your outfit.');
      return;
    }

    setSaving(true);
    setMessage('');
    try {
      const outfitTitle =
        title.trim() ||
        selectedItems
          .slice(0, 3)
          .map((item) => item.title)
          .join(' + ');

      await onSave({
        id: crypto.randomUUID(),
        title: outfitTitle,
        occasion,
        items: selectedItems,
        itemIds: selectedItems.map((item) => item.id),
        isFavorite: true,
        createdDate: new Date().toISOString(),
      });

      setTitle('');
      setSelectedIds([]);
      setMessage('Outfit saved.');
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : 'Could not save outfit.',
      );
    } finally {
      setSaving(false);
    }
  }

  if (items.length === 0) {
    return (
      <div className="rounded-[1.75rem] border border-dashed border-border bg-surface-elevated/70 px-6 py-16 text-center">
        <p className="font-display text-xl font-semibold">Wardrobe is empty</p>
        <p className="mx-auto mt-2 max-w-sm text-sm text-muted">
          Add a few pieces first, then come back to make an outfit.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[1.5rem] border border-border/60 bg-surface-elevated p-4 sm:p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-1.5">
            <span className="text-sm font-semibold">Outfit name</span>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="e.g. Friday office look"
              className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm"
            />
          </label>
          <div className="space-y-1.5">
            <p className="text-sm font-semibold">Occasion</p>
            <div className="flex flex-wrap gap-1.5">
              {OCCASIONS.map((value) => {
                const active = occasion === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setOccasion(value)}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                      active
                        ? 'bg-accent text-white'
                        : 'bg-surface ring-1 ring-border'
                    }`}
                  >
                    {value}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-4">
          <div className="mb-2 flex items-center justify-between gap-3">
            <p className="text-sm font-semibold">
              Selected ({selectedItems.length})
            </p>
            {selectedItems.length > 0 && (
              <button
                type="button"
                onClick={clearSelection}
                className="text-xs font-semibold text-muted hover:text-red-700"
              >
                Clear
              </button>
            )}
          </div>
          {selectedItems.length === 0 ? (
            <p className="rounded-xl bg-surface px-3 py-4 text-sm text-muted ring-1 ring-border">
              Tap items below to build your look.
            </p>
          ) : (
            <ul className="flex gap-2 overflow-x-auto pb-1">
              {selectedItems.map((item) => (
                <li key={item.id} className="w-20 shrink-0">
                  <button
                    type="button"
                    onClick={() => toggleItem(item.id)}
                    className="w-full overflow-hidden rounded-xl ring-2 ring-accent"
                    title={`Remove ${item.title}`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="aspect-[3/4] w-full object-contain bg-white"
                    />
                  </button>
                  <p className="mt-1 truncate text-[11px] text-muted">
                    {item.category}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={saving || selectedItems.length === 0}
            onClick={() => void handleSave()}
            className="rounded-2xl bg-accent px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Save outfit'}
          </button>
          {message && (
            <p
              className={`text-sm ${
                message === 'Outfit saved.' ? 'text-accent' : 'text-red-700'
              }`}
            >
              {message}
            </p>
          )}
        </div>
      </section>

      <section>
        <div className="mb-3 flex flex-wrap gap-1.5">
          <FilterChip
            label="All"
            active={categoryFilter === 'All'}
            onClick={() => setCategoryFilter('All')}
          />
          {CATEGORIES.map((category) => (
            <FilterChip
              key={category}
              label={category}
              active={categoryFilter === category}
              onClick={() => setCategoryFilter(category)}
            />
          ))}
        </div>

        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {catalog.map((item) => {
            const selected = selectedIds.includes(item.id);
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => toggleItem(item.id)}
                  className={`w-full overflow-hidden rounded-2xl border text-left transition ${
                    selected
                      ? 'border-accent ring-2 ring-accent'
                      : 'border-border/60 hover:border-accent/50'
                  }`}
                >
                  <div className="relative aspect-[3/4] bg-white">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="h-full w-full object-contain"
                    />
                    {selected && (
                      <span className="absolute top-2 right-2 rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold text-white">
                        ✓
                      </span>
                    )}
                  </div>
                  <div className="space-y-0.5 px-2.5 py-2">
                    <p className="truncate text-sm font-semibold">{item.title}</p>
                    <p className="truncate text-xs text-muted">
                      {item.category}
                      {!item.isClean ? ' · In wash' : ''}
                    </p>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

function FilterChip({
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
      className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
        active ? 'bg-accent text-white' : 'bg-surface ring-1 ring-border'
      }`}
    >
      {label}
    </button>
  );
}
