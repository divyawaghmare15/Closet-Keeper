'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Badge, CleanBadge } from '@/components/common/Badge';
import type { ClothingItem } from '@/types';

export function ItemCard({
  item,
  onToggleClean,
  onDelete,
  onEdit,
}: {
  item: ClothingItem;
  onToggleClean: () => void;
  onDelete: () => void;
  onEdit: () => void;
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);
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
              {[
                item.brand || null,
                item.price != null ? `₹${item.price}` : null,
                formatCostPerWear(item),
              ]
                .filter(Boolean)
                .join(' · ')}
            </p>
          )}
          <p className="mt-0.5 truncate text-xs text-muted">
            {formatLastWorn(item.lastWornDate)}
            {item.wearCount > 0 ? ` · ${item.wearCount} wear${item.wearCount === 1 ? '' : 's'}` : ''}
          </p>
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
            onClick={onEdit}
            className="flex-1 cursor-pointer rounded-xl bg-accent px-3 py-2.5 text-sm font-semibold text-white transition hover:brightness-110"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={onToggleClean}
            title={
              item.isClean
                ? 'Move to laundry (mark as in wash)'
                : 'Mark as clean and ready to wear'
            }
            className="cursor-pointer rounded-xl bg-surface px-3 py-2.5 text-sm font-semibold text-foreground ring-1 ring-border transition hover:bg-accent-soft"
          >
            {item.isClean ? 'To laundry' : 'Mark clean'}
          </button>
          <button
            type="button"
            onClick={() => setConfirmOpen(true)}
            aria-label={`Delete ${item.title}`}
            className="cursor-pointer rounded-xl px-3 py-2.5 text-sm font-semibold text-muted transition hover:bg-red-50 hover:text-red-700"
          >
            ✕
          </button>
        </div>
      </div>

      {confirmOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4 backdrop-blur-sm"
            role="presentation"
            onClick={() => setConfirmOpen(false)}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby={`delete-item-${item.id}`}
              className="w-full max-w-sm rounded-2xl border border-border/60 bg-surface-elevated p-6 shadow-xl"
              onClick={(event) => event.stopPropagation()}
            >
              <h3
                id={`delete-item-${item.id}`}
                className="font-display text-lg font-semibold text-foreground"
              >
                Delete this item?
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                Are you sure you want to delete{' '}
                <span className="font-semibold text-foreground">
                  {item.title}
                </span>
                ? This can&apos;t be undone.
              </p>
              <div className="mt-5 flex gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmOpen(false)}
                  className="flex-1 rounded-xl bg-surface px-4 py-2.5 text-sm font-semibold text-foreground ring-1 ring-border transition hover:bg-accent-soft/50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setConfirmOpen(false);
                    onDelete();
                  }}
                  className="flex-1 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </article>
  );
}

function formatLastWorn(lastWornDate: string | null): string {
  if (!lastWornDate) return 'Never worn';
  const worn = new Date(lastWornDate);
  if (Number.isNaN(worn.getTime())) return 'Never worn';
  const days = Math.floor(
    (Date.now() - worn.getTime()) / (1000 * 60 * 60 * 24),
  );
  if (days <= 0) return 'Worn today';
  if (days === 1) return 'Worn yesterday';
  if (days < 30) return `Worn ${days} days ago`;
  return `Last worn ${worn.toLocaleDateString()}`;
}

function formatCostPerWear(item: ClothingItem): string | null {
  if (item.price == null || item.price <= 0) return null;
  const wears = Math.max(item.wearCount ?? 0, item.lastWornDate ? 1 : 0);
  if (wears <= 0) return 'CPW pending';
  const cpw = item.price / wears;
  return `₹${cpw < 10 ? cpw.toFixed(1) : Math.round(cpw)}/wear`;
}
