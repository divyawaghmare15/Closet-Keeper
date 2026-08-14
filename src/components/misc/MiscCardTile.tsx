'use client';

import { miscCoverStyle } from '@/lib/miscCover';
import type { MiscCard } from '@/types';

export function MiscCardTile({
  card,
  onOpen,
}: {
  card: MiscCard;
  onOpen: () => void;
}) {
  const count = card.pieces.reduce((sum, piece) => sum + piece.quantity, 0);
  const cover = miscCoverStyle(card.title, card.id);

  return (
    <button
      type="button"
      onClick={onOpen}
      className="group w-full overflow-hidden rounded-[1.5rem] border border-border/60 bg-surface-elevated text-left shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg"
    >
      <div
        className="relative flex aspect-[4/5] flex-col justify-between overflow-hidden p-5"
        style={{
          background: `linear-gradient(165deg, ${cover.from} 0%, ${cover.to} 100%)`,
        }}
      >
        <span
          aria-hidden
          className="pointer-events-none absolute -right-4 -bottom-6 font-display text-[6.5rem] leading-none font-semibold text-white/25 select-none"
        >
          {card.title.trim().charAt(0).toUpperCase() || 'E'}
        </span>

        <div className="relative z-10">
          <p className="text-[11px] font-semibold tracking-[0.16em] text-foreground/55 uppercase">
            Extras
          </p>
          <h3 className="mt-3 font-display text-[1.65rem] leading-tight font-semibold tracking-tight text-foreground">
            {card.title || 'Untitled'}
          </h3>
        </div>

        <div className="relative z-10">
          <p className="text-sm font-semibold text-foreground/80">
            {count === 0
              ? 'No pieces yet'
              : `${count} ${count === 1 ? 'piece' : 'pieces'} inside`}
          </p>
          <p className="mt-1 text-xs text-foreground/55">
            Tap to see everything you have
          </p>
        </div>
      </div>
    </button>
  );
}
