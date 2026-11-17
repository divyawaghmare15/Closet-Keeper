'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { CleanBadge } from '@/components/common/Badge';
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
  const meta = [item.category, item.color].filter(Boolean).join(' · ');

  return (
    <article className="group overflow-hidden rounded-2xl border border-border/60 bg-surface-elevated shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-md sm:rounded-[1.5rem]">
      <button
        type="button"
        onClick={onEdit}
        className="relative block w-full aspect-[3/4] overflow-hidden bg-accent-soft/40 text-left sm:aspect-[4/5]"
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
        <div className="absolute top-2 left-2 z-20 sm:top-3 sm:left-3">
          <CleanBadge isClean={item.isClean} />
        </div>
      </button>

      <div className="space-y-2 p-2.5 sm:space-y-3 sm:p-4">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold text-foreground sm:text-base">
            {item.title}
          </h3>
          <p className="mt-0.5 truncate text-xs text-muted sm:text-sm">{meta}</p>
          <p className="mt-0.5 hidden truncate text-xs text-muted sm:block">
            {formatLastWorn(item.lastWornDate)}
            {item.wearCount > 0
              ? ` · ${item.wearCount} wear${item.wearCount === 1 ? '' : 's'}`
              : ''}
          </p>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={onEdit}
            className="flex-1 rounded-xl bg-accent px-2.5 py-2 text-xs font-semibold text-white transition hover:brightness-110 sm:px-3 sm:py-2.5 sm:text-sm"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={onToggleClean}
            title={
              item.isClean
                ? 'Move to laundry'
                : 'Mark as clean and ready to wear'
            }
            className="rounded-xl bg-surface px-2.5 py-2 text-xs font-semibold text-foreground ring-1 ring-border transition hover:bg-accent-soft sm:px-3 sm:py-2.5 sm:text-sm"
          >
            <span className="sm:hidden">{item.isClean ? 'Wash' : 'Clean'}</span>
            <span className="hidden sm:inline">
              {item.isClean ? 'To laundry' : 'Mark clean'}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setConfirmOpen(true)}
            aria-label={`Delete ${item.title}`}
            className="rounded-xl px-2 py-2 text-sm font-semibold text-muted transition hover:bg-red-50 hover:text-red-700 sm:px-3 sm:py-2.5"
          >
            ✕
          </button>
        </div>
      </div>

      {confirmOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 p-0 backdrop-blur-sm sm:items-center sm:p-4"
            role="presentation"
            onClick={() => setConfirmOpen(false)}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby={`delete-item-${item.id}`}
              className="w-full max-w-sm rounded-t-2xl border border-border/60 bg-surface-elevated p-5 shadow-xl sm:rounded-2xl sm:p-6"
              onClick={(event) => event.stopPropagation()}
            >
              <h3
                id={`delete-item-${item.id}`}
                className="font-display text-lg font-semibold text-foreground"
              >
                Delete this item?
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                Delete{' '}
                <span className="font-semibold text-foreground">
                  {item.title}
                </span>
                ? This can&apos;t be undone.
              </p>
              <div className="mt-5 flex gap-2 pb-[env(safe-area-inset-bottom)] sm:pb-0">
                <button
                  type="button"
                  onClick={() => setConfirmOpen(false)}
                  className="flex-1 rounded-xl bg-surface px-4 py-3 text-sm font-semibold text-foreground ring-1 ring-border transition hover:bg-accent-soft/50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setConfirmOpen(false);
                    onDelete();
                  }}
                  className="flex-1 rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-700"
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
