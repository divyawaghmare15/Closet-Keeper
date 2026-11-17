'use client';

import { TaggingForm } from '@/components/add-item/TaggingForm';

export default function AddItemPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-3 pb-28 pt-4 sm:px-6 sm:pb-10 sm:pt-6 lg:px-10">
      <div className="animate-fade-up mb-4 sm:mb-5">
        <p className="text-[11px] font-semibold tracking-[0.14em] text-accent uppercase">
          ClosetKeeper
        </p>
        <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
          Add a piece
        </h1>
        <p className="mt-1 text-sm text-muted">
          Photo first — tags fill in automatically.
        </p>
      </div>

      <div className="animate-fade-up" style={{ animationDelay: '60ms' }}>
        <TaggingForm />
      </div>
    </div>
  );
}
