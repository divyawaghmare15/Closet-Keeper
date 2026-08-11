import type { Capsule, ClothingItem, Outfit } from '@/types';
import {
  normalizeCapsule,
  normalizeOutfit,
} from '@/lib/storageNormalize';

const OUTFITS_KEY = 'closet-keeper:outfits';
const CAPSULES_KEY = 'closet-keeper:capsules';

function canUseStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function readJson<T>(key: string, normalize: (value: unknown) => T | null): T[] {
  if (!canUseStorage()) return [];

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map(normalize)
      .filter((entry): entry is T => entry !== null);
  } catch {
    return [];
  }
}

function writeJson(key: string, value: unknown): void {
  if (!canUseStorage()) return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function getLocalOutfits(): Outfit[] {
  return readJson(OUTFITS_KEY, normalizeOutfit);
}

export function saveLocalOutfit(outfit: Outfit): Outfit {
  const normalized = normalizeOutfit({
    ...outfit,
    itemIds: outfit.itemIds.length
      ? outfit.itemIds
      : outfit.items.map((item) => item.id),
    items: outfit.items,
  });
  if (!normalized) {
    throw new Error('Invalid outfit schema');
  }

  const outfits = getLocalOutfits();
  const index = outfits.findIndex((existing) => existing.id === normalized.id);

  if (index === -1) {
    outfits.unshift(normalized);
  } else {
    outfits[index] = normalized;
  }

  writeJson(OUTFITS_KEY, outfits);
  return normalized;
}

export function deleteLocalOutfit(id: string): boolean {
  const outfits = getLocalOutfits();
  const next = outfits.filter((outfit) => outfit.id !== id);
  if (next.length === outfits.length) return false;
  writeJson(OUTFITS_KEY, next);
  return true;
}

export function toggleLocalOutfitFavorite(id: string): Outfit | null {
  const outfits = getLocalOutfits();
  const index = outfits.findIndex((outfit) => outfit.id === id);
  if (index === -1) return null;

  const updated: Outfit = {
    ...outfits[index],
    isFavorite: !outfits[index].isFavorite,
  };
  outfits[index] = updated;
  writeJson(OUTFITS_KEY, outfits);
  return updated;
}

export function clearLocalOutfits(): void {
  if (!canUseStorage()) return;
  window.localStorage.removeItem(OUTFITS_KEY);
}

export function countLocalOutfits(): number {
  return getLocalOutfits().length;
}

export function getLocalCapsules(): Capsule[] {
  return readJson(CAPSULES_KEY, normalizeCapsule);
}

export function saveLocalCapsule(capsule: Capsule): Capsule {
  const normalized = normalizeCapsule(capsule);
  if (!normalized) {
    throw new Error('Invalid capsule schema');
  }

  const capsules = getLocalCapsules();
  const index = capsules.findIndex((existing) => existing.id === normalized.id);

  if (index === -1) {
    capsules.unshift(normalized);
  } else {
    capsules[index] = normalized;
  }

  writeJson(CAPSULES_KEY, capsules);
  return normalized;
}

export function deleteLocalCapsule(id: string): boolean {
  const capsules = getLocalCapsules();
  const next = capsules.filter((capsule) => capsule.id !== id);
  if (next.length === capsules.length) return false;
  writeJson(CAPSULES_KEY, next);
  return true;
}

export function clearLocalCapsules(): void {
  if (!canUseStorage()) return;
  window.localStorage.removeItem(CAPSULES_KEY);
}

export function countLocalCapsules(): number {
  return getLocalCapsules().length;
}

export function resolveOutfitItems(
  outfit: Outfit,
  wardrobe: ClothingItem[],
): ClothingItem[] {
  const byId = new Map(wardrobe.map((item) => [item.id, item]));
  const snapshotById = new Map(outfit.items.map((item) => [item.id, item]));
  const ids = outfit.itemIds.length
    ? outfit.itemIds
    : outfit.items.map((item) => item.id);

  return ids
    .map((id) => byId.get(id) ?? snapshotById.get(id))
    .filter((item): item is ClothingItem => item !== undefined);
}
