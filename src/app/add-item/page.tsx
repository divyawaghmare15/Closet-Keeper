'use client';

import { TaggingForm } from '@/components/add-item/TaggingForm';

export default function AddItemPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-4 sm:px-6 sm:py-6 lg:px-10 lg:py-6">
      <div className="animate-fade-up mb-4 sm:mb-5">
        <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
          Add new item
        </h1>
      </div>

      <div
        className="animate-fade-up overflow-visible rounded-[1.5rem] border border-border/60 bg-surface-elevated/95 p-3 shadow-sm sm:rounded-[1.75rem] sm:p-4 lg:p-5"
        style={{ animationDelay: '80ms' }}
      >
        <TaggingForm />
      </div>
    </div>
  );
}
