'use client';

import { useEffect, useRef, useState } from 'react';
import { useWardrobe } from '@/context/WardrobeContext';
import { autoTagFromImageLocal } from '@/lib/autoTag';
import { CATEGORIES, COLORS, OCCASIONS, SEASONS } from '@/lib/constants';
import { compressDataUrl, fileToDataUrl } from '@/lib/imageProcess';
import type {
  Category,
  ClothingItem,
  Color,
  Occasion,
  Season,
} from '@/types';

interface DraftItem {
  localId: string;
  imageUrl: string;
  title: string;
  category: Category;
  color: Color;
  occasions: Occasion[];
  season: Season;
  brand: string;
  status: 'processing' | 'ready' | 'error';
  error?: string;
}

const BULK_CONCURRENCY = 3;

async function mapPool<T>(
  items: T[],
  concurrency: number,
  worker: (item: T, index: number) => Promise<void>,
) {
  let next = 0;
  async function run() {
    while (next < items.length) {
      const index = next;
      next += 1;
      await worker(items[index], index);
      // Let the UI paint between items
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
  }
  const runners = Array.from(
    { length: Math.min(concurrency, items.length) },
    () => run(),
  );
  await Promise.all(runners);
}

export function BulkImport({
  onDone,
  initialFiles = [],
}: {
  onDone: () => void;
  initialFiles?: File[];
}) {
  const { saveItems } = useWardrobe();
  const inputRef = useRef<HTMLInputElement>(null);
  const [drafts, setDrafts] = useState<DraftItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [processing, setProcessing] = useState(false);
  const bootstrapped = useRef(false);

  useEffect(() => {
    if (bootstrapped.current || initialFiles.length === 0) return;
    bootstrapped.current = true;
    void processFiles(initialFiles);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- bootstrap once from gallery multi-select
  }, [initialFiles]);

  async function processFiles(files: File[]) {
    const imageFiles = files.filter((file) => file.type.startsWith('image/'));
    if (!imageFiles.length) return;

    const placeholders: DraftItem[] = imageFiles.map((file) => ({
      localId: crypto.randomUUID(),
      imageUrl: '',
      title: file.name.replace(/\.[^.]+$/, ''),
      category: 'Top',
      color: 'Black',
      occasions: ['Casual'],
      season: 'All-Season',
      brand: '',
      status: 'processing',
    }));

    setDrafts((prev) => [...placeholders, ...prev]);
    setProcessing(true);

    try {
      await mapPool(imageFiles, BULK_CONCURRENCY, async (file, index) => {
        const localId = placeholders[index].localId;
        const fallbackTitle = placeholders[index].title;
        try {
          // Fast path: compress only (skip ML background soften — too heavy for bulk)
          const raw = await fileToDataUrl(file);
          const compressed = await compressDataUrl(raw);
          const tags = await autoTagFromImageLocal(compressed, fallbackTitle);

          setDrafts((prev) =>
            prev.map((draft) =>
              draft.localId === localId
                ? {
                    ...draft,
                    imageUrl: compressed,
                    title: tags.title || draft.title,
                    category: tags.category || draft.category,
                    color: tags.color || draft.color,
                    occasions: tags.occasions?.length
                      ? tags.occasions
                      : draft.occasions,
                    season: tags.season || draft.season,
                    brand: tags.brand || '',
                    status: 'ready',
                  }
                : draft,
            ),
          );
        } catch (error) {
          setDrafts((prev) =>
            prev.map((draft) =>
              draft.localId === localId
                ? {
                    ...draft,
                    status: 'error',
                    error:
                      error instanceof Error
                        ? error.message
                        : 'Failed to process',
                  }
                : draft,
            ),
          );
        }
      });
    } finally {
      setProcessing(false);
    }
  }

  function updateDraft(localId: string, patch: Partial<DraftItem>) {
    setDrafts((prev) =>
      prev.map((draft) =>
        draft.localId === localId ? { ...draft, ...patch } : draft,
      ),
    );
  }

  function removeDraft(localId: string) {
    setDrafts((prev) => prev.filter((draft) => draft.localId !== localId));
  }

  async function handleSave() {
    const ready = drafts.filter(
      (draft) => draft.status === 'ready' && draft.imageUrl,
    );
    if (!ready.length) return;

    setSaving(true);
    try {
      const items: ClothingItem[] = ready.map((draft) => ({
        id: crypto.randomUUID(),
        title: draft.title.trim() || 'Untitled item',
        imageUrl: draft.imageUrl,
        category: draft.category,
        color: draft.color,
        occasions: draft.occasions.length ? draft.occasions : ['Casual'],
        isClean: true,
        lastWornDate: null,
        createdAt: new Date().toISOString(),
        brand: draft.brand.trim(),
        size: '',
        season: draft.season,
        price: null,
        notes: '',
      }));

      await saveItems(items);
      onDone();
    } finally {
      setSaving(false);
    }
  }

  const readyCount = drafts.filter((draft) => draft.status === 'ready').length;
  const pendingCount = drafts.filter(
    (draft) => draft.status === 'processing',
  ).length;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-surface px-4 py-3 text-sm text-muted ring-1 ring-border">
        Select multiple photos. They compress quickly with local color tags so
        you can review and edit before saving. Soften backgrounds on single Add
        when you want that look.
      </div>

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={processing}
        className="w-full rounded-2xl bg-accent py-3.5 text-sm font-semibold text-white disabled:opacity-60"
      >
        {processing
          ? `Processing ${pendingCount || '…'} left…`
          : 'Choose photos'}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="sr-only"
        onChange={(event) => {
          const files = event.target.files
            ? Array.from(event.target.files)
            : [];
          void processFiles(files);
          event.target.value = '';
        }}
      />

      {drafts.length > 0 && (
        <ul className="space-y-4">
          {drafts.map((draft) => (
            <li
              key={draft.localId}
              className="overflow-hidden rounded-[1.5rem] border border-border/60 bg-surface-elevated"
            >
              <div className="grid gap-3 p-3 sm:grid-cols-[120px_1fr]">
                <div className="aspect-square overflow-hidden rounded-2xl bg-accent-soft/40">
                  {draft.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={draft.imageUrl}
                      alt={draft.title}
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center px-2 text-center text-xs text-muted">
                      {draft.status === 'processing'
                        ? 'Processing…'
                        : draft.error || 'Failed'}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <input
                    value={draft.title}
                    onChange={(event) =>
                      updateDraft(draft.localId, { title: event.target.value })
                    }
                    className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm"
                    disabled={draft.status !== 'ready'}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={draft.category}
                      onChange={(event) =>
                        updateDraft(draft.localId, {
                          category: event.target.value as Category,
                        })
                      }
                      className="rounded-xl border border-border bg-surface px-2 py-2 text-sm"
                      disabled={draft.status !== 'ready'}
                    >
                      {CATEGORIES.map((value) => (
                        <option key={value} value={value}>
                          {value}
                        </option>
                      ))}
                    </select>
                    <select
                      value={draft.color}
                      onChange={(event) =>
                        updateDraft(draft.localId, {
                          color: event.target.value as Color,
                        })
                      }
                      className="rounded-xl border border-border bg-surface px-2 py-2 text-sm"
                      disabled={draft.status !== 'ready'}
                    >
                      {COLORS.map((value) => (
                        <option key={value} value={value}>
                          {value}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {OCCASIONS.map((occasion) => {
                      const active = draft.occasions.includes(occasion);
                      return (
                        <button
                          key={occasion}
                          type="button"
                          disabled={draft.status !== 'ready'}
                          onClick={() =>
                            updateDraft(draft.localId, {
                              occasions: active
                                ? draft.occasions.filter(
                                    (value) => value !== occasion,
                                  )
                                : [...draft.occasions, occasion],
                            })
                          }
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                            active
                              ? 'bg-accent text-white'
                              : 'bg-surface ring-1 ring-border'
                          }`}
                        >
                          {occasion}
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <select
                      value={draft.season}
                      onChange={(event) =>
                        updateDraft(draft.localId, {
                          season: event.target.value as Season,
                        })
                      }
                      className="rounded-xl border border-border bg-surface px-2 py-2 text-sm"
                      disabled={draft.status !== 'ready'}
                    >
                      {SEASONS.map((value) => (
                        <option key={value} value={value}>
                          {value}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => removeDraft(draft.localId)}
                      className="text-sm font-semibold text-muted hover:text-red-700"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {readyCount > 0 && (
        <button
          type="button"
          disabled={saving || processing}
          onClick={handleSave}
          className="w-full rounded-2xl bg-accent py-3.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          Save {readyCount} item{readyCount === 1 ? '' : 's'}
        </button>
      )}
    </div>
  );
}
