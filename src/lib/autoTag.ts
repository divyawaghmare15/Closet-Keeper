import { detectDominantColor } from '@/lib/imageProcess';
import type { AutoTagResult, Category } from '@/types';

/** Fast local tags only — no API round-trip. Prefer for bulk import. */
export async function autoTagFromImageLocal(
  imageUrl: string,
  fallbackTitle = '',
): Promise<AutoTagResult> {
  const color = await detectDominantColor(imageUrl);
  const category: Category = 'Top';
  const cleaned = fallbackTitle.trim();

  return {
    title: cleaned || `${color} ${category.toLowerCase()}`,
    category,
    color,
    occasions: ['Casual'],
    season: 'All-Season',
    brand: '',
  };
}

export async function autoTagFromImage(imageUrl: string): Promise<AutoTagResult> {
  try {
    const response = await fetch('/api/auto-tag', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: imageUrl }),
    });

    if (response.ok) {
      const payload = (await response.json()) as { tags?: AutoTagResult };
      if (payload.tags) return payload.tags;
    }
  } catch {
    // fall through to local heuristic
  }

  return autoTagFromImageLocal(imageUrl);
}
