'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/common/Badge';
import { useWardrobe } from '@/context/WardrobeContext';
import { buildCapsuleItems, capsuleCoverage } from '@/lib/capsuleEngine';
import { OCCASIONS, SEASONS } from '@/lib/constants';
import type { ClothingItem, Occasion, Season } from '@/types';

export default function CapsulePage() {
  const { items, capsules, saveCapsule, deleteCapsule } = useWardrobe();
  const [title, setTitle] = useState('Weekend capsule');
  const [occasions, setOccasions] = useState<Occasion[]>(['Casual']);
  const [season, setSeason] = useState<Season>('All-Season');
  const [targetCount, setTargetCount] = useState(8);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [generated, setGenerated] = useState(false);

  const selectedItems = useMemo(
    () =>
      selectedIds
        .map((id) => items.find((item) => item.id === id))
        .filter((item): item is ClothingItem => item !== undefined),
    [items, selectedIds],
  );

  const coverage = capsuleCoverage(selectedItems, occasions);

  function toggleOccasion(occasion: Occasion) {
    setOccasions((prev) =>
      prev.includes(occasion)
        ? prev.filter((value) => value !== occasion)
        : [...prev, occasion],
    );
  }

  function generate() {
    const picks = buildCapsuleItems(items, occasions, season, targetCount);
    setSelectedIds(picks.map((item) => item.id));
    setGenerated(true);
  }

  function toggleItem(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id],
    );
  }

  async function handleSave() {
    if (!title.trim() || selectedIds.length === 0 || occasions.length === 0) {
      return;
    }

    await saveCapsule({
      id: crypto.randomUUID(),
      title: title.trim(),
      occasions,
      season,
      itemIds: selectedIds,
      targetCount,
      notes: notes.trim(),
      createdDate: new Date().toISOString(),
    });

    setGenerated(false);
    setSelectedIds([]);
    setNotes('');
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10">
      <div className="animate-fade-up mb-8 max-w-2xl">
        <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          Capsule builder
        </h1>
        <p className="mt-2 text-sm text-muted sm:text-base">
          Build a small, versatile set that covers your occasions for a season.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <section className="animate-fade-up space-y-5 rounded-[1.75rem] border border-border/60 bg-surface-elevated/90 p-5 shadow-sm sm:p-7">
          <label className="block space-y-1.5">
            <span className="text-sm font-semibold">Capsule name</span>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm outline-none focus:border-accent"
            />
          </label>

          <div>
            <p className="mb-2 text-sm font-semibold">Occasions to cover</p>
            <div className="flex flex-wrap gap-2">
              {OCCASIONS.map((occasion) => {
                const active = occasions.includes(occasion);
                return (
                  <button
                    key={occasion}
                    type="button"
                    onClick={() => toggleOccasion(occasion)}
                    className={`rounded-full px-3 py-1.5 text-sm font-medium ${
                      active
                        ? 'bg-accent text-white'
                        : 'bg-surface ring-1 ring-border'
                    }`}
                  >
                    {occasion}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="block space-y-1.5">
              <span className="text-sm font-semibold">Season</span>
              <select
                value={season}
                onChange={(event) => setSeason(event.target.value as Season)}
                className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm"
              >
                {SEASONS.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>

            <label className="block space-y-1.5">
              <span className="text-sm font-semibold">Target pieces</span>
              <input
                type="number"
                min={4}
                max={24}
                value={targetCount}
                onChange={(event) =>
                  setTargetCount(Number(event.target.value) || 8)
                }
                className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm"
              />
            </label>
          </div>

          <label className="block space-y-1.5">
            <span className="text-sm font-semibold">Notes</span>
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={3}
              className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm"
              placeholder="Trip, work week, packing notes…"
            />
          </label>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={generate}
              className="rounded-2xl bg-accent px-5 py-3 text-sm font-semibold text-white"
            >
              Generate capsule
            </button>
            {selectedIds.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  void handleSave();
                }}
                className="rounded-2xl bg-surface px-5 py-3 text-sm font-semibold ring-1 ring-border"
              >
                Save capsule
              </button>
            )}
          </div>

          {items.length === 0 && (
            <p className="text-sm text-muted">
              Add wardrobe items first.{' '}
              <Link href="/add-item" className="font-semibold text-accent">
                Add item
              </Link>
            </p>
          )}
        </section>

        <section className="animate-fade-up space-y-4" style={{ animationDelay: '80ms' }}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-2xl font-semibold tracking-tight">
              {generated ? 'Suggested set' : 'Preview'}
            </h2>
            <p className="text-sm text-muted">
              {selectedItems.length} piece
              {selectedItems.length === 1 ? '' : 's'}
            </p>
          </div>

          {occasions.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {coverage.covered.map((occasion) => (
                <Badge key={occasion} variant="clean">
                  Covers {occasion}
                </Badge>
              ))}
              {coverage.missing.map((occasion) => (
                <Badge key={occasion} variant="wash">
                  Missing {occasion}
                </Badge>
              ))}
            </div>
          )}

          {selectedItems.length === 0 ? (
            <div className="rounded-[1.75rem] border border-dashed border-border bg-surface-elevated/70 px-6 py-14 text-center text-sm text-muted">
              Generate a capsule to see a compact wardrobe suggestion.
            </div>
          ) : (
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {selectedItems.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => toggleItem(item.id)}
                    className="w-full overflow-hidden rounded-2xl border border-border/60 bg-surface-elevated text-left"
                  >
                    <div className="aspect-[4/5] bg-accent-soft/30">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="space-y-1 p-3">
                      <p className="truncate text-sm font-semibold">{item.title}</p>
                      <p className="truncate text-xs text-muted">
                        {item.category} · {item.color}
                      </p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {generated && (
            <div>
              <p className="mb-2 text-sm font-semibold">Add from wardrobe</p>
              <ul className="grid max-h-64 grid-cols-3 gap-2 overflow-y-auto sm:grid-cols-4">
                {items
                  .filter((item) => !selectedIds.includes(item.id))
                  .slice(0, 24)
                  .map((item) => (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => toggleItem(item.id)}
                        className="w-full overflow-hidden rounded-xl border border-border/50"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.imageUrl}
                          alt={item.title}
                          className="aspect-square w-full object-cover"
                        />
                      </button>
                    </li>
                  ))}
              </ul>
            </div>
          )}
        </section>
      </div>

      <section className="mt-12 space-y-4">
        <h2 className="font-display text-2xl font-semibold tracking-tight">
          Saved capsules
        </h2>
        {capsules.length === 0 ? (
          <p className="text-sm text-muted">No capsules saved yet.</p>
        ) : (
          <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {capsules.map((capsule) => {
              const capsuleItems = capsule.itemIds
                .map((id) => items.find((item) => item.id === id))
                .filter((item): item is ClothingItem => item !== undefined);

              return (
                <li
                  key={capsule.id}
                  className="rounded-[1.5rem] border border-border/60 bg-surface-elevated p-5"
                >
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-display text-xl font-semibold">
                        {capsule.title}
                      </h3>
                      <p className="text-sm text-muted">
                        {capsule.season} · {capsuleItems.length} pieces
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        void deleteCapsule(capsule.id);
                      }}
                      className="text-sm font-semibold text-muted hover:text-red-700"
                    >
                      Delete
                    </button>
                  </div>
                  <div className="mb-3 flex flex-wrap gap-1.5">
                    {capsule.occasions.map((occasion) => (
                      <Badge key={occasion} variant="category">
                        {occasion}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2 overflow-x-auto">
                    {capsuleItems.map((item) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        key={item.id}
                        src={item.imageUrl}
                        alt={item.title}
                        className="size-16 shrink-0 rounded-xl object-cover"
                      />
                    ))}
                  </div>
                  {capsule.notes && (
                    <p className="mt-3 text-sm text-muted">{capsule.notes}</p>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
