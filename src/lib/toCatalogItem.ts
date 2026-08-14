import type { ClothingItem, OutfitCatalogItem } from '@/types';

export function daysSinceWorn(lastWornDate: string | null): number | null {
  if (!lastWornDate) return null;
  const days =
    (Date.now() - new Date(lastWornDate).getTime()) / (1000 * 60 * 60 * 24);
  return Number.isNaN(days) ? null : Math.max(0, Math.round(days));
}

export function toCatalogItem(item: ClothingItem): OutfitCatalogItem {
  return {
    id: item.id,
    title: item.title,
    category: item.category,
    color: item.color,
    occasions: item.occasions,
    season: item.season,
    isClean: item.isClean,
    daysSinceWorn: daysSinceWorn(item.lastWornDate),
    brand: item.brand,
  };
}
