'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Badge } from '@/components/common/Badge';
import type { Outfit } from '@/types';

export function OutfitCard({
  outfit,
  index = 0,
  saved = false,
  onSave,
  onRemove,
  onToggleFavorite,
  onWear,
}: {
  outfit: Outfit;
  index?: number;
  saved?: boolean;
  onSave?: () => void;
  onRemove?: () => void;
  onToggleFavorite?: () => void;
  onWear?: () => void;
}) {
  const [wearConfirmOpen, setWearConfirmOpen] = useState(false);
  const [removeConfirmOpen, setRemoveConfirmOpen] = useState(false);

  return (
    <article
      className="animate-fade-up overflow-hidden rounded-[1.75rem] border border-border/60 bg-surface-elevated shadow-sm"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div
        className={`grid min-h-[200px] ${
          outfit.items.length === 1
            ? 'grid-cols-1'
            : outfit.items.length === 2
              ? 'grid-cols-2'
              : 'grid-cols-2 sm:grid-cols-3'
        }`}
      >
        {outfit.items.map((item) => (
          <div
            key={item.id}
            className="relative aspect-[3/4] overflow-hidden bg-accent-soft/30 sm:aspect-auto sm:min-h-[220px]"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.imageUrl}
              alt=""
              aria-hidden
              className="absolute inset-0 h-full w-full scale-110 object-cover blur-xl"
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.imageUrl}
              alt={item.title}
              className="relative z-10 h-full w-full object-contain"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-foreground/60 to-transparent px-3 pb-3 pt-10">
              <p className="truncate text-sm font-semibold text-white">
                {item.title}
              </p>
              <p className="truncate text-xs text-white/80">
                {item.category}
                {item.brand ? ` · ${item.brand}` : ''}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-3 px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate font-display text-lg font-semibold tracking-tight">
              {outfit.title}
            </h3>
            <p className="text-sm text-muted">
              {outfit.items.length} piece
              {outfit.items.length === 1 ? '' : 's'}
              {typeof outfit.matchScore === 'number' && !outfit.reason
                ? ` · score ${Math.round(outfit.matchScore)}`
                : ''}
            </p>
            {outfit.reason && (
              <p className="mt-1 text-sm leading-relaxed text-muted">
                {outfit.reason}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {outfit.isFavorite && <Badge variant="category">Favorite</Badge>}
            <Badge variant="neutral">{outfit.occasion}</Badge>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {!saved && onSave && (
            <button
              type="button"
              onClick={onSave}
              className="rounded-xl bg-accent px-3.5 py-2 text-sm font-semibold text-white"
            >
              Save outfit
            </button>
          )}
          {saved && onToggleFavorite && (
            <button
              type="button"
              onClick={onToggleFavorite}
              className="rounded-xl bg-surface px-3.5 py-2 text-sm font-semibold ring-1 ring-border"
            >
              {outfit.isFavorite ? 'Unfavorite' : 'Favorite'}
            </button>
          )}
          {onWear && (
            <button
              type="button"
              onClick={() => setWearConfirmOpen(true)}
              className="rounded-xl bg-surface px-3.5 py-2 text-sm font-semibold ring-1 ring-border"
            >
              I wore this
            </button>
          )}
          <button
            type="button"
            onClick={() => void shareOutfit(outfit)}
            className="rounded-xl bg-surface px-3.5 py-2 text-sm font-semibold ring-1 ring-border"
          >
            Share
          </button>
          {saved && onRemove && (
            <button
              type="button"
              onClick={() => setRemoveConfirmOpen(true)}
              className="rounded-xl px-3.5 py-2 text-sm font-semibold text-muted hover:bg-red-50 hover:text-red-700"
            >
              Remove
            </button>
          )}
        </div>
      </div>

      {wearConfirmOpen &&
        onWear &&
        createPortal(
          <ConfirmDialog
            title="Mark this look as worn?"
            body={`This will move ${outfit.items.length} piece${outfit.items.length === 1 ? '' : 's'} to laundry (In wash) and update last worn.`}
            confirmLabel="Yes, I wore it"
            onCancel={() => setWearConfirmOpen(false)}
            onConfirm={() => {
              setWearConfirmOpen(false);
              onWear();
            }}
          />,
          document.body,
        )}

      {removeConfirmOpen &&
        onRemove &&
        createPortal(
          <ConfirmDialog
            title="Remove this outfit?"
            body="The saved look will be deleted. Your clothing items stay in the wardrobe."
            confirmLabel="Remove"
            danger
            onCancel={() => setRemoveConfirmOpen(false)}
            onConfirm={() => {
              setRemoveConfirmOpen(false);
              onRemove();
            }}
          />,
          document.body,
        )}
    </article>
  );
}

function ConfirmDialog({
  title,
  body,
  confirmLabel,
  danger = false,
  onCancel,
  onConfirm,
}: {
  title: string;
  body: string;
  confirmLabel: string;
  danger?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4 backdrop-blur-sm"
      role="presentation"
      onClick={onCancel}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-sm rounded-2xl border border-border/60 bg-surface-elevated p-6 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <h3 className="font-display text-lg font-semibold text-foreground">
          {title}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-muted">{body}</p>
        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-xl bg-surface px-4 py-2.5 text-sm font-semibold text-foreground ring-1 ring-border transition hover:bg-accent-soft/50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition ${
              danger
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-accent hover:brightness-110'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

async function shareOutfit(outfit: Outfit) {
  const lines = [
    `ClosetKeeper look: ${outfit.title}`,
    `Occasion: ${outfit.occasion}`,
    ...outfit.items.map((item) => `• ${item.title} (${item.category})`),
  ];
  if (outfit.reason) lines.push(outfit.reason);
  const text = lines.join('\n');

  try {
    if (navigator.share) {
      await navigator.share({ title: outfit.title, text });
      return;
    }
  } catch {
    // fall through to clipboard
  }

  try {
    await navigator.clipboard.writeText(text);
  } catch {
    // ignore
  }
}
