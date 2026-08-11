'use client';

import { TaggingForm } from '@/components/add-item/TaggingForm';

export default function AddItemPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10">
      <div className="animate-fade-up mb-5 sm:mb-7">
        <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          Add new item
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted sm:text-base">
          Photo on the left, details on the right — snap, tag, and save.
        </p>
      </div>

      <div
        className="animate-fade-up rounded-[1.5rem] border border-border/60 bg-surface-elevated/95 p-3 shadow-sm sm:rounded-[1.75rem] sm:p-5 lg:p-6"
        style={{ animationDelay: '80ms' }}
      >
        <TaggingForm />
      </div>
    </div>
  );
}
