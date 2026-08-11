'use client';

import { Badge, CleanBadge } from '@/components/common/Badge';
import type { ClothingItem } from '@/types';

export function ItemCard({
  item,
  onToggleClean,
  onDelete,
}: {
  item: ClothingItem;
  onToggleClean: () => void;
  onDelete: () => void;
}) {
  const meta = [
    item.category,
    item.color,
    item.season !== 'All-Season' ? item.season : null,
    item.size || null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <article className="overflow-hidden rounded-[1.5rem] border border-border/60 bg-surface-elevated shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg">
      <div className="relative aspect-[4/5] overflow-hidden bg-accent-soft/40">
        {/* Fill the frame so contain never leaves empty side bars */}
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
        <div className="absolute top-3 left-3 z-20">
          <CleanBadge isClean={item.isClean} />
        </div>
      </div>
      <div className="space-y-3 p-4">
        <div>
          <h3 className="truncate text-base font-semibold text-foreground">
            {item.title}
          </h3>
          <p className="mt-0.5 truncate text-sm text-muted">{meta}</p>
          {(item.brand || item.price != null) && (
            <p className="mt-0.5 truncate text-xs text-muted">
              {[item.brand || null, item.price != null ? `₹${item.price}` : null]
                .filter(Boolean)
                .join(' · ')}
            </p>
          )}
        </div>
        {item.occasions.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {item.occasions.slice(0, 3).map((occasion) => (
              <Badge key={occasion} variant="category">
                {occasion}
              </Badge>
            ))}
          </div>
        )}
        {item.notes && (
          <p className="line-clamp-2 text-xs text-muted">{item.notes}</p>
        )}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleClean}
            className="flex-1 rounded-xl bg-surface px-3 py-2.5 text-sm font-semibold text-foreground ring-1 ring-border transition hover:bg-accent-soft"
          >
            {item.isClean ? 'Mark in wash' : 'Mark clean'}
          </button>
          <button
            type="button"
            onClick={onDelete}
            aria-label={`Delete ${item.title}`}
            className="rounded-xl px-3 py-2.5 text-sm font-semibold text-muted transition hover:bg-red-50 hover:text-red-700"
          >
            Delete
          </button>
        </div>
      </div>
    </article>
  );
}
