'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { OutfitBuilder } from '@/components/generator/OutfitBuilder';
import { OutfitCard } from '@/components/generator/OutfitCard';
import { useWardrobe } from '@/context/WardrobeContext';
import type { Outfit } from '@/types';

type Tab = 'make' | 'saved';

export default function GeneratorPage() {
  const {
    items,
    savedOutfits,
    saveOutfit,
    deleteOutfit,
    toggleOutfitFavorite,
    markItemsWorn,
    resolveOutfit,
  } = useWardrobe();
  const [tab, setTab] = useState<Tab>('make');

  const resolvedSaved = useMemo(
    () =>
      savedOutfits
        .map(resolveOutfit)
        .filter((outfit) => outfit.items.length > 0)
        .sort((a, b) => Number(b.isFavorite) - Number(a.isFavorite)),
    [savedOutfits, resolveOutfit],
  );

  async function handleSaveOutfit(outfit: Outfit) {
    await saveOutfit(outfit);
    setTab('saved');
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10">
      <div className="animate-fade-up mb-8 max-w-xl">
        <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          Outfits
        </h1>
        <p className="mt-2 text-sm text-muted sm:text-base">
          Pick pieces from your wardrobe, build a look, and save it for later.
        </p>
      </div>

      <div
        className="animate-fade-up mb-6 flex rounded-2xl bg-surface p-1 ring-1 ring-border"
        style={{ animationDelay: '40ms' }}
      >
        <button
          type="button"
          onClick={() => setTab('make')}
          className={`flex-1 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
            tab === 'make' ? 'bg-accent text-white' : 'text-muted'
          }`}
        >
          Make outfit
        </button>
        <button
          type="button"
          onClick={() => setTab('saved')}
          className={`flex-1 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
            tab === 'saved' ? 'bg-accent text-white' : 'text-muted'
          }`}
        >
          Saved ({savedOutfits.length})
        </button>
      </div>

      {tab === 'make' ? (
        <div className="animate-fade-up" style={{ animationDelay: '60ms' }}>
          <OutfitBuilder items={items} onSave={handleSaveOutfit} />
        </div>
      ) : resolvedSaved.length === 0 ? (
        <div className="rounded-[1.75rem] border border-dashed border-border bg-surface-elevated/70 px-6 py-16 text-center">
          <p className="font-display text-xl font-semibold">No saved outfits</p>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted">
            Make an outfit from your wardrobe, then save it here.
          </p>
          <button
            type="button"
            onClick={() => setTab('make')}
            className="mt-6 rounded-2xl bg-accent px-5 py-3 text-sm font-semibold text-white"
          >
            Make outfit
          </button>
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {resolvedSaved.map((outfit, index) => (
            <li key={outfit.id}>
              <OutfitCard
                outfit={outfit}
                index={index}
                saved
                onToggleFavorite={() => {
                  void toggleOutfitFavorite(outfit.id);
                }}
                onRemove={() => {
                  void deleteOutfit(outfit.id);
                }}
                onWear={() => {
                  void markItemsWorn(outfit.itemIds);
                }}
              />
            </li>
          ))}
        </ul>
      )}

      {tab === 'make' && items.length === 0 && (
        <div className="mt-4 flex justify-center gap-3">
          <Link
            href="/add-item"
            className="rounded-2xl bg-accent px-5 py-3 text-sm font-semibold text-white"
          >
            Add item
          </Link>
        </div>
      )}
    </div>
  );
}
