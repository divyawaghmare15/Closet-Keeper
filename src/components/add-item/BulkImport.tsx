'use client';

import { useEffect, useRef, useState } from 'react';
import { useWardrobe } from '@/context/WardrobeContext';
import { autoTagFromImage } from '@/lib/autoTag';
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

type QueueJob = {
  file: File;
  localId: string;
  fallbackTitle: string;
};

const ITEM_DELAY_MS = 700;

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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
  const queueRef = useRef<QueueJob[]>([]);
  const runningRef = useRef(false);
  const [drafts, setDrafts] = useState<DraftItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const bootstrapped = useRef(false);

  useEffect(() => {
    if (bootstrapped.current || initialFiles.length === 0) return;
    bootstrapped.current = true;
    enqueueFiles(initialFiles);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- bootstrap once from gallery multi-select
  }, [initialFiles]);

  function enqueueFiles(files: File[]) {
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

    queueRef.current.push(
      ...placeholders.map((placeholder, index) => ({
        file: imageFiles[index],
        localId: placeholder.localId,
        fallbackTitle: placeholder.title,
      })),
    );

    setDrafts((prev) => [...placeholders, ...prev]);
    setProgress((prev) => ({
      done: prev.done,
      total: prev.total + placeholders.length,
    }));
    void pumpQueue();
  }

  async function pumpQueue() {
    if (runningRef.current) return;
    runningRef.current = true;
    setProcessing(true);

    while (queueRef.current.length > 0) {
      const job = queueRef.current.shift();
      if (!job) break;
      await processOne(job);
      if (queueRef.current.length > 0) {
        await delay(ITEM_DELAY_MS);
      }
    }

    runningRef.current = false;
    setProcessing(false);
  }

  async function processOne(job: QueueJob) {
    try {
      const raw = await fileToDataUrl(job.file);
      const compressed = await compressDataUrl(raw);
      let tags;
      try {
        tags = await autoTagFromImage(compressed);
      } catch {
        tags = {
          title: job.fallbackTitle,
          category: 'Top' as const,
          color: 'Black' as const,
          occasions: ['Casual' as const],
          season: 'All-Season' as const,
          brand: '',
        };
      }

      setDrafts((prev) =>
        prev.map((draft) =>
          draft.localId === job.localId
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
          draft.localId === job.localId
            ? {
                ...draft,
                status: 'error',
                error:
                  error instanceof Error ? error.message : 'Failed to process',
              }
            : draft,
        ),
      );
    } finally {
      setProgress((prev) => ({
        ...prev,
        done: Math.min(prev.total, prev.done + 1),
      }));
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
    queueRef.current = queueRef.current.filter(
      (job) => job.localId !== localId,
    );
    setDrafts((prev) => prev.filter((draft) => draft.localId !== localId));
  }

  async function handleSave() {
    const ready = drafts.filter(
      (draft) => draft.status === 'ready' && draft.imageUrl,
    );
    if (!ready.length) {
      setSaveError('Wait until at least one photo is tagged, then save.');
      return;
    }

    setSaving(true);
    setSaveError('');
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
    } catch (error) {
      setSaveError(
        error instanceof Error ? error.message : 'Could not save to wardrobe.',
      );
    } finally {
      setSaving(false);
    }
  }

  const readyCount = drafts.filter((draft) => draft.status === 'ready').length;
  const pendingCount = drafts.filter(
    (draft) => draft.status === 'processing',
  ).length;
  const percent =
    progress.total === 0
      ? 0
      : Math.round((progress.done / progress.total) * 100);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-surface px-4 py-3 text-sm text-muted ring-1 ring-border">
        Select multiple photos. Each one is tagged in the background with a
        short pause so the page stays usable. Review and edit as they finish.
      </div>

      {progress.total > 0 && (
        <div className="rounded-[1.25rem] border border-border/60 bg-surface-elevated p-4">
          <div className="mb-2 flex items-center justify-between gap-3 text-sm">
            <p className="font-semibold">
              {processing ? 'Working in background' : 'Batch complete'}
            </p>
            <p className="text-muted">
              {progress.done}/{progress.total} · {percent}%
            </p>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-accent-soft">
            <div
              className="h-full rounded-full bg-accent transition-[width] duration-300"
              style={{ width: `${percent}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-muted">
            {processing
              ? `${pendingCount} left. You can edit finished items or add more photos.`
              : 'All selected photos are ready to review.'}
          </p>
        </div>
      )}

      <div className="grid gap-2 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="w-full rounded-2xl bg-surface py-3.5 text-sm font-semibold ring-1 ring-border"
        >
          {processing ? 'Add more photos' : 'Choose photos'}
        </button>
        <button
          type="button"
          disabled={saving || readyCount === 0}
          onClick={() => void handleSave()}
          className="w-full rounded-2xl bg-accent py-3.5 text-sm font-semibold text-white disabled:opacity-50"
        >
          {saving
            ? 'Saving…'
            : readyCount === 0
              ? 'Save to wardrobe'
              : `Save ${readyCount} to wardrobe`}
        </button>
      </div>
      {drafts.length > 0 && readyCount === 0 && (
        <p className="text-center text-xs text-muted">
          Save appears once the first photo finishes tagging.
        </p>
      )}
      {saveError && (
        <p className="text-sm text-red-700" role="alert">
          {saveError}
        </p>
      )}
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
          enqueueFiles(files);
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
                    <div className="flex h-full flex-col items-center justify-center gap-2 px-2 text-center text-xs text-muted">
                      <span className="size-5 animate-spin rounded-full border-2 border-accent-soft border-t-accent" />
                      {draft.status === 'processing'
                        ? 'Queued…'
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

      {drafts.length > 0 && (
        <div className="h-20 lg:h-4" />
      )}

      {drafts.length > 0 && (
        <div className="fixed inset-x-0 bottom-[4.25rem] z-30 px-4 pb-[env(safe-area-inset-bottom)] lg:bottom-6">
          <div className="mx-auto w-full max-w-6xl">
            <button
              type="button"
              disabled={saving || readyCount === 0}
              onClick={() => void handleSave()}
              className="w-full rounded-2xl bg-accent py-3.5 text-sm font-semibold text-white shadow-lg disabled:opacity-50"
            >
              {saving
                ? 'Saving…'
                : readyCount === 0
                  ? 'Save to wardrobe'
                  : `Save ${readyCount} to wardrobe`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
