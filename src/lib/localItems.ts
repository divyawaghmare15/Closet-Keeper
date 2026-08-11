import type { ClothingItem } from '@/types';
import { normalizeItem } from '@/lib/storageNormalize';

const ITEMS_KEY = 'closet-keeper:items';

function canUseStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function readItems(): ClothingItem[] {
  if (!canUseStorage()) return [];

  try {
    const raw = window.localStorage.getItem(ITEMS_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map(normalizeItem)
      .filter((item): item is ClothingItem => item !== null);
  } catch {
    return [];
  }
}

function writeItems(items: ClothingItem[]): void {
  if (!canUseStorage()) return;
  window.localStorage.setItem(ITEMS_KEY, JSON.stringify(items));
}

export function getLocalItems(): ClothingItem[] {
  return readItems();
}

export function saveLocalItem(item: ClothingItem): ClothingItem {
  const normalized = normalizeItem(item);
  if (!normalized) {
    throw new Error('Invalid clothing item schema');
  }

  const items = readItems();
  const index = items.findIndex((existing) => existing.id === normalized.id);

  if (index === -1) {
    items.push(normalized);
  } else {
    items[index] = normalized;
  }

  writeItems(items);
  return normalized;
}

export function saveLocalItems(newItems: ClothingItem[]): ClothingItem[] {
  const items = readItems();
  const byId = new Map(items.map((item) => [item.id, item]));

  for (const item of newItems) {
    const normalized = normalizeItem(item);
    if (!normalized) continue;
    byId.set(normalized.id, normalized);
  }

  const next = Array.from(byId.values());
  writeItems(next);
  return next;
}

export function deleteLocalItem(id: string): boolean {
  const items = readItems();
  const next = items.filter((item) => item.id !== id);
  if (next.length === items.length) return false;
  writeItems(next);
  return true;
}

export function toggleLocalCleanStatus(id: string): ClothingItem | null {
  const items = readItems();
  const index = items.findIndex((item) => item.id === id);
  if (index === -1) return null;

  const updated: ClothingItem = {
    ...items[index],
    isClean: !items[index].isClean,
  };
  items[index] = updated;
  writeItems(items);
  return updated;
}

export function markLocalItemsWorn(
  ids: string[],
  wornAt = new Date().toISOString(),
): void {
  const idSet = new Set(ids);
  const items = readItems().map((item) =>
    idSet.has(item.id)
      ? { ...item, lastWornDate: wornAt, isClean: false }
      : item,
  );
  writeItems(items);
}

export function clearLocalItems(): void {
  if (!canUseStorage()) return;
  window.localStorage.removeItem(ITEMS_KEY);
}

export function countLocalItems(): number {
  return readItems().length;
}
