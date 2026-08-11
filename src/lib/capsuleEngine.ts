import type { ClothingItem, Occasion, Season } from '@/types';

function seasonOk(item: ClothingItem, season: Season): boolean {
  return item.season === 'All-Season' || item.season === season;
}

function coversOccasion(item: ClothingItem, occasions: Occasion[]): boolean {
  return occasions.some((occasion) => item.occasions.includes(occasion));
}

function versatility(item: ClothingItem, occasions: Occasion[]): number {
  return item.occasions.filter((occasion) => occasions.includes(occasion)).length;
}

/**
 * Build a compact capsule: prefer versatile, season-fit pieces that cover
 * required categories for the selected occasions.
 */
export function buildCapsuleItems(
  wardrobe: ClothingItem[],
  occasions: Occasion[],
  season: Season,
  targetCount: number,
): ClothingItem[] {
  if (occasions.length === 0 || targetCount <= 0) return [];

  const pool = wardrobe.filter(
    (item) => seasonOk(item, season) && coversOccasion(item, occasions),
  );

  const selected: ClothingItem[] = [];
  const selectedIds = new Set<string>();

  const takeBest = (
    candidates: ClothingItem[],
    count: number,
    preferCategory?: ClothingItem['category'],
  ) => {
    const ranked = candidates
      .filter((item) => !selectedIds.has(item.id))
      .filter((item) =>
        preferCategory ? item.category === preferCategory : true,
      )
      .sort((a, b) => {
        const scoreA =
          versatility(a, occasions) * 10 +
          (a.isClean ? 2 : 0) +
          (a.lastWornDate === null ? 3 : 0);
        const scoreB =
          versatility(b, occasions) * 10 +
          (b.isClean ? 2 : 0) +
          (b.lastWornDate === null ? 3 : 0);
        return scoreB - scoreA;
      });

    for (const item of ranked.slice(0, count)) {
      selected.push(item);
      selectedIds.add(item.id);
    }
  };

  // Core coverage first
  takeBest(pool, 2, 'Top');
  takeBest(pool, 2, 'Kurti');
  takeBest(pool, 2, 'Corset');
  takeBest(pool, 2, 'Bottom');
  takeBest(pool, 1, 'One-Piece');
  takeBest(pool, 1, 'Saree');
  takeBest(pool, 1, 'Layer');
  takeBest(pool, 1, 'Footwear');
  takeBest(pool, 1, 'Accessory');

  // Fill remaining slots with most versatile leftovers
  if (selected.length < targetCount) {
    takeBest(pool, targetCount - selected.length);
  }

  return selected.slice(0, targetCount);
}

export function capsuleCoverage(
  items: ClothingItem[],
  occasions: Occasion[],
): { covered: Occasion[]; missing: Occasion[] } {
  const covered = occasions.filter((occasion) =>
    items.some((item) => item.occasions.includes(occasion)),
  );
  const missing = occasions.filter((occasion) => !covered.includes(occasion));
  return { covered, missing };
}
