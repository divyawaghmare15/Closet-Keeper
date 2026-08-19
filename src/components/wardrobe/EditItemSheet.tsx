'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useWardrobe } from '@/context/WardrobeContext';
import {
  categoriesForGender,
  COLORS,
  OCCASIONS,
  SEASONS,
  SIZES,
} from '@/lib/constants';
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
  const [category, setCategory] = useState<Category>(item.category);
  const [color, setColor] = useState<Color>(item.color);
  const [occasions, setOccasions] = useState<Occasion[]>(item.occasions);
  const [season, setSeason] = useState<Season>(item.season);
  const [brand, setBrand] = useState(item.brand);
  const [size, setSize] = useState<Size>(item.size);
  const [price, setPrice] = useState(item.price != null ? String(item.price) : '');
  const [notes, setNotes] = useState(item.notes);
  const [saving, setSaving] = useState(false);
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

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-foreground/40 backdrop-blur-[2px] sm:items-center sm:p-4">
      <div className="max-h-[90svh] w-full max-w-lg overflow-y-auto rounded-t-[1.5rem] bg-surface-elevated shadow-xl sm:rounded-[1.5rem]">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border/60 bg-surface-elevated px-5 py-4">
          <h2 className="font-display text-lg font-semibold">Edit item</h2>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer text-sm font-semibold text-muted hover:text-foreground"
          >
            Cancel
          </button>
        </div>

        {/* Form */}
        <div className="space-y-4 p-5">
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
                  <option key={c} value={c}>{c}</option>
                ))}
                {!CATEGORIES.includes(category) && (
                  <option value={category}>{category}</option>
                )}
              </select>
            </label>
            <label className="block space-y-1.5">
              <span className="text-sm font-semibold">Color</span>
              <select
                value={color}
                onChange={(e) => setColor(e.target.value as Color)}
                className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm outline-none focus:border-accent"
              >
                {COLORS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </label>
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
                  <option key={s} value={s}>{s}</option>
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
                  <option key={s || 'none'} value={s}>{s || 'Not set'}</option>
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
            <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          )}

          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving}
            className="w-full cursor-pointer rounded-2xl bg-accent py-3.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
