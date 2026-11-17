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
    <div className="mx-auto w-full max-w-7xl px-3 pb-6 pt-4 sm:px-6 sm:pb-8 sm:pt-8 lg:px-10 lg:pt-10">
      <div className="animate-fade-up mb-4 sm:mb-6">
        <p className="text-[11px] font-semibold tracking-[0.14em] text-accent uppercase">
          ClosetKeeper
        </p>
        <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight sm:text-4xl">
          Looks
        </h1>
        <p className="mt-1 text-sm text-muted sm:text-base">
          Suggest, make, or rewear — from clothes you already own.
        </p>
      </div>

      <div
        className="animate-fade-up sticky top-0 z-20 -mx-3 mb-5 border-b border-border/40 bg-surface/90 px-3 py-2 backdrop-blur-md sm:static sm:mx-0 sm:mb-6 sm:border-0 sm:bg-transparent sm:px-0 sm:py-0 sm:backdrop-blur-none"
        style={{ animationDelay: '40ms' }}
      >
        <div className="flex rounded-2xl bg-surface p-1 ring-1 ring-border">
          {(
            [
              { id: 'suggest', label: 'Suggest' },
              { id: 'make', label: 'Make' },
              { id: 'saved', label: `Saved${resolvedSaved.length ? ` · ${resolvedSaved.length}` : ''}` },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`flex-1 rounded-xl px-2 py-2.5 text-sm font-semibold transition sm:px-3 ${
                tab === item.id ? 'bg-accent text-white shadow-sm' : 'text-muted'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
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
        <div className="rounded-[1.75rem] border border-dashed border-border bg-surface-elevated/70 px-5 py-14 text-center sm:px-6 sm:py-16">
          <p className="font-display text-xl font-semibold">No saved looks yet</p>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted">
            Get an AI suggestion or build one yourself, then save it here for
            busy mornings.
          </p>
          <div className="mt-6 flex flex-col items-stretch justify-center gap-2 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={() => setTab('suggest')}
              className="rounded-2xl bg-accent px-5 py-3 text-sm font-semibold text-white"
            >
              Suggest a look
            </button>
            <button
              type="button"
              onClick={() => setTab('make')}
              className="rounded-2xl px-5 py-3 text-sm font-semibold text-foreground ring-1 ring-border"
            >
              Make your own
            </button>
          </div>
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
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
