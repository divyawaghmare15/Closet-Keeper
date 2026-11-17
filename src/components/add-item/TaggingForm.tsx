'use client';

import { useId, useMemo, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { BulkImport } from '@/components/add-item/BulkImport';
import { ImageUploader } from '@/components/add-item/ImageUploader';
import { ColorPicker } from '@/components/common/ColorPicker';
import { useWardrobe } from '@/context/WardrobeContext';
import { autoTagFromImage } from '@/lib/autoTag';
import { useAuth } from '@/context/AuthContext';
import {
  categoriesForGender,
  OCCASIONS,
  SEASONS,
  SIZES,
} from '@/lib/constants';
import type { Category, Color, Occasion, Season, Size } from '@/types';

const PRIMARY_OCCASIONS: Occasion[] = [
  'Casual',
  'Office',
  'Formal',
  'Date Night',
  'Sports',
];

export function TaggingForm() {
  const router = useRouter();
  const { saveItem } = useWardrobe();
  const { gender } = useAuth();
  const CATEGORIES = categoriesForGender(gender);
  const cleanToggleId = useId();

  const [mode, setMode] = useState<'single' | 'bulk'>('single');
  const [bulkFiles, setBulkFiles] = useState<File[]>([]);
  const [title, setTitle] = useState('');
  const defaultCategory = (() => {
    if (typeof window === 'undefined') return CATEGORIES[0];
    const saved = localStorage.getItem('ck_preferred_category');
    if (saved && CATEGORIES.includes(saved as Category)) return saved as Category;
    return CATEGORIES[0];
  })();
  const [category, setCategory] = useState<Category>(defaultCategory);
  const [color, setColor] = useState<Color>('Black');
  const [occasions, setOccasions] = useState<Occasion[]>(['Casual']);
  const [showMoreOccasions, setShowMoreOccasions] = useState(false);
  const [isClean, setIsClean] = useState(true);
  const [imageUrl, setImageUrl] = useState('');
  const [autoRemoveBackground, setAutoRemoveBackground] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('ck_auto_remove_bg') === '1';
  });
  const [brand, setBrand] = useState('');
  const [size, setSize] = useState<Size>('');
  const [season, setSeason] = useState<Season>('All-Season');
  const [price, setPrice] = useState('');
  const [notes, setNotes] = useState('');
  const [autoTagging, setAutoTagging] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const autoTitlePlaceholder = useMemo(
    () => `${color} ${category}`,
    [color, category],
  );

  const moreOccasions = useMemo(
    () => OCCASIONS.filter((occasion) => !PRIMARY_OCCASIONS.includes(occasion)),
    [],
  );

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
    setCategory(defaultCategory);
    setColor('Black');
    setOccasions(['Casual']);
    setSeason('All-Season');
  }

  async function handleAutoTag(nextImage: string) {
    clearAutoFields();
    setAutoTagging(true);
    setError('');
    try {
      const tags = await autoTagFromImage(nextImage, gender);
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
    if (saving || autoTagging) return;

    const resolvedTitle = title.trim() || autoTitlePlaceholder;

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

    setSaving(true);
    setError('');
    try {
      await saveItem({
        id: crypto.randomUUID(),
        title: resolvedTitle,
        imageUrl,
        category,
        color,
        occasions,
        isClean,
        lastWornDate: null,
        wearCount: 0,
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
      setSaving(false);
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
    <form onSubmit={handleSubmit} className="relative">
      {(autoTagging || saving) && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-foreground/40 backdrop-blur-[2px]">
          <div className="flex flex-col items-center gap-4 rounded-[1.5rem] bg-surface-elevated px-8 py-7 shadow-xl">
            <span
              className="size-10 animate-spin rounded-full border-[3px] border-accent-soft border-t-accent"
              aria-hidden
            />
            <p className="font-display text-lg font-semibold">
              {saving ? 'Saving item' : 'Auto-tagging'}
            </p>
            <p className="text-sm text-muted">
              {saving
                ? 'Adding this piece to your wardrobe…'
                : 'Reading the photo for tags…'}
            </p>
          </div>
        </div>
      )}

      <ModeToggle mode={mode} onChange={setMode} />

      <div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8">
        <div className="min-h-0 min-w-0">
          <ImageUploader
            imageUrl={imageUrl}
            autoRemoveBackground={autoRemoveBackground}
            onAutoRemoveBackgroundChange={(value) => {
              setAutoRemoveBackground(value);
              localStorage.setItem('ck_auto_remove_bg', value ? '1' : '0');
            }}
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
        </div>

        <div
          className={`flex min-h-0 min-w-0 flex-col ${
            imageUrl ? '' : 'pointer-events-none opacity-45'
          }`}
        >
          <div className="mb-3 flex items-center justify-between gap-2 md:hidden">
            <p className="text-sm font-semibold text-foreground">Tags</p>
            <p className="text-xs text-muted">
              {imageUrl ? 'Edit anything before saving' : 'Add a photo first'}
            </p>
          </div>

          <div className="space-y-3.5 rounded-[1.25rem] border border-border/50 bg-surface-elevated/80 p-3.5 sm:space-y-3.5 sm:rounded-none sm:border-0 sm:bg-transparent sm:p-0">
            <label className="block space-y-1">
              <span className="text-xs font-semibold tracking-wide text-muted uppercase">
                Title
              </span>
              <input
                type="text"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder={autoTitlePlaceholder}
                className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
              />
            </label>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold tracking-wide text-muted uppercase">
                  Category
                </span>
                <label
                  htmlFor={cleanToggleId}
                  className={`inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold transition ${
                    isClean
                      ? 'bg-accent-soft text-accent ring-1 ring-accent/25'
                      : 'bg-wash-soft text-wash ring-1 ring-wash/30'
                  }`}
                >
                  <input
                    id={cleanToggleId}
                    type="checkbox"
                    className="sr-only"
                    checked={isClean}
                    onChange={(event) => setIsClean(event.target.checked)}
                  />
                  {isClean ? 'Clean' : 'In wash'}
                </label>
              </div>
              <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 [scrollbar-width:none] sm:flex-wrap sm:overflow-visible [&::-webkit-scrollbar]:hidden">
                {CATEGORIES.map((value) => {
                  const active = category === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => {
                        setCategory(value);
                        localStorage.setItem('ck_preferred_category', value);
                      }}
                      className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                        active
                          ? 'bg-accent text-white'
                          : 'bg-surface text-foreground ring-1 ring-border hover:bg-accent-soft/50'
                      }`}
                    >
                      {value}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="text-xs font-semibold tracking-wide text-muted uppercase">
                Color
              </span>
              <ColorPicker value={color} onChange={setColor} />
            </div>

            <div className="space-y-1.5">
              <span className="text-xs font-semibold tracking-wide text-muted uppercase">
                Occasions
              </span>
              <div className="flex flex-wrap gap-1.5">
                {PRIMARY_OCCASIONS.map((occasion) => (
                  <OccasionChip
                    key={occasion}
                    occasion={occasion}
                    active={occasions.includes(occasion)}
                    onToggle={toggleOccasion}
                  />
                ))}
                {!showMoreOccasions ? (
                  <button
                    type="button"
                    onClick={() => setShowMoreOccasions(true)}
                    className="rounded-full bg-surface px-3 py-1.5 text-xs font-semibold text-muted ring-1 ring-border transition hover:text-foreground"
                  >
                    + More
                  </button>
                ) : (
                  moreOccasions.map((occasion) => (
                    <OccasionChip
                      key={occasion}
                      occasion={occasion}
                      active={occasions.includes(occasion)}
                      onToggle={toggleOccasion}
                    />
                  ))
                )}
              </div>
            </div>

            <details className="group rounded-xl border border-border/60 bg-surface/50">
              <summary className="cursor-pointer list-none px-3 py-2.5 text-sm font-semibold text-foreground marker:content-none [&::-webkit-details-marker]:hidden">
                More details
                <span className="ml-1.5 font-normal text-muted">
                  Brand, size, price
                </span>
              </summary>
              <div className="space-y-3 border-t border-border/40 px-3 py-3">
                <label className="block space-y-1">
                  <span className="text-xs font-semibold text-muted">Brand</span>
                  <input
                    type="text"
                    value={brand}
                    onChange={(event) => setBrand(event.target.value)}
                    placeholder="Optional"
                    className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
                  />
                </label>

                <div className="grid grid-cols-2 gap-2">
                  <label className="block space-y-1">
                    <span className="text-xs font-semibold text-muted">Size</span>
                    <select
                      value={size}
                      onChange={(event) => setSize(event.target.value as Size)}
                      className="w-full rounded-xl border border-border bg-surface px-2 py-2 text-sm outline-none focus:border-accent"
                    >
                      {SIZES.map((value) => (
                        <option key={value || 'none'} value={value}>
                          {value || 'Not set'}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block space-y-1">
                    <span className="text-xs font-semibold text-muted">Season</span>
                    <select
                      value={season}
                      onChange={(event) =>
                        setSeason(event.target.value as Season)
                      }
                      className="w-full rounded-xl border border-border bg-surface px-2 py-2 text-sm outline-none focus:border-accent"
                    >
                      {SEASONS.map((value) => (
                        <option key={value} value={value}>
                          {value}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <label className="block space-y-1">
                  <span className="text-xs font-semibold text-muted">Price</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={price}
                    onChange={(event) => setPrice(event.target.value)}
                    placeholder="Optional"
                    className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
                  />
                </label>

                <label className="block space-y-1">
                  <span className="text-xs font-semibold text-muted">Notes</span>
                  <textarea
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    rows={2}
                    placeholder="Fit notes, care tips…"
                    className="w-full resize-none rounded-xl border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
                  />
                </label>
              </div>
            </details>
          </div>

          <div className="fixed inset-x-0 bottom-[calc(4.25rem+env(safe-area-inset-bottom))] z-30 border-t border-border/50 bg-surface-elevated/95 px-3 py-3 backdrop-blur-md sm:static sm:mt-4 sm:border-0 sm:bg-transparent sm:px-0 sm:py-0 sm:backdrop-blur-none">
            <div className="mx-auto w-full max-w-6xl space-y-2 lg:max-w-none">
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
                disabled={saving || autoTagging || !imageUrl}
                aria-busy={saving}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-accent py-3.5 text-sm font-semibold text-white shadow-sm transition hover:brightness-110 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {saving && (
                  <span
                    className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white"
                    aria-hidden
                  />
                )}
                {saving ? 'Saving…' : 'Save to closet'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}

function OccasionChip({
  occasion,
  active,
  onToggle,
}: {
  occasion: Occasion;
  active: boolean;
  onToggle: (occasion: Occasion) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onToggle(occasion)}
      className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
        active
          ? 'bg-accent text-white'
          : 'bg-surface text-foreground ring-1 ring-border hover:bg-accent-soft/50'
      }`}
    >
      {occasion}
    </button>
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
    <div className="flex items-center justify-between gap-3">
      <div className="flex rounded-2xl bg-surface p-1 ring-1 ring-border">
        <button
          type="button"
          onClick={() => onChange('single')}
          className={`rounded-xl px-3.5 py-2 text-sm font-semibold transition ${
            mode === 'single' ? 'bg-accent text-white' : 'text-muted'
          }`}
        >
          One piece
        </button>
        <button
          type="button"
          onClick={() => onChange('bulk')}
          className={`rounded-xl px-3.5 py-2 text-sm font-semibold transition ${
            mode === 'bulk' ? 'bg-accent text-white' : 'text-muted'
          }`}
        >
          Bulk
        </button>
      </div>
      <p className="hidden text-xs text-muted sm:block">
        {mode === 'bulk'
          ? 'Import many photos at once'
          : 'Best for everyday adds'}
      </p>
    </div>
  );
}
