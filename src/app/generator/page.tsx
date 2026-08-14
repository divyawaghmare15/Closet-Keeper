'use client';

import { useMemo, useState } from 'react';
import { OutfitBuilder } from '@/components/generator/OutfitBuilder';
import { OutfitCard } from '@/components/generator/OutfitCard';
import { OutfitSuggestions } from '@/components/generator/OutfitSuggestions';
import { useWardrobe } from '@/context/WardrobeContext';
import type { Outfit } from '@/types';

type Tab = 'suggest' | 'make' | 'saved';

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
  const [tab, setTab] = useState<Tab>('suggest');

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
          Get AI looks from clothes you already own, or build one yourself.
        </p>
      </div>

      <div
        className="animate-fade-up mb-6 flex rounded-2xl bg-surface p-1 ring-1 ring-border"
        style={{ animationDelay: '40ms' }}
      >
        <button
          type="button"
          onClick={() => setTab('suggest')}
          className={`flex-1 rounded-xl px-2 py-2.5 text-sm font-semibold transition sm:px-3 ${
            tab === 'suggest' ? 'bg-accent text-white' : 'text-muted'
          }`}
        >
          Suggest
        </button>
        <button
          type="button"
          onClick={() => setTab('make')}
          className={`flex-1 rounded-xl px-2 py-2.5 text-sm font-semibold transition sm:px-3 ${
            tab === 'make' ? 'bg-accent text-white' : 'text-muted'
          }`}
        >
          Make
        </button>
        <button
          type="button"
          onClick={() => setTab('saved')}
          className={`flex-1 rounded-xl px-2 py-2.5 text-sm font-semibold transition sm:px-3 ${
            tab === 'saved' ? 'bg-accent text-white' : 'text-muted'
          }`}
        >
          Saved ({savedOutfits.length})
        </button>
      </div>

      {tab === 'suggest' ? (
        <div className="animate-fade-up" style={{ animationDelay: '60ms' }}>
          <OutfitSuggestions items={items} onSave={handleSaveOutfit} />
        </div>
      ) : tab === 'make' ? (
        <div className="animate-fade-up" style={{ animationDelay: '60ms' }}>
          <OutfitBuilder items={items} onSave={handleSaveOutfit} />
        </div>
      ) : resolvedSaved.length === 0 ? (
        <div className="rounded-[1.75rem] border border-dashed border-border bg-surface-elevated/70 px-6 py-16 text-center">
          <p className="font-display text-xl font-semibold">No saved outfits</p>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted">
            Ask AI for a look, or make one yourself, then save it here.
          </p>
          <button
            type="button"
            onClick={() => setTab('suggest')}
            className="mt-6 rounded-2xl bg-accent px-5 py-3 text-sm font-semibold text-white"
          >
            Suggest with AI
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

    </div>
  );
}
