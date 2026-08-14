'use client';

import { useMemo, useState } from 'react';
import { MiscCardTile } from '@/components/misc/MiscCardTile';
import { MiscCardSheet } from '@/components/misc/MiscCardSheet';
import { useWardrobe } from '@/context/WardrobeContext';
import { MISC_SUGGESTIONS } from '@/lib/constants';
import type { MiscCard } from '@/types';

export default function MiscPage() {
  const { miscCards, saveMiscCard, deleteMiscCard } = useWardrobe();
  const [editing, setEditing] = useState<{
    card: MiscCard | null;
    isNew: boolean;
  } | null>(null);
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return miscCards;
    return miscCards.filter((card) => {
      const haystack = [
        card.title,
        card.notes,
        ...card.pieces.map((piece) => `${piece.title} ${piece.notes}`),
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(needle);
    });
  }, [miscCards, query]);

  const usedTitles = new Set(miscCards.map((card) => card.title.toLowerCase()));
  const suggestions = MISC_SUGGESTIONS.filter(
    (title) => !usedTitles.has(title.toLowerCase()),
  );

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10">
      <div className="animate-fade-up mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-xl">
          <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            Extras
          </h1>
          <p className="mt-2 text-sm text-muted sm:text-base">
            Cards for everything else — sandals, caps, bags, jewelry. Add a
            card, drop in photos, and edit anytime.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setEditing({ card: null, isNew: true })}
          className="rounded-2xl bg-accent px-5 py-3 text-sm font-semibold text-white shadow-sm"
        >
          Add card
        </button>
      </div>

      <div className="animate-fade-up mb-6" style={{ animationDelay: '40ms' }}>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search extras…"
          className="w-full max-w-md rounded-2xl border border-border bg-surface-elevated px-4 py-3 text-sm"
        />
      </div>

      {suggestions.length > 0 && (
        <div
          className="animate-fade-up mb-8"
          style={{ animationDelay: '60ms' }}
        >
          <p className="mb-2 text-sm font-semibold">Quick start</p>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((title) => (
              <button
                key={title}
                type="button"
                onClick={() =>
                  setEditing({
                    isNew: true,
                    card: {
                      id: crypto.randomUUID(),
                      title,
                      coverImageUrl: '',
                      notes: '',
                      pieces: [],
                      createdDate: new Date().toISOString(),
                      updatedDate: new Date().toISOString(),
                    },
                  })
                }
                className="rounded-full bg-surface px-3 py-1.5 text-xs font-semibold ring-1 ring-border hover:bg-accent-soft"
              >
                {title}
              </button>
            ))}
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="rounded-[1.75rem] border border-dashed border-border bg-surface-elevated/70 px-6 py-16 text-center">
          <p className="font-display text-xl font-semibold">No extras yet</p>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted">
            Start with “Sandals I have” or “Caps I have”, then add photos and
            names inside the card.
          </p>
          <button
            type="button"
            onClick={() => setEditing({ card: null, isNew: true })}
            className="mt-6 rounded-2xl bg-accent px-5 py-3 text-sm font-semibold text-white"
          >
            Create first card
          </button>
        </div>
      ) : (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map((card) => (
            <li key={card.id}>
              <MiscCardTile
                card={card}
                onOpen={() => setEditing({ card, isNew: false })}
              />
            </li>
          ))}
        </ul>
      )}

      {editing && (
        <MiscCardSheet
          card={
            editing.card
              ? (miscCards.find((card) => card.id === editing.card?.id) ??
                editing.card)
              : null
          }
          isNew={editing.isNew}
          onClose={() => setEditing(null)}
          onSave={async (card) => {
            const saved = await saveMiscCard(card);
            setEditing({ card: saved, isNew: false });
            return saved;
          }}
          onDelete={
            editing.isNew
              ? undefined
              : async (id) => {
                  await deleteMiscCard(id);
                  setEditing(null);
                }
          }
        />
      )}
    </div>
  );
}
