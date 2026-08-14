import { toCatalogItem } from '@/lib/toCatalogItem';
import type { ClothingItem, Occasion, Outfit, Season } from '@/types';

export async function suggestOutfitsFromCloset(
  items: ClothingItem[],
  occasion: Occasion,
  options: { season?: Season | 'Any'; cleanOnly?: boolean } = {},
): Promise<{ outfits: Outfit[]; source: 'ai' | 'rules' }> {
  const response = await fetch('/api/suggest-outfits', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      occasion,
      season: options.season ?? 'Any',
      cleanOnly: options.cleanOnly ?? true,
      items: items.map(toCatalogItem),
    }),
  });

  const payload = (await response.json()) as {
    outfits?: Outfit[];
    source?: 'ai' | 'rules';
    error?: string;
  };

  if (!response.ok) {
    throw new Error(payload.error || 'Could not suggest outfits');
  }

  const byId = new Map(items.map((item) => [item.id, item]));
  const outfits = (payload.outfits ?? [])
    .map((outfit) => {
      const resolved = outfit.itemIds
        .map((id) => byId.get(id))
        .filter((item): item is ClothingItem => Boolean(item));
      return {
        ...outfit,
        items: resolved,
        itemIds: resolved.map((item) => item.id),
      };
    })
    .filter((outfit) => outfit.items.length > 0);

  return { outfits, source: payload.source ?? 'ai' };
}
