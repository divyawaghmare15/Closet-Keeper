import { COLOR_CLASHES, NEUTRAL_COLORS } from '@/lib/constants';
import type { ClothingItem, Color, Occasion, Outfit, Season } from '@/types';

function bucketByCategory(items: ClothingItem[]) {
  return {
    tops: items.filter(
      (item) =>
        item.category === 'Top' ||
        item.category === 'Kurti' ||
        item.category === 'Corset',
    ),
    bottoms: items.filter((item) => item.category === 'Bottom'),
    onePieces: items.filter(
      (item) => item.category === 'One-Piece' || item.category === 'Saree',
    ),
    layers: items.filter((item) => item.category === 'Layer'),
    footwear: items.filter((item) => item.category === 'Footwear'),
    accessories: items.filter((item) => item.category === 'Accessory'),
  };
}

function colorsClash(a: Color, b: Color): boolean {
  return COLOR_CLASHES.some(
    ([x, y]) => (a === x && b === y) || (a === y && b === x),
  );
}

function isNeutral(color: Color): boolean {
  return NEUTRAL_COLORS.includes(color);
}

/** Higher is better. */
function colorHarmonyScore(colors: Color[]): number {
  if (colors.length <= 1) return 20;

  let score = 30;
  const unique = [...new Set(colors)];

  for (let i = 0; i < unique.length; i++) {
    for (let j = i + 1; j < unique.length; j++) {
      if (colorsClash(unique[i], unique[j])) score -= 25;
      else if (isNeutral(unique[i]) || isNeutral(unique[j])) score += 8;
      else if (unique[i] === unique[j]) score += 6;
      else score += 2;
    }
  }

  const nonNeutral = unique.filter((color) => !isNeutral(color));
  if (nonNeutral.length > 2) score -= (nonNeutral.length - 2) * 6;

  return score;
}

function seasonCompatible(itemSeason: Season, target?: Season | 'Any'): boolean {
  if (!target || target === 'Any' || target === 'All-Season') return true;
  return itemSeason === 'All-Season' || itemSeason === target;
}

function wearBonus(items: ClothingItem[]): number {
  let bonus = 0;
  const now = Date.now();

  for (const item of items) {
    if (item.lastWornDate === null) {
      bonus += 18;
      continue;
    }
    const days =
      (now - new Date(item.lastWornDate).getTime()) / (1000 * 60 * 60 * 24);
    if (Number.isNaN(days)) continue;
    if (days > 30) bonus += 14;
    else if (days > 14) bonus += 8;
    else if (days > 7) bonus += 4;
  }

  return bonus;
}

function versatilityBonus(items: ClothingItem[]): number {
  return items.reduce((sum, item) => sum + Math.min(item.occasions.length, 3), 0);
}

function pickWeighted(
  candidates: ClothingItem[],
  usedIds: Set<string>,
  seed: number,
  coreColors: Color[],
): ClothingItem | undefined {
  const pool = candidates.filter((item) => !usedIds.has(item.id));
  if (pool.length === 0) return undefined;

  const scored = pool.map((item, index) => {
    const harmony = colorHarmonyScore([...coreColors, item.color]);
    const wear = wearBonus([item]);
    const jitter = ((seed + index * 17) % 11) - 5;
    return { item, score: harmony + wear + jitter };
  });

  scored.sort((a, b) => b.score - a.score);
  const top = scored.slice(0, Math.min(3, scored.length));
  return top[(seed + top.length) % top.length]?.item;
}

function buildOutfit(
  occasion: Occasion,
  core: ClothingItem[],
  extras: ClothingItem[],
  index: number,
  matchScore: number,
): Outfit {
  const items = [...core, ...extras];
  const titleParts = core.map((item) => item.title);
  const title =
    titleParts.length === 1
      ? titleParts[0]
      : `${titleParts[0]} + ${titleParts[1]}`;

  return {
    id: `outfit-${occasion}-${index}-${crypto.randomUUID().slice(0, 8)}`,
    title,
    occasion,
    items,
    itemIds: items.map((item) => item.id),
    isFavorite: false,
    createdDate: new Date().toISOString(),
    matchScore,
  };
}

function scoreOutfit(items: ClothingItem[]): number {
  return (
    colorHarmonyScore(items.map((item) => item.color)) +
    wearBonus(items) +
    versatilityBonus(items)
  );
}

export interface GenerateOptions {
  season?: Season | 'Any';
  seed?: number;
  limit?: number;
}

/**
 * Smarter outfit generator:
 * - Clean + occasion (+ optional season)
 * - Color harmony scoring
 * - Least-worn preference with seed-based variety
 * - Optional layer, footwear, accessory slots
 */
export function generateOutfits(
  items: ClothingItem[],
  occasion: Occasion,
  options: GenerateOptions = {},
): Outfit[] {
  const { season = 'Any', seed = Date.now(), limit = 24 } = options;

  const eligible = items.filter(
    (item) =>
      item.isClean &&
      item.occasions.includes(occasion) &&
      seasonCompatible(item.season, season),
  );

  const { tops, bottoms, onePieces, layers, footwear, accessories } =
    bucketByCategory(eligible);

  const outfits: Outfit[] = [];
  let index = 0;

  for (const top of tops) {
    for (const bottom of bottoms) {
      const coreColors = [top.color, bottom.color];
      if (colorHarmonyScore(coreColors) < 0) continue;

      const usedIds = new Set([top.id, bottom.id]);
      const extras: ClothingItem[] = [];

      const layer = pickWeighted(layers, usedIds, seed + index, coreColors);
      if (layer) {
        usedIds.add(layer.id);
        extras.push(layer);
      }

      const shoe = pickWeighted(
        footwear,
        usedIds,
        seed + index + 3,
        [...coreColors, ...extras.map((e) => e.color)],
      );
      if (shoe) {
        usedIds.add(shoe.id);
        extras.push(shoe);
      }

      const accessory = pickWeighted(
        accessories,
        usedIds,
        seed + index + 7,
        [...coreColors, ...extras.map((e) => e.color)],
      );
      if (accessory) extras.push(accessory);

      const all = [top, bottom, ...extras];
      outfits.push(
        buildOutfit(occasion, [top, bottom], extras, index++, scoreOutfit(all)),
      );
    }
  }

  for (const onePiece of onePieces) {
    const coreColors = [onePiece.color];
    const usedIds = new Set([onePiece.id]);
    const extras: ClothingItem[] = [];

    const layer = pickWeighted(layers, usedIds, seed + index, coreColors);
    if (layer) {
      usedIds.add(layer.id);
      extras.push(layer);
    }

    const shoe = pickWeighted(
      footwear,
      usedIds,
      seed + index + 5,
      [...coreColors, ...extras.map((e) => e.color)],
    );
    if (shoe) {
      usedIds.add(shoe.id);
      extras.push(shoe);
    }

    const accessory = pickWeighted(
      accessories,
      usedIds,
      seed + index + 9,
      [...coreColors, ...extras.map((e) => e.color)],
    );
    if (accessory) extras.push(accessory);

    const all = [onePiece, ...extras];
    outfits.push(
      buildOutfit(occasion, [onePiece], extras, index++, scoreOutfit(all)),
    );
  }

  return outfits
    .sort((a, b) => (b.matchScore ?? 0) - (a.matchScore ?? 0))
    .slice(0, limit);
}
