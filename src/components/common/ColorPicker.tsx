'use client';

import { useEffect, useMemo, useState } from 'react';
import { colorLabel, COLORS } from '@/lib/constants';
import { normalizeColorName } from '@/lib/storageNormalize';
import type { Color } from '@/types';

const CUSTOM_COLORS_KEY = 'ck_custom_colors';

const SWATCH_CLASSES: Record<string, string> = {
  Black: 'bg-black',
  White: 'bg-white border border-slate-300',
  Grey: 'bg-gray-500',
  Navy: 'bg-blue-900',
  Blue: 'bg-blue-500',
  Red: 'bg-red-600',
  Green: 'bg-green-600',
  Olive: 'bg-[#556B2F]',
  Beige: 'bg-amber-100',
  Brown: 'bg-amber-800',
  Pink: 'bg-pink-400',
  Purple: 'bg-purple-600',
  Yellow: 'bg-yellow-400',
  Orange: 'bg-orange-500',
  Maroon: 'bg-red-900',
  Cream: 'bg-amber-50 border border-slate-200',
  Teal: 'bg-teal-600',
  Gold: 'bg-yellow-600',
  Silver: 'bg-gray-300',
  Multicolor:
    'bg-gradient-to-br from-pink-400 via-yellow-300 to-blue-500',
};

function loadCustomColors(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(CUSTOM_COLORS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((v): v is string => typeof v === 'string')
      .map((v) => normalizeColorName(v))
      .filter((v): v is Color => Boolean(v))
      .filter((v) => !(COLORS as readonly string[]).includes(v));
  } catch {
    return [];
  }
}

function saveCustomColors(colors: string[]) {
  localStorage.setItem(CUSTOM_COLORS_KEY, JSON.stringify(colors.slice(0, 24)));
}

export function ColorPicker({
  value,
  onChange,
  variant = 'swatches',
}: {
  value: Color;
  onChange: (color: Color) => void;
  variant?: 'swatches' | 'select';
}) {
  const [customColors, setCustomColors] = useState<string[]>([]);
  const [customDraft, setCustomDraft] = useState('');
  const [showCustom, setShowCustom] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setCustomColors(loadCustomColors());
  }, []);

  useEffect(() => {
    if (!value) return;
    if ((COLORS as readonly string[]).includes(value)) return;
    setCustomColors((prev) => {
      if (prev.includes(value)) return prev;
      const next = [value, ...prev];
      saveCustomColors(next);
      return next;
    });
  }, [value]);

  const options = useMemo(() => {
    const extras = customColors.filter(
      (c) => !(COLORS as readonly string[]).includes(c),
    );
    return [...COLORS, ...extras];
  }, [customColors]);

  function applyCustom() {
    const next = normalizeColorName(customDraft);
    if (!next) {
      setError('Use letters, numbers, spaces (max 32).');
      return;
    }
    if (!(COLORS as readonly string[]).includes(next)) {
      setCustomColors((prev) => {
        const merged = [next, ...prev.filter((c) => c !== next)];
        saveCustomColors(merged);
        return merged;
      });
    }
    onChange(next);
    setCustomDraft('');
    setShowCustom(false);
    setError('');
  }

  if (variant === 'select') {
    return (
      <div className="space-y-2">
        <select
          value={
            options.includes(value) || (COLORS as readonly string[]).includes(value)
              ? value
              : value
              ? '__custom_current__'
              : 'Black'
          }
          onChange={(event) => {
            const next = event.target.value;
            if (next === '__add_custom__') {
              setShowCustom(true);
              return;
            }
            if (next === '__custom_current__') return;
            onChange(next as Color);
            setShowCustom(false);
          }}
          className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm outline-none focus:border-accent"
        >
          {options.map((c) => (
            <option key={c} value={c}>
              {colorLabel(c)}
            </option>
          ))}
          {value &&
            !options.includes(value) &&
            !(COLORS as readonly string[]).includes(value) && (
              <option value="__custom_current__">{value}</option>
            )}
          <option value="__add_custom__">+ Add custom color…</option>
        </select>
        {showCustom && (
          <CustomColorRow
            draft={customDraft}
            error={error}
            onDraftChange={(v) => {
              setCustomDraft(v);
              setError('');
            }}
            onApply={applyCustom}
            onCancel={() => {
              setShowCustom(false);
              setCustomDraft('');
              setError('');
            }}
          />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-xs text-muted">
          Selected: <span className="font-semibold text-foreground">{colorLabel(value)}</span>
        </p>
      </div>
      <div className="flex flex-wrap gap-2 p-0.5">
        {options.map((colorName) => {
          const active = value === colorName;
          const swatchClass = SWATCH_CLASSES[colorName] ?? 'bg-slate-400';
          return (
            <button
              key={colorName}
              type="button"
              title={colorLabel(colorName)}
              aria-label={colorLabel(colorName)}
              aria-pressed={active}
              onClick={() => {
                onChange(colorName as Color);
                setShowCustom(false);
              }}
              className={`size-7 rounded-full transition ${swatchClass} ${
                active
                  ? 'ring-2 ring-accent ring-offset-2 ring-offset-surface-elevated'
                  : 'hover:scale-110'
              }`}
            />
          );
        })}
        <button
          type="button"
          title="Add custom color"
          aria-label="Add custom color"
          aria-pressed={showCustom}
          onClick={() => setShowCustom((prev) => !prev)}
          className={`flex size-7 items-center justify-center rounded-full border border-dashed border-border bg-surface text-sm font-bold text-muted transition hover:border-accent hover:text-accent ${
            showCustom ? 'ring-2 ring-accent ring-offset-2 ring-offset-surface-elevated' : ''
          }`}
        >
          +
        </button>
      </div>
      {showCustom && (
        <CustomColorRow
          draft={customDraft}
          error={error}
          onDraftChange={(v) => {
            setCustomDraft(v);
            setError('');
          }}
          onApply={applyCustom}
          onCancel={() => {
            setShowCustom(false);
            setCustomDraft('');
            setError('');
          }}
        />
      )}
    </div>
  );
}

function CustomColorRow({
  draft,
  error,
  onDraftChange,
  onApply,
  onCancel,
}: {
  draft: string;
  error: string;
  onDraftChange: (value: string) => void;
  onApply: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex gap-2">
        <input
          type="text"
          value={draft}
          maxLength={32}
          placeholder="e.g. Sage, Wine, Olive Green"
          onChange={(event) => onDraftChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              onApply();
            }
            if (event.key === 'Escape') onCancel();
          }}
          className="min-w-0 flex-1 rounded-xl border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
          autoFocus
        />
        <button
          type="button"
          onClick={onApply}
          className="shrink-0 rounded-xl bg-accent px-3 py-2 text-sm font-semibold text-white"
        >
          Add
        </button>
      </div>
      {error ? (
        <p className="text-xs text-red-700">{error}</p>
      ) : (
        <p className="text-xs text-muted">Saved for next time on this device.</p>
      )}
    </div>
  );
}
