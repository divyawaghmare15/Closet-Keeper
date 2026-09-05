'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useWardrobe } from '@/context/WardrobeContext';

export default function PackPage() {
  const { items } = useWardrobe();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState(false);

  const cleanItems = useMemo(
    () => items.filter((item) => item.isClean),
    [items],
  );

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const packed = cleanItems.filter((item) => selected.has(item.id));

  async function copyList() {
    if (packed.length === 0) return;
    const text = [
      'ClosetKeeper packing list',
      ...packed.map(
        (item, index) =>
          `${index + 1}. ${item.title} (${item.category} · ${item.color})`,
      ),
    ].join('\n');

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 sm:py-8 lg:px-10">
      <div className="mb-6">
        <Link
          href="/wardrobe"
          className="text-sm font-semibold text-accent hover:underline"
        >
          ← Back to wardrobe
        </Link>
        <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight">
          Packing list
        </h1>
        <p className="mt-2 text-sm text-muted">
          Tap clean pieces to pack, then copy the list for your trip.
        </p>
      </div>

      {cleanItems.length === 0 ? (
        <div className="rounded-[1.5rem] border border-dashed border-border bg-surface-elevated/70 px-6 py-14 text-center">
          <p className="font-display text-xl font-semibold">No clean pieces</p>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted">
            Mark laundry as clean, or add clothes, then pack from here.
          </p>
        </div>
      ) : (
        <>
          <ul className="space-y-2">
            {cleanItems.map((item) => {
              const active = selected.has(item.id);
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => toggle(item.id)}
                    className={`flex w-full items-center gap-3 rounded-2xl border px-3 py-2.5 text-left transition ${
                      active
                        ? 'border-accent bg-accent-soft/60'
                        : 'border-border/60 bg-surface-elevated hover:bg-accent-soft/30'
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.imageUrl}
                      alt=""
                      className="size-12 rounded-xl object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">
                        {item.title}
                      </p>
                      <p className="truncate text-xs text-muted">
                        {item.category} · {item.color}
                      </p>
                    </div>
                    <span
                      className={`flex size-6 items-center justify-center rounded-full text-xs font-bold ${
                        active
                          ? 'bg-accent text-white'
                          : 'bg-surface ring-1 ring-border text-muted'
                      }`}
                    >
                      {active ? '✓' : ''}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="sticky bottom-[calc(5rem+env(safe-area-inset-bottom))] mt-6 rounded-2xl border border-border/60 bg-surface-elevated/95 p-4 shadow-lg backdrop-blur-sm lg:bottom-6">
            <p className="text-sm text-muted">
              {packed.length} item{packed.length === 1 ? '' : 's'} selected
            </p>
            <button
              type="button"
              disabled={packed.length === 0}
              onClick={() => void copyList()}
              className="mt-3 w-full rounded-2xl bg-accent py-3 text-sm font-semibold text-white disabled:opacity-50"
            >
              {copied ? 'Copied!' : 'Copy packing list'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
