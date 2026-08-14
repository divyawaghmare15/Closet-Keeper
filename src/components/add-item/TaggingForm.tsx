'use client';

import { useId, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { BulkImport } from '@/components/add-item/BulkImport';
import { ImageUploader } from '@/components/add-item/ImageUploader';
import { useWardrobe } from '@/context/WardrobeContext';
import { autoTagFromImage } from '@/lib/autoTag';
import {
  CATEGORIES,
  COLORS,
  OCCASIONS,
  SEASONS,
  SIZES,
} from '@/lib/constants';
import type { Category, Color, Occasion, Season, Size } from '@/types';

export function TaggingForm() {
  const router = useRouter();
  const { saveItem } = useWardrobe();
  const cleanToggleId = useId();

  const [mode, setMode] = useState<'single' | 'bulk'>('single');
  const [bulkFiles, setBulkFiles] = useState<File[]>([]);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<Category>('Top');
  const [color, setColor] = useState<Color>('Black');
  const [occasions, setOccasions] = useState<Occasion[]>(['Casual']);
  const [isClean, setIsClean] = useState(true);
  const [imageUrl, setImageUrl] = useState('');
  const [brand, setBrand] = useState('');
  const [size, setSize] = useState<Size>('');
  const [season, setSeason] = useState<Season>('All-Season');
  const [price, setPrice] = useState('');
  const [notes, setNotes] = useState('');
  const [autoTagging, setAutoTagging] = useState(false);
  const [error, setError] = useState('');

  function toggleOccasion(occasion: Occasion) {
    setOccasions((prev) =>
      prev.includes(occasion)
        ? prev.filter((value) => value !== occasion)
        : [...prev, occasion],
    );
  }

  function clearAutoFields() {
    setTitle('');
    setBrand('');
    setCategory('Top');
    setColor('Black');
    setOccasions(['Casual']);
    setSeason('All-Season');
  }

  async function handleAutoTag(nextImage: string) {
    clearAutoFields();
    setAutoTagging(true);
    setError('');
    try {
      const tags = await autoTagFromImage(nextImage);
      if (tags.title) setTitle(tags.title);
      if (tags.category) setCategory(tags.category);
      if (tags.color) setColor(tags.color);
      if (tags.occasions?.length) setOccasions(tags.occasions);
      if (tags.season) setSeason(tags.season);
      if (typeof tags.brand === 'string') setBrand(tags.brand);
    } catch {
      setError('Auto-tagging failed. You can fill tags manually.');
    } finally {
      setAutoTagging(false);
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    if (!title.trim()) {
      setError('Give your item a name.');
      return;
    }
    if (!imageUrl) {
      setError('Add a photo of the item.');
      return;
    }
    if (occasions.length === 0) {
      setError('Pick at least one occasion.');
      return;
    }

    const parsedPrice = price.trim() === '' ? null : Number(price);
    if (parsedPrice !== null && Number.isNaN(parsedPrice)) {
      setError('Price must be a number.');
      return;
    }

    try {
      setError('');
      await saveItem({
        id: crypto.randomUUID(),
        title: title.trim(),
        imageUrl,
        category,
        color,
        occasions,
        isClean,
        lastWornDate: null,
        createdAt: new Date().toISOString(),
        brand: brand.trim(),
        size,
        season,
        price: parsedPrice,
        notes: notes.trim(),
      });
      router.push('/wardrobe');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save item');
    }
  }

  if (mode === 'bulk') {
    return (
      <div className="space-y-4">
        <ModeToggle
          mode={mode}
          onChange={(next) => {
            setMode(next);
            if (next === 'single') setBulkFiles([]);
          }}
        />
        <BulkImport
          initialFiles={bulkFiles}
          onDone={() => router.push('/wardrobe')}
        />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="relative space-y-5 md:space-y-6">
      {autoTagging && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-foreground/40 backdrop-blur-[2px]">
          <div className="flex flex-col items-center gap-4 rounded-[1.5rem] bg-surface-elevated px-8 py-7 shadow-xl">
            <span
              className="size-10 animate-spin rounded-full border-[3px] border-accent-soft border-t-accent"
              aria-hidden
            />
            <p className="font-display text-lg font-semibold">Auto-tagging</p>
            <p className="text-sm text-muted">Reading the photo for tags…</p>
          </div>
        </div>
      )}

      <ModeToggle mode={mode} onChange={setMode} />

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 md:items-start md:gap-6 xl:gap-8">
        {/* Left: photo capture */}
        <aside className="rounded-2xl bg-surface/80 p-3 ring-1 ring-border/70 sm:p-4 md:sticky md:top-24">
          <ImageUploader
            imageUrl={imageUrl}
            onChange={(url) => {
              setImageUrl(url);
              if (!url) {
                clearAutoFields();
                setAutoTagging(false);
              } else {
                setTitle('');
                setBrand('');
                setAutoTagging(true);
              }
            }}
            onProcessed={(url) => {
              void handleAutoTag(url);
            }}
            multiple
            onMultiple={(files) => {
              setBulkFiles(files);
              setMode('bulk');
            }}
          />
        </aside>

        {/* Right: details */}
        <div className="min-w-0 space-y-4 sm:space-y-5">
          <div>
            <h2 className="font-display text-xl font-semibold tracking-tight">
              Item details
            </h2>
            <p className="mt-1 text-sm text-muted">
              Fill tags on the right while the photo stays visible on the left.
            </p>
          </div>

          <label className="block space-y-1.5">
            <span className="text-sm font-semibold">Title</span>
            <input
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="e.g. Navy linen shirt"
              className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
            />
          </label>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="block space-y-1.5">
              <span className="text-sm font-semibold">Category</span>
              <select
                value={category}
                onChange={(event) => setCategory(event.target.value as Category)}
                className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm outline-none focus:border-accent"
              >
                {CATEGORIES.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>

            <label className="block space-y-1.5">
              <span className="text-sm font-semibold">Color</span>
              <select
                value={color}
                onChange={(event) => setColor(event.target.value as Color)}
                className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm outline-none focus:border-accent"
              >
                {COLORS.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="block space-y-1.5">
              <span className="text-sm font-semibold">Brand</span>
              <input
                type="text"
                value={brand}
                onChange={(event) => setBrand(event.target.value)}
                placeholder="Optional"
                className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm outline-none focus:border-accent"
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-sm font-semibold">Size</span>
              <select
                value={size}
                onChange={(event) => setSize(event.target.value as Size)}
                className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm outline-none focus:border-accent"
              >
                {SIZES.map((value) => (
                  <option key={value || 'none'} value={value}>
                    {value || 'Not set'}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="block space-y-1.5">
              <span className="text-sm font-semibold">Season</span>
              <select
                value={season}
                onChange={(event) => setSeason(event.target.value as Season)}
                className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm outline-none focus:border-accent"
              >
                {SEASONS.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>

            <label className="block space-y-1.5">
              <span className="text-sm font-semibold">Price</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={price}
                onChange={(event) => setPrice(event.target.value)}
                placeholder="Optional"
                className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm outline-none focus:border-accent"
              />
            </label>
          </div>

          <label className="block space-y-1.5">
            <span className="text-sm font-semibold">Notes</span>
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={3}
              placeholder="Fit notes, care tips, where you wear it…"
              className="w-full resize-y rounded-xl border border-border bg-surface px-3 py-2.5 text-sm outline-none focus:border-accent"
            />
          </label>

          <div>
            <p className="mb-2 text-sm font-semibold">Occasions</p>
            <div className="flex flex-wrap gap-2">
              {OCCASIONS.map((occasion) => {
                const active = occasions.includes(occasion);
                return (
                  <button
                    key={occasion}
                    type="button"
                    onClick={() => toggleOccasion(occasion)}
                    className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                      active
                        ? 'bg-accent text-white'
                        : 'bg-surface text-foreground ring-1 ring-border'
                    }`}
                  >
                    {occasion}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 rounded-2xl bg-surface px-4 py-3 ring-1 ring-border">
            <div className="min-w-0">
              <p className="text-sm font-semibold">Clean status</p>
              <p className="text-xs text-muted">
                {isClean ? 'Ready to wear' : 'Currently in wash'}
              </p>
            </div>
            <label
              htmlFor={cleanToggleId}
              className="inline-flex shrink-0 cursor-pointer items-center gap-2"
            >
              <span className="text-xs font-medium text-muted">
                {isClean ? 'Clean' : 'In wash'}
              </span>
              <span className="relative inline-flex h-7 w-12 items-center">
                <input
                  id={cleanToggleId}
                  type="checkbox"
                  className="peer sr-only"
                  checked={isClean}
                  onChange={(event) => setIsClean(event.target.checked)}
                />
                <span className="absolute inset-0 rounded-full bg-border transition peer-checked:bg-accent peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent" />
                <span className="absolute left-0.5 size-6 rounded-full bg-white shadow transition peer-checked:translate-x-5" />
              </span>
            </label>
          </div>

          {error && (
            <p
              className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700"
              role="alert"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            className="w-full rounded-2xl bg-accent py-3.5 text-sm font-semibold text-white transition hover:brightness-110 active:scale-[0.99]"
          >
            Save to wardrobe
          </button>
        </div>
      </div>
    </form>
  );
}

function ModeToggle({
  mode,
  onChange,
}: {
  mode: 'single' | 'bulk';
  onChange: (mode: 'single' | 'bulk') => void;
}) {
  return (
    <div className="flex rounded-2xl bg-surface p-1 ring-1 ring-border">
      <button
        type="button"
        onClick={() => onChange('single')}
        className={`flex-1 rounded-xl px-3 py-2 text-sm font-semibold transition ${
          mode === 'single' ? 'bg-accent text-white' : 'text-muted'
        }`}
      >
        Single item
      </button>
      <button
        type="button"
        onClick={() => onChange('bulk')}
        className={`flex-1 rounded-xl px-3 py-2 text-sm font-semibold transition ${
          mode === 'bulk' ? 'bg-accent text-white' : 'text-muted'
        }`}
      >
        Bulk import
      </button>
    </div>
  );
}
