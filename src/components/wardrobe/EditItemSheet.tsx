'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '@/context/AuthContext';
import { useWardrobe } from '@/context/WardrobeContext';
import {
  compressDataUrl,
  fileToDataUrl,
} from '@/lib/imageProcess';
import {
  categoriesForGender,
  OCCASIONS,
  SEASONS,
  SIZES,
} from '@/lib/constants';
import { ColorPicker } from '@/components/common/ColorPicker';
import type {
  Category,
  ClothingItem,
  Color,
  Occasion,
  Season,
  Size,
} from '@/types';

export function EditItemSheet({
  item,
  onClose,
}: {
  item: ClothingItem;
  onClose: () => void;
}) {
  const { saveItem } = useWardrobe();
  const { gender } = useAuth();
  const CATEGORIES = categoriesForGender(gender);

  const [title, setTitle] = useState(item.title);
  const [imageUrl, setImageUrl] = useState(item.imageUrl);
  const [category, setCategory] = useState<Category>(item.category);
  const [color, setColor] = useState<Color>(item.color);
  const [occasions, setOccasions] = useState<Occasion[]>(item.occasions);
  const [season, setSeason] = useState<Season>(item.season);
  const [brand, setBrand] = useState(item.brand);
  const [size, setSize] = useState<Size>(item.size);
  const [price, setPrice] = useState(item.price != null ? String(item.price) : '');
  const [notes, setNotes] = useState(item.notes);
  const [saving, setSaving] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  function toggleOccasion(occ: Occasion) {
    setOccasions((prev) =>
      prev.includes(occ) ? prev.filter((v) => v !== occ) : [...prev, occ],
    );
  }

  async function handlePhotoChange(fileList: FileList | null) {
    const file = fileList?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    setPhotoBusy(true);
    setError('');
    try {
      const dataUrl = await fileToDataUrl(file);
      const compressed = await compressDataUrl(dataUrl);
      setImageUrl(compressed);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update photo');
    } finally {
      setPhotoBusy(false);
    }
  }

  async function handleSave() {
    if (!title.trim()) {
      setError('Title is required.');
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
        ...item,
        title: title.trim(),
        imageUrl,
        category,
        color,
        occasions,
        season,
        brand: brand.trim(),
        size,
        price: parsedPrice,
        notes: notes.trim(),
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  const sheet = (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-foreground/40 backdrop-blur-[2px] sm:items-center sm:p-4"
      role="presentation"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-item-title"
        className="flex max-h-[min(92dvh,100%)] w-full max-w-lg flex-col overflow-hidden rounded-t-[1.5rem] bg-surface-elevated shadow-xl sm:max-h-[90dvh] sm:rounded-[1.5rem]"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-border/60 px-5 py-3.5">
          <h2 id="edit-item-title" className="font-display text-lg font-semibold">
            Edit item
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer text-sm font-semibold text-muted hover:text-foreground"
          >
            Cancel
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4 [-webkit-overflow-scrolling:touch]">
          <div className="space-y-4 pb-2">
            <div className="space-y-2">
              <span className="text-sm font-semibold">Photo</span>
              <div className="relative mx-auto aspect-[4/5] max-h-44 w-full max-w-[10.5rem] overflow-hidden rounded-2xl bg-accent-soft/40 sm:max-h-56 sm:max-w-[13rem]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imageUrl}
                  alt={title || item.title}
                  className="h-full w-full object-contain"
                />
                {photoBusy && (
                  <div className="absolute inset-0 flex items-center justify-center bg-foreground/40 text-sm font-semibold text-white">
                    Updating photo…
                  </div>
                )}
              </div>
              <label className="inline-flex cursor-pointer rounded-xl bg-surface px-3 py-2 text-sm font-semibold ring-1 ring-border transition hover:bg-accent-soft">
                Change photo
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  disabled={photoBusy || saving}
                  onChange={(event) => {
                    void handlePhotoChange(event.target.files);
                    event.target.value = '';
                  }}
                />
              </label>
            </div>

            <label className="block space-y-1.5">
              <span className="text-sm font-semibold">Title</span>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm outline-none focus:border-accent"
              />
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="block space-y-1.5">
                <span className="text-sm font-semibold">Category</span>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as Category)}
                  className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm outline-none focus:border-accent"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                  {!CATEGORIES.includes(category) && (
                    <option value={category}>{category}</option>
                  )}
                </select>
              </label>
              <div className="block space-y-1.5">
                <span className="text-sm font-semibold">Color</span>
                <ColorPicker
                  value={color}
                  onChange={setColor}
                  variant="select"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="block space-y-1.5">
                <span className="text-sm font-semibold">Season</span>
                <select
                  value={season}
                  onChange={(e) => setSeason(e.target.value as Season)}
                  className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm outline-none focus:border-accent"
                >
                  {SEASONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block space-y-1.5">
                <span className="text-sm font-semibold">Size</span>
                <select
                  value={size}
                  onChange={(e) => setSize(e.target.value as Size)}
                  className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm outline-none focus:border-accent"
                >
                  {SIZES.map((s) => (
                    <option key={s || 'none'} value={s}>
                      {s || 'Not set'}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="block space-y-1.5">
                <span className="text-sm font-semibold">Brand</span>
                <input
                  type="text"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  placeholder="Optional"
                  className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm outline-none focus:border-accent"
                />
              </label>
              <label className="block space-y-1.5">
                <span className="text-sm font-semibold">Price</span>
                <input
                  type="number"
                  min="0"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="Optional"
                  className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm outline-none focus:border-accent"
                />
              </label>
            </div>

            <div>
              <p className="mb-2 text-sm font-semibold">Occasions</p>
              <div className="flex flex-wrap gap-1.5">
                {OCCASIONS.map((occ) => (
                  <button
                    key={occ}
                    type="button"
                    onClick={() => toggleOccasion(occ)}
                    className={`cursor-pointer rounded-full px-3 py-1.5 text-xs font-medium transition ${
                      occasions.includes(occ)
                        ? 'bg-accent text-white'
                        : 'bg-surface text-foreground ring-1 ring-border'
                    }`}
                  >
                    {occ}
                  </button>
                ))}
              </div>
            </div>

            <label className="block space-y-1.5">
              <span className="text-sm font-semibold">Notes</span>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="w-full resize-y rounded-xl border border-border bg-surface px-3 py-2.5 text-sm outline-none focus:border-accent"
              />
            </label>

            {error && (
              <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            )}
          </div>
        </div>

        <div className="shrink-0 border-t border-border/60 bg-surface-elevated px-5 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving || photoBusy}
            className="w-full cursor-pointer rounded-2xl bg-accent py-3.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </div>
    </div>
  );

  if (typeof document === 'undefined') return sheet;
  return createPortal(sheet, document.body);
}
