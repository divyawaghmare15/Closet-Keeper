'use client';

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
              onClick={onWear}
              className="rounded-xl bg-surface px-3.5 py-2 text-sm font-semibold ring-1 ring-border"
            >
              Mark worn
            </button>
          )}
          {saved && onRemove && (
            <button
              type="button"
              onClick={onRemove}
              className="rounded-xl px-3.5 py-2 text-sm font-semibold text-muted hover:bg-red-50 hover:text-red-700"
            >
              Remove
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
